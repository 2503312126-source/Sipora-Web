# SIPORA — Sistem Informasi Pengelolaan Orangutan

**SIPORA** adalah platform konservasi berbasis web untuk memantau, merehabilitasi, dan melindungi orangutan yang terancam punah di Kalimantan dan Sumatera.

## Fitur Utama

- **Dashboard** — Overview populasi, statistik, grafik, dan aktivitas terkini
- **Informasi** — Manajemen data orangutan (CRUD) dengan tabel, kartu, dan pencarian
- **Laporan** — Pelaporan temuan orangutan oleh masyarakat dengan upload foto
- **Rehabilitasi** — Manajemen program rehabilitasi dengan tracking progress
- **Penanganan Laporan** — Kanban board untuk monitoring & tindak lanjut laporan (Admin)
- **Admin** — Manajemen pengguna dan laporan (Admin)
- **Multi-user** — Role Admin, Petugas, dan Viewer dengan pembatasan akses
- **Dark/Light Theme** — Toggle tema gelap dan terang

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript, Chart.js
- **Backend** (opsional): Node.js + Express + MySQL
- **Deployment**: GitHub Pages / Static hosting

## Cara Menjalankan

### Mode Statis (Tanpa Backend)

Buka `index.html` langsung di browser, atau deploy ke GitHub Pages / Vercel / Netlify.

Login: **admin** / **admin123**

### Mode Backend (Dengan Database)

1. Import `database/sipora.sql` ke MySQL
2. Konfigurasi koneksi di `server.js`
3. Jalankan:
   ```
   npm install
   node server.js
   ```
4. Buka `http://localhost:3000`

## Struktur Proyek

```
├── index.html          — Halaman utama SPA
├── style.css           — CSS utama (dark/light theme)
├── app.js              — Logika aplikasi utama
├── penanganan.css      — CSS halaman Kanban
├── penanganan.js       — Logika Kanban & drawer
├── server.js           — Backend Node.js + MySQL
├── package.json
├── api/                — REST API (PHP alternatif)
└── database/           — SQL schema
```

## Lisensi

© 2026 SIPORA Conservation Platform
