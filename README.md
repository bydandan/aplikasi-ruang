# Studio Regeneratif: Audit, Rancang, Uji

Permainan multiplayer untuk modul Regenerative Design (C5 mengevaluasi, C6 mencipta).
Satu server Node.js (Express + Socket.IO) menyajikan halaman dan mengurus ruang, tim, ronde, dan skor.

## Coba di komputer
    npm install
    npm start        # buka http://localhost:3000

Dosen klik "Buat ruang baru" dan mendapat kode 4 digit. Mahasiswa membuka alamat yang sama,
mengisi kode, nama tim, dan nama sendiri. Dosen menggerakkan ronde lewat bilah atas.

## Deploy gratis (Render, Railway, Koyeb, dsb.)
1. Unggah folder ini ke repositori GitHub.
2. Buat "Web Service" baru dari repositori itu. Build command: `npm install`. Start command: `npm start`.
3. Bagikan alamat yang diberikan layanan itu kepada mahasiswa.

Catatan paket gratis:
- Server bisa "tidur" bila lama tidak dipakai. Buka alamatnya 1-2 menit sebelum kelas.
- Data ruang disimpan di memori. Jika server restart, ruang hilang. Klik "Unduh hasil (CSV)" sebelum menutup sesi.
- Syarat paket gratis berubah-ubah; cek halaman harga layanan yang dipilih.

## Menyesuaikan isi
Semua konten ada di bagian atas `server.js`: soal Gerbang (`Q`), kartu klaim dan kuncinya (`C`, k = V/D/M),
dan kartu tantangan (`DECK`). Periksa ulang kunci `C` dengan hasil verifikasi Anda sebelum dipakai di kelas.
Durasi ronde ada di `MNT` (menit).

## Skor
Auditor = Gerbang + Audit (kecocokan penilaian dengan kunci, alasan minimal 40 karakter) + Gugatan/Jawaban (+2 per teks terkirim) + Suara Ronde 2 (+2 per suara yang diterima).
Setiap tim memberi satu suara untuk satu gugatan atau jawaban tim lain; suara untuk tim sendiri ditolak server.
Perancang = jumlah rata-rata empat kriteria dari penilai. Penilai = kedekatan skor dengan rata-rata penilai lain.
Skor hanya umpan balik; nilai akademik sebaiknya dari rubrik dosen.
