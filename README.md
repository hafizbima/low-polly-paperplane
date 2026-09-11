# Paperflight

Game endless flyer 3D berdasarkan `endless-flyer-pesawat-kertas-requirements.md`.

## Menjalankan

```sh
npm install
npm run dev
```

Buka URL lokal yang dicetak Vite. Gunakan tombol arah/WASD atau swipe untuk berpindah pada grid 3×3. Spasi memulai atau menjeda; Escape menjeda. Tab yang tersembunyi otomatis menjeda permainan.

```sh
npm test
npm run build
npm run preview
```

Tiga biome berganti setiap 500 meter. Pilih Easy (3–5 rintangan), Medium (4–7), atau Hard (6–8) sebelum mulai/main ulang. Medium menjadi pilihan awal. Setiap level memiliki kecepatan dan interval gelombang berbeda; setidaknya satu sel selalu kosong. Rekor terbaik masih digabung untuk semua level. Rekor disimpan di localStorage. Geometri dibuat langsung tanpa aset berat; objek latar menggunakan instancing. PWA/service worker aktif pada build produksi, menyimpan aset yang telah dimuat untuk penggunaan offline. Font menggunakan fallback sistem ketika offline.

## Firebase Hosting

Konfigurasi tersedia di `firebase.json`. Setelah memilih proyek Firebase milik Anda dan memasang Firebase CLI, jalankan `firebase deploy --only hosting --project ID_PROYEK` setelah build. Belum ada deployment atau proyek Firebase yang dipilih.

Audio dan leaderboard online tidak termasuk fase 1. Target 60 fps perlu pengujian pada perangkat mobile nyata. Rintangan biome memakai representasi geometris sederhana (balok buku/gedung dan awan polihedral).

