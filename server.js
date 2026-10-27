const express = require('express'), { createServer } = require('http'), { Server } = require('socket.io');
const app = express(), srv = createServer(app), io = new Server(srv);
app.use(express.static(__dirname + '/public'));
const R = {}, S = {};
const rnd = n => Math.floor(Math.random() * n), pick = a => a[rnd(a.length)];
const NAMA = ['Lobi', 'Ronde 0: Gerbang', 'Ronde 1: Audit Klaim', 'Ronde 2: Kartu Gugatan', 'Ronde 3: Studio Rancang', 'Ronde 4: Panel Uji', 'Hasil'];
const MNT = [0, 8, 20, 15, 30, 15, 0];
// Kunci jawaban hanya ada di server.
const Q = [
  { q: 'Sustainable design pada umumnya berupaya...', o: ['meminimalkan dampak negatif', 'membangun sistem yang terus memperkuat kehidupan', 'menghentikan semua produksi'], a: 0 },
  { q: 'Tokoh yang mengangkat istilah regenerative design ke ranah desain adalah...', o: ['Michael Braungart', 'John T. Lyle', 'Dieter Rams'], a: 1 },
  { q: 'Cradle-to-cradle (McDonough & Braungart) termasuk kategori...', o: ['Produk dan material', 'Bangunan dan lanskap', 'Sistem dan rantai pasok'], a: 0 },
  { q: 'Target "net-positive" berarti dampak akhir...', o: ['netral bagi sistem', 'positif bagi sistem, bukan sekadar netral', 'lebih kecil dari sebelumnya'], a: 1 },
  { q: 'Michelin Fleet Solutions (ban disewa, bayar per mil) tergolong kategori...', o: ['Produk dan material', 'Bangunan dan lanskap', 'Sistem dan rantai pasok'], a: 2 }];
// k: V = Terverifikasi, D = Perlu Data, M = Menyesatkan. Sesuaikan dengan hasil verifikasi Anda.
const C = [
  { t: 'Jejak karbon ubin karpet Interface turun 66% sejak 1996 (laporan 2017), lalu 69% (data hingga 2018). Angkanya bertentangan, jadi laporan Interface tidak bisa dipercaya.', clue: 'Angka pertama dari laporan 2017; angka kedua memakai cakupan cradle-to-gate dengan data hingga 2018.', k: 'M' },
  { t: 'Kampoeng Reklamasi Air Jangkang telah mereklamasi 97,6 hektare lahan pada kuartal I 2023.', clue: 'Angka 97,6 hektare dilaporkan PT Timah untuk reklamasi perusahaan secara keseluruhan.', k: 'M' },
  { t: 'Program ReEntry Interface mengalihkan 360 juta pon karpet pascakonsumen dari tempat pembuangan akhir hingga 2017.', clue: 'Sumbernya siaran pers perusahaan sendiri; modul menyebut angka belum diaudit independen.', k: 'D' },
  { t: 'Kampoeng Reklamasi Air Jangkang diresmikan Ditjen Minerba pada 27 Desember 2019.', clue: 'Tercatat di situs resmi Kementerian ESDM (Ditjen Minerba), lengkap dengan tanggal.', k: 'V' },
  { t: 'Buku Lyle terbit tahun 1994, sehingga tahun 1996 pasti salah.', clue: 'Katalog Wiley menulis 1994, tetapi beberapa sumber sekunder menulis 1996; modul meminta pengecekan sumber primer.', k: 'D' },
  { t: 'Semua program take-back pada Bagian 6 membuktikan bahwa produknya regeneratif.', clue: 'Take-back mengurangi limbah, tetapi belum tentu net-positive; angka dilaporkan sendiri, dan Fairphone 5 belum punya program pengambilan modul bekas.', k: 'M' }];
const DECK = {
  sektor: ['Pangan', 'Kemasan plastik', 'Tekstil', 'Konstruksi', 'Elektronik'],
  konteks: ['UMKM perajin daerah', 'Material lokal atau kearifan lokal', 'Kampus atau sekolah', 'Kawasan bekas tambang'],
  kendala: ['Biaya awal material lebih tinggi', 'Konsumen belum sadar produk sirkular', 'Belum ada standar atau sertifikasi', 'Sebagian bahan harus impor'],
  pola: ['Layanan sewa (bayar per pakai)', 'Desain untuk perbaikan', 'Pengembalian sebagai bagian dari pembelian', 'Insentif untuk pengguna']
};
const deal = () => ({ sektor: pick(DECK.sektor), konteks: pick(DECK.konteks), kendala: pick(DECK.kendala), pola: pick(DECK.pola) });
const FD = ['nama', 'material', 'skema', 'risiko', 'insentif', 'indikator', 'uji'];
const T0 = n => ({ name: n, m: {}, q: {}, a: [], why: '', coin: 5, cl: [], g: '', rep: '', card: null, d: {}, r: {}, vt: null });
const ids = r => Object.keys(r.teams).sort();
const nxt = (r, t, k = 1) => { const a = ids(r); return a[(a.indexOf(t) + k) % a.length]; };
const asg = (r, t) => [1, 2].map(k => nxt(r, t, k)).filter((y, i, a) => y !== t && a.indexOf(y) === i);
const lab = (r, y) => 'Rancangan ' + String.fromCharCode(65 + ids(r).indexOf(y));

// Satu suara per tim untuk satu argumen (gugatan 'g' atau jawaban 'r') pada pertukaran yang diawali tim x.
const votes = r => { const o = {}; ids(r).forEach(i => o[i] = 0); ids(r).forEach(i => { const v = r.teams[i].vt; if (!v || !r.teams[v.x]) return; const u = v.s === 'g' ? v.x : nxt(r, v.x); o[u] = (o[u] || 0) + 1; }); return o; };

function skor(r) {
  const I = ids(r), out = {}, avg = {}, VT = votes(r);
  I.forEach(x => {
    const all = I.map(y => r.teams[y].r[x]).filter(Boolean);
    avg[x] = [0, 1, 2, 3].map(k => all.length ? all.reduce((s, v) => s + (v.s[k] || 0), 0) / all.length : 0);
  });
  I.forEach(t => {
    const T = r.teams[t], n = Object.keys(T.m).length || 1;
    let c0 = 0; for (const p in T.q) T.q[p].forEach((a, i) => { if (Q[i] && a === Q[i].a) c0++; });
    const g1 = C.reduce((s, c, i) => s + (T.a[i] === c.k ? 2 : 0), 0) + (T.why.trim().length >= 40 ? 3 : 0);
    const g2 = (T.g.trim() ? 2 : 0) + (T.rep.trim() ? 2 : 0) + 2 * VT[t];
    let pen = 0;
    for (const x of I) { const v = T.r[x]; if (v) pen += Math.max(0, 4 - [0, 1, 2, 3].reduce((s, k) => s + Math.abs((v.s[k] || 0) - avg[x][k]), 0) / 4); }
    const auditor = Math.round(c0 / n) + g1 + g2, perancang = Math.round(avg[t].reduce((a, b) => a + b, 0)), penilai = Math.round(pen);
    out[t] = { nama: T.name, auditor, perancang, penilai, total: auditor + perancang + penilai };
  });
  return out;
}

function view(r, x) {
  const I = ids(r), T = r.teams, t = x.t && T[x.t];
  const v = { code: r.code, ph: r.ph, nama: NAMA[r.ph], end: r.end, host: !!x.h, tim: I.map(i => ({ nama: T[i].name, n: Object.keys(T[i].m).length })) };
  if (x.h) {
    const VT0 = votes(r);
    v.mon = I.map(i => { const q = T[i]; return { suara: VT0[i], nama: q.name, anggota: Object.keys(q.m), q: q.q, a: q.a, why: q.why, g: q.g, rep: q.rep, card: q.card, d: q.d, r: q.r }; });
    v.skor = skor(r); v.C = C.map(c => c.t);
    return v;
  }
  if (!t) return v;
  if (r.ph >= 4 && !t.card) t.card = deal();
  v.me = x.n; v.tid = x.t; v.tnama = t.name;
  if (r.ph === 1) { v.Q = Q.map(q => ({ q: q.q, o: q.o })); v.myq = t.q[x.n] || []; }
  if (r.ph === 2) { v.C = C.map((c, i) => ({ t: c.t, clue: t.cl.includes(i) ? c.clue : null })); v.a = t.a; v.why = t.why; v.coin = t.coin; }
  if (r.ph === 3 && I.length > 1) {
    const tg = T[nxt(r, x.t)], at = T[nxt(r, x.t, I.length - 1)];
    v.target = tg.name; v.g = t.g; v.reply = tg.rep; v.attacker = at.name; v.gin = at.g; v.rep = t.rep; v.vt = t.vt;
    v.ex = I.filter(a => a !== x.t && nxt(r, a) !== x.t).map(a => ({ id: a, an: T[a].name, tn: T[nxt(r, a)].name, g: T[a].g, rep: T[nxt(r, a)].rep }));
  }
  if (r.ph >= 4) { v.card = t.card; v.d = t.d; }
  if (r.ph === 5) v.rev = asg(r, x.t).map(y => ({ id: y, label: lab(r, y), card: T[y].card, d: T[y].d, r: t.r[y] || null }));
  if (r.ph === 6) { v.skor = skor(r); v.tid = x.t; }
  return v;
}
function push(r) {
  const sids = io.sockets.adapter.rooms.get(r.code); if (!sids) return;
  for (const id of sids) { const x = S[id], so = io.sockets.sockets.get(id); if (x && so) so.emit('state', view(r, x)); }
}

io.on('connection', s => {
  const me = () => { const x = S[s.id], r = x && R[x.c]; return r && x.t && r.teams[x.t] ? { r, T: r.teams[x.t], x } : null; };
  const host = () => { const x = S[s.id], r = x && x.h && R[x.c]; return r || null; };
  s.on('host', cb => {
    let c; do c = String(1000 + rnd(9000)); while (R[c]);
    R[c] = { code: c, key: Math.random().toString(36).slice(2), ph: 0, end: 0, teams: {} };
    S[s.id] = { c, h: 1 }; s.join(c); cb({ c, key: R[c].key }); push(R[c]);
  });
  s.on('hostback', ({ c, key }, cb) => {
    const r = R[c]; if (!r || r.key !== key) return cb({ err: 'Ruang tidak ditemukan' });
    S[s.id] = { c, h: 1 }; s.join(c); cb({ ok: 1 }); push(r);
  });
  s.on('join', ({ c, team, name }, cb) => {
    const r = R[String(c || '').trim()]; team = String(team || '').trim().slice(0, 24); name = String(name || '').trim().slice(0, 24);
    if (!r) return cb({ err: 'Kode ruang tidak ditemukan' });
    if (!team || !name) return cb({ err: 'Isi nama tim dan nama Anda' });
    const id = team.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '_'), T = r.teams[id] || (r.teams[id] = T0(team));
    T.m[name] = 1; S[s.id] = { c: r.code, t: id, n: name }; s.join(r.code); cb({ ok: 1, c: r.code, team: T.name, name }); push(r);
  });
  s.on('adv', d => { const r = host(); if (!r) return; r.ph = Math.max(0, Math.min(6, r.ph + (d > 0 ? 1 : -1))); r.end = MNT[r.ph] ? Date.now() + MNT[r.ph] * 60000 : 0; push(r); });
  s.on('ext', () => { const r = host(); if (!r || !r.end) return; r.end = Math.max(r.end, Date.now()) + 60000; push(r); });
  s.on('a0', ({ i, a }) => { const m = me(); if (!m || m.r.ph !== 1 || !Q[i]) return; (m.T.q[m.x.n] = m.T.q[m.x.n] || [])[i] = a; push(m.r); });
  s.on('v1', ({ i, v }) => { const m = me(); if (!m || m.r.ph !== 2 || !C[i] || !'VDM'.includes(v)) return; m.T.a[i] = v; push(m.r); });
  s.on('why', t => { const m = me(); if (!m || m.r.ph !== 2) return; m.T.why = String(t).slice(0, 600); push(m.r); });
  s.on('clue', i => { const m = me(); if (!m || m.r.ph !== 2 || !C[i] || m.T.cl.includes(i) || m.T.coin < 1) return; m.T.coin--; m.T.cl.push(i); push(m.r); });
  s.on('g', t => { const m = me(); if (!m || m.r.ph !== 3) return; m.T.g = String(t).slice(0, 280); push(m.r); });
  s.on('rep', t => { const m = me(); if (!m || m.r.ph !== 3) return; m.T.rep = String(t).slice(0, 280); push(m.r); });
  s.on('vote', ({ x, s: d }) => {
    const m = me(); if (!m || m.r.ph !== 3 || !m.r.teams[x] || !(d === 'g' || d === 'r')) return;
    const tg = nxt(m.r, x); if (x === m.x.t || tg === m.x.t || x === tg) return;
    if (!String(d === 'g' ? m.r.teams[x].g : m.r.teams[tg].rep).trim()) return;
    m.T.vt = { x, s: d }; push(m.r);
  });
  s.on('dz', ({ k, v }) => { const m = me(); if (!m || m.r.ph !== 4 || !FD.includes(k)) return; m.T.d[k] = String(v).slice(0, 700); push(m.r); });
  s.on('rate', ({ id, k, v }) => { const m = me(); if (!m || m.r.ph !== 5 || !asg(m.r, m.x.t).includes(id) || !(k >= 0 && k < 4) || !(v >= 1 && v <= 5)) return; const o = m.T.r[id] = m.T.r[id] || { s: [0, 0, 0, 0], saran: '' }; o.s[k] = v | 0; push(m.r); });
  s.on('saran', ({ id, t }) => { const m = me(); if (!m || m.r.ph !== 5 || !asg(m.r, m.x.t).includes(id)) return; const o = m.T.r[id] = m.T.r[id] || { s: [0, 0, 0, 0], saran: '' }; o.saran = String(t).slice(0, 400); push(m.r); });
  s.on('disconnect', () => delete S[s.id]);
});
setInterval(() => { for (const c in R) if (!io.sockets.adapter.rooms.get(c) && Date.now() - (R[c].t0 || (R[c].t0 = Date.now())) > 6 * 3600e3) delete R[c]; }, 600e3);
srv.listen(process.env.PORT || 3000, () => console.log('Studio Regeneratif berjalan di port ' + (process.env.PORT || 3000)));
