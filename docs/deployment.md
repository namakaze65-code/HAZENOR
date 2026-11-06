# Panduan Deployment Produksi

Lihat juga panduan lengkap pada [DEPLOYMENT_AND_USER_GUIDE.md](../DEPLOYMENT_AND_USER_GUIDE.md).

## 1. Deployment Menggunakan Docker Compose
Jalankan perintah berikut dari direktori utama proyek:
```bash
docker compose up -d --build
```
Layanan yang dijalankan:
- `hazenor-postgres` (PostgreSQL 16 Alpine pada port `5432`)
- `hazenor-backend` (Laravel 11 API + Migrasi & Seeder otomatis pada port `8000`)
- `hazenor-frontend` (Next.js Production Server pada port `3000`)

## 2. Daftar Periksa Launch Gate (Pra-Rilis)
- [x] Seluruh pengujian isolasi multi-tenant lulus (`php artisan test` — 7 passed, 56 assertions).
- [x] Alokasi pembayaran manual, pengembalian dana (*refund*), dan idempotensi webhook terverifikasi.
- [x] Token undangan penyewa sekali pakai (48 jam) terverifikasi.
- [x] Batas kuota unit paket berlangganan dan *snapshot* harga kontrak sewa terverifikasi.
