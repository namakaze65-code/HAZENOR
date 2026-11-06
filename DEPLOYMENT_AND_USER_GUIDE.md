# HAZENOR Properties — Property Management Platform
*"A Legacy Built on Trust."*

Dokumentasi lengkap arsitektur, penggunaan, dan panduan deployment produksi untuk platform manajemen properti dan penyewaan **HAZENOR Properties**.

---

## 1. Ringkasan Arsitektur

| Lapisan | Teknologi | Port Default | Keterangan |
| :--- | :--- | :--- | :--- |
| **Frontend Web & BFF** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS | `http://localhost:3000` | Menyediakan Landing Page, Portal Pemilik (`/owner`), Portal Penyewa (`/tenant`), Portal Administrator (`/super-admin`), serta BFF Proxy (`HttpOnly` cookie session). |
| **Backend API** | Laravel 11 REST API (`/api/v1/*`), Laravel Sanctum | `http://127.0.0.1:8000` | Mengelola isolasi multi-tenant (`organization_id`), penagihan otomatis, alokasi pembayaran, verifikasi bukti bayar, tiket keluhan, dan audit log. |
| **Database** | PostgreSQL 16 | `127.0.0.1:5432` | Menyimpan seluruh skema multi-tenant, snapshot harga unit, kontrak sewa, tagihan, pembayaran, dan log pengiriman WhatsApp. |

---

## 2. Akun Demo Siap Pakai

Database telah dilengkapi data awal (*seeder*) untuk organisasi **PT Berkah Properti Nusantara**:

- **Email Pemilik / Pengelola**: `owner@hazenor.id`
- **Kata Sandi**: `password123`
- **Akses Cepat**:
  - **Halaman Utama**: `http://localhost:3000`
  - **Halaman Masuk**: `http://localhost:3000/login`
  - **Portal Pemilik & Staf**: `http://localhost:3000/owner`
  - **Portal Penyewa**: `http://localhost:3000/tenant`
  - **Portal Administrator Platform**: `http://localhost:3000/super-admin`

---

## 3. Fitur Utama yang Tersedia

1. **Cetak & Unduh Invoice Resmi Berlogo HAZENOR Properties**:
   - Tersedia di **Portal Pemilik** (`/owner` → menu *Tagihan dan Pembayaran* → tombol **Cetak / PDF**) dan **Portal Penyewa** (`/tenant` → tombol **Lihat & Cetak Invoice Resmi**).
   - Mendukung cetak langsung ke PDF (`window.print()`) maupun pengunduhan dokumen HTML mandiri.
2. **Unggah & Pratinjau Gambar Bukti Transfer & Foto Keluhan**:
   - Penyewa dapat mengunggah gambar resi bukti transfer dan foto kendala unit dengan pratinjau langsung (*live preview*) di `/tenant`.
   - Pemilik/staf keuangan dapat membuka pratinjau bukti transfer dan *Signed URL* (10 menit) di `/owner`.
3. **Grafik Analitik Keuangan & Okupansi Eksekutif**:
   - Tersedia di tab **Ringkasan** pada `/owner`, menampilkan grafik tren tagihan vs pendapatan terverifikasi 6 bulan terakhir serta diagram *donut* komposisi hunian & rasio kolektibilitas.

---

## 4. Cara Menjalankan di Lingkungan Lokal (Windows / XAMPP + PostgreSQL 16)

### A. Backend (Laravel API)
```powershell
cd backend
& "C:\xampp\php\php.exe" artisan migrate
& "C:\xampp\php\php.exe" artisan db:seed
& "C:\xampp\php\php.exe" artisan serve --host=127.0.0.1 --port=8000
```

### B. Frontend (Next.js)
```powershell
cd frontend
npm install
npm run dev
```

### C. Menjalankan Pengujian Otomatis (Automated Tests)
```powershell
cd backend
& "C:\xampp\php\php.exe" artisan test
```

---

## 5. Cara Deployment Production dengan Docker Compose

Proyek ini telah dilengkapi `docker-compose.yml`, `backend/Dockerfile`, dan `frontend/Dockerfile`. Untuk menjalankan seluruh stack produksi (PostgreSQL 16 + Laravel API + Next.js Frontend):

```bash
docker compose up -d --build
```

Setelah container aktif:
- Frontend dapat diakses di `http://localhost:3000`
- Backend API berjalan di `http://localhost:8000/api/v1`
