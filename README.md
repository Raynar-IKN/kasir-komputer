# Kasir Komputer

## Menjalankan secara lokal

1. Salin `.env.example` menjadi `.env.local`, lalu isi konfigurasi MySQL dan rahasia secara lokal.
2. Jalankan `npm install`.
3. Jalankan `npm run dev`.

Seed admin hanya membaca `ADMIN_USERNAME` dan `ADMIN_PASSWORD` dari environment. Password seed minimal 8 karakter. Untuk memuat `.env.local` saat menjalankan seed dengan Node.js:

```bash
node --env-file=.env.local scripts/seed-admin.mjs
```

## Deploy ke Vercel dengan MySQL Railway

1. Siapkan database MySQL di Railway dan gunakan kredensial koneksi yang tersedia untuk akses dari Vercel.
2. Tambahkan `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_POOL_LIMIT`, dan `JWT_SECRET` pada Environment Variables project Vercel. `JWT_SECRET` wajib memiliki minimal 32 karakter; `DB_POOL_LIMIT` default-nya `5`.
3. Tambahkan `ADMIN_USERNAME` dan `ADMIN_PASSWORD` pada environment tempat seed dijalankan. Jangan gunakan kredensial contoh atau commit file `.env.local`.
4. Deploy aplikasi. Koneksi dan operasi tanggal MySQL dikonfigurasi untuk WIB (`Asia/Jakarta` / `+07:00`), termasuk ketika fungsi berjalan pada server UTC.

Jangan menaruh nilai rahasia dalam source code atau `.env.example`.
