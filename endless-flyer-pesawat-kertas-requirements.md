# Requirements Document: Endless Flyer – Pesawat Kertas

## 1. Ringkasan Proyek
Game web browser bergenre endless flyer/glider dengan gaya visual low poly. Pemain mengendalikan pesawat kertas yang terbang otomatis maju terus, dan harus menghindari rintangan yang muncul di jalurnya. Skor dihitung berdasarkan jarak tempuh — semakin jauh terbang tanpa menabrak, semakin tinggi skornya.

## 2. Tujuan & Target Platform
- Web-based, dapat dimainkan langsung di browser tanpa install.
- Nyaman dimainkan di **desktop** (mouse/keyboard) maupun **mobile** (touch), dengan layout dan kontrol yang menyesuaikan otomatis.
- Sesi main singkat (arcade-style, hitungan puluhan detik–beberapa menit per run), cocok untuk dimainkan berulang-ulang.

## 3. Genre & Konsep Inti
- Genre: Endless Flyer/Glider.
- Karakter: pesawat kertas (paper airplane), low poly, flat-shaded.
- Fokus gameplay: **hindari rintangan sejauh mungkin** — tidak ada koin/item koleksi maupun power-up di versi awal.

## 4. Mekanik Gameplay

### 4.1 Gerakan (Lane-Based)
- Pesawat bergerak maju otomatis secara konstan; pemain tidak mengontrol kecepatan maju secara langsung.
- Posisi pesawat berada dalam grid diskrit **3 lajur horizontal** (kiri / tengah / kanan) × **3 level ketinggian** (atas / tengah / bawah).
- Pemain memindahkan pesawat satu sel per input (bukan gerakan bebas/analog).
- Transisi antar sel disertai animasi singkat (~150ms) dengan efek *banking* (pesawat miring saat berbelok) agar terasa halus.

### 4.2 Rintangan & Tabrakan
- Rintangan muncul pada salah satu dari 9 sel grid di depan pesawat, digenerate secara procedural per-chunk.
- Tabrakan dideteksi dengan collision check sederhana (bounding box) antara posisi grid pesawat dan posisi grid rintangan — tidak perlu physics engine penuh.
- Saat tabrakan: animasi pesawat "kusut/robek" singkat, lalu transisi ke layar Game Over.

### 4.3 Skor & Progresi Kesulitan
- Skor = jarak tempuh (meter atau satuan waktu berjalan), ditampilkan real-time di HUD.
- Kecepatan maju meningkat bertahap seiring waktu/jarak.
- Kepadatan rintangan (jarak antar rintangan) mengecil seiring skor bertambah.
- Best distance/high score disimpan secara lokal (lihat juga bagian 11 untuk opsi online leaderboard).

## 5. Environment & Progresi Visual (Biome)
Dunia dibagi menjadi beberapa "babak" tematik yang berganti otomatis berdasarkan milestone jarak (mis. tiap 500m), sementara mekanik grid & rintangan tetap sama:

| Babak | Tema visual | Contoh rintangan |
|---|---|---|
| 1 | Dalam ruangan (keluar jendela kelas/kantor) | Buku menumpuk, lampu gantung, pintu |
| 2 | Kota | Kabel listrik, layang-layang, gedung, burung |
| 3 | Pegunungan/awan | Awan gelap (turbulensi), pohon tinggi, pesawat kertas lain |

Perubahan babak hanya mengganti palet warna, aset latar, dan jenis rintangan — struktur grid dan logika generation tetap satu sistem yang sama.

## 6. Kontrol

### 6.1 Desktop
- Arrow keys atau WASD untuk pindah lajur (kiri/kanan) dan ketinggian (atas/bawah).

### 6.2 Mobile
- Swipe kiri/kanan/atas/bawah untuk berpindah sel grid.
- Area sentuh mencakup seluruh layar (tidak perlu tombol overlay kecil yang sulit ditekan).

## 7. Gaya Visual (Art Direction)
- Low poly, flat-shaded (tanpa tekstur foto/gradient kompleks), palet warna cerah per babak.
- Pesawat kertas: geometri sederhana bersudut tajam (facet terlihat seperti lipatan kertas asli).
- Trail tipis memudar di belakang pesawat untuk kesan kecepatan.
- Fog jarak jauh untuk menyamarkan pop-in objek baru yang di-generate.
- Objek berulang (pohon, gedung, awan, dsb.) memakai instancing untuk menjaga performa tetap ringan di HP.

## 8. Struktur Layar / UI
- **Start Screen**: judul, tombol mulai, tampilan best distance.
- **In-Game HUD**: skor jarak berjalan (real-time), minimal, tidak menutupi area bermain.
- **Game Over Screen**: skor akhir, best distance, tombol main lagi.
- **(Opsional) Pengaturan**: tombol mute audio.

## 9. Tech Stack
- **Frontend**: React + Vite (konsisten dengan proyek web lain).
- **Rendering 3D**: react-three-fiber + drei (wrapper React untuk Three.js), untuk render low poly ringan di browser.
- **Collision**: custom logic berbasis posisi grid (bukan physics engine penuh) — cukup untuk mekanik lane-based ini.
- **Hosting**: Firebase Hosting.
- **(Opsional, Fase 2)** Firestore untuk online leaderboard.
- **PWA**: manifest + service worker agar bisa "Add to Home Screen" di mobile dan tetap ringan saat loading ulang.

## 10. Non-Functional Requirements
- Target 60fps di perangkat mobile kelas menengah.
- Ukuran aset kecil (low poly + tanpa tekstur berat) agar loading awal cepat di koneksi mobile Indonesia yang bervariasi.
- Canvas & kamera responsif terhadap perubahan ukuran/orientasi layar (portrait & landscape).
- Kontrol otomatis menyesuaikan jenis perangkat (deteksi touch vs keyboard/mouse).

## 11. Scope Fase 1 vs Fase Berikutnya
**Fase 1 (scope awal):**
- Mekanik dodge lane-based, 3 babak environment, skor jarak, best distance lokal.
- Tanpa koin, tanpa power-up, tanpa multiplayer, tanpa akun/login.

**Dipertimbangkan untuk fase berikutnya (belum masuk scope awal):**
- Online leaderboard via Firestore.
- Sistem koin/koleksi atau power-up (speed boost, shield, dll.).
- Tema/babak tambahan atau karakter pesawat alternatif (skin).

## 12. Asumsi & Pertanyaan Terbuka
- Audio (musik latar, sound effect tabrakan) belum dibahas detail — asumsi: opsional, ditambahkan belakangan jika diperlukan.
- Belum ditentukan apakah butuh akun/login untuk fase 1 — asumsi: tidak perlu, skor tersimpan lokal di browser saja (localStorage/IndexedDB setara).
- Detail exact jumlah babak dan jarak milestone pergantian babak masih bisa disesuaikan saat implementasi/playtesting.
