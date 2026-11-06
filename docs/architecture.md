# Arsitektur Sistem — HAZENOR Properties Platform

## 1. Pola Arsitektur
Platform **HAZENOR Properties** dibangun menggunakan pola **Modular Monolith** pada sisi backend (Laravel 11) yang dipasangkan dengan aplikasi frontend berbasis **Next.js 14 App Router** dan **Backend-for-Frontend (BFF) Proxy**.

### Pemisahan Tanggung Jawab
- **Frontend (`frontend/`)**:
  - Menyajikan 3 ruang kerja utama berbasis peran: Portal Pemilik & Staf (`/owner`), Portal Penyewa (`/tenant`), dan Portal Administrator Platform (`/super-admin`).
  - Menyimpan token autentikasi pada cookie `HttpOnly` melalui rute BFF (`/api/auth/*` dan `/api/proxy/[...path]`).
  - Tidak pernah mengakses database PostgreSQL secara langsung.
- **Backend (`backend/`)**:
  - Terbagi ke dalam modul domain terpisah di bawah `app/Modules/`: `Auth`, `Organization`, `Property`, `Unit`, `Tenant`, `Lease`, `Billing`, `Payment`, `Complaint`, `Notification`, `Subscription`, `Report`, dan `Audit`.
  - Menerapkan middleware `ResolveOrganizationContext` yang memvalidasi keanggotaan organisasi dan menyetel variabel sesi PostgreSQL `app.current_organization_id` untuk penegakan Row Level Security (RLS).
