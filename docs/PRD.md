# RUKO360 — Product Requirements Document (PRD)

**Versi:** 1.1 (Locked Decisions)  
**Status:** Disetujui untuk Implementasi  
**Tanggal:** 4 November 2026  
**Produk:** RUKO360 — Property & Rental Management SaaS  
**Platform awal:** Web responsif + Progressive Web App (PWA)

---

## 1. Ringkasan Produk

RUKO360 adalah platform SaaS multi-tenant untuk membantu pemilik dan pengelola properti mengelola properti, unit, penyewa, kontrak, tagihan, pembayaran, keluhan, dan komunikasi secara terpusat.

Platform menggunakan satu aplikasi dan satu backend bersama, tetapi data setiap organisasi/pemilik dipisahkan secara ketat. Pemilik dapat mengundang staf dan penyewa. Penyewa memperoleh portal sendiri untuk melihat tagihan, melakukan pembayaran, melihat riwayat, dan mengajukan keluhan.

RUKO360 mendukung pembayaran manual maupun melalui payment gateway serta notifikasi WhatsApp otomatis melalui integrasi resmi.

### 1.1 Visi

Menjadi platform pengelolaan properti sewaan yang mudah digunakan, aman, transparan, dan dapat berkembang dari pengelolaan ruko ke berbagai jenis properti.

### 1.2 Tujuan Produk

1. Mengurangi pekerjaan administrasi sewa yang berulang.
2. Membuat tagihan dan pengingat jatuh tempo lebih teratur.
3. Mencatat pembayaran dan tunggakan secara akurat.
4. Memudahkan penyewa berkomunikasi dengan pengelola.
5. Memberikan laporan operasional dan keuangan yang mudah dipahami.
6. Menyediakan fondasi SaaS yang dapat digunakan banyak organisasi tanpa kebocoran data.

### 1.3 Bukan Tujuan MVP

- Aplikasi native Android/iOS.
- Marketplace properti publik.
- Akuntansi penuh atau general ledger.
- Pengelolaan gedung kompleks dengan IoT.
- AI untuk penilaian penyewa atau keputusan finansial.
- Escrow atau penyimpanan dana pelanggan oleh RUKO360.

---

## 2. Pengguna dan Hak Akses

RUKO360 menggunakan model organisasi (*organization/workspace*). Satu pengguna dapat menjadi anggota lebih dari satu organisasi. Satu organisasi dapat memiliki banyak properti, unit, staf, dan penyewa.

### 2.1 Peran

| Peran | Cakupan dan hak akses |
|---|---|
| Platform Super Admin | Mengelola platform, organisasi, paket, dukungan, dan audit platform. Akses ke data pelanggan dibatasi, memiliki alasan akses, dan tercatat. |
| Owner | Pemilik organisasi; mengelola organisasi, properti, anggota, kontrak, keuangan, keluhan, dan pengaturan. |
| Admin | Mengelola operasional organisasi sesuai permission yang diberikan. |
| Manager | Mengelola properti, unit, penyewa, kontrak, dan keluhan sesuai permission. |
| Finance | Mengelola invoice, pembayaran, verifikasi, dan laporan keuangan. |
| Staff | Menangani tugas operasional dan keluhan sesuai permission. |
| Tenant | Melihat kontrak/tagihan miliknya, melakukan pembayaran, mengirim bukti, melihat riwayat, dan mengajukan keluhan. |

Role harus diterapkan di backend melalui policy/permission. Menyembunyikan menu di frontend bukan kontrol keamanan.

### 2.2 Onboarding

**Owner:**
1. Membuka halaman registrasi.
2. Memverifikasi email atau nomor telepon sesuai kebijakan.
3. Membuat organisasi/workspace.
4. Menjadi anggota dengan role `OWNER`.
5. Memilih paket atau memulai masa uji coba bila tersedia.
6. Masuk ke dashboard dan membuat properti pertama.

**Tenant:**
1. Owner/admin membuat profil penyewa dan mengirim undangan.
2. Sistem menghasilkan token acak, menyimpan hash token, dan mengirim tautan melalui kanal yang tersedia.
3. Tenant membuka tautan dan login atau membuat akun.
4. Sistem memvalidasi token, masa berlaku, dan identitas tujuan.
5. Sistem menghubungkan akun pengguna ke profil tenant yang tepat.
6. Undangan ditandai telah digunakan dan tidak dapat digunakan ulang.

Undangan default berlaku 48 jam, dapat dibatalkan, dan dapat diterbitkan ulang. Tautan tidak boleh memuat data pribadi yang sensitif.

---

## 3. Ruang Lingkup Produk

### 3.1 Portal Owner

- Dashboard ringkasan.
- Manajemen organisasi, anggota, dan rekening bank tujuan (`organization_bank_accounts`).
- Manajemen properti.
- Manajemen unit.
- Manajemen profil penyewa.
- Undangan akun penyewa.
- Manajemen kontrak sewa.
- Jadwal dan pembuatan tagihan.
- Verifikasi pembayaran manual.
- Integrasi payment gateway (BYOK — Bring Your Own Key untuk P1).
- Keluhan dan penugasan staf.
- Notifikasi dan template.
- Laporan.
- Pengaturan organisasi dan langganan.

### 3.2 Portal Tenant

- Dashboard penyewa.
- Informasi kontrak dan unit yang dapat diakses.
- Daftar tagihan dan detail invoice (termasuk informasi rekening bank tujuan transfer).
- Pembayaran manual atau gateway.
- Unggah bukti transfer.
- Status dan riwayat pembayaran.
- Pengajuan keluhan beserta lampiran.
- Percakapan dan status keluhan.
- Notifikasi.
- Pengaturan profil dan preferensi.

### 3.3 Portal Super Admin

- Ringkasan platform.
- Manajemen organisasi dan status akun.
- Manajemen pengguna.
- Manajemen paket dan langganan.
- Pemantauan integrasi dan kegagalan layanan.
- Dukungan pelanggan.
- Audit log platform.
- Akses bantuan ke organisasi dengan alasan, persetujuan, batas waktu, dan audit yang sesuai.

---

## 4. Persyaratan Fungsional

Prioritas:
- **P0:** wajib untuk MVP.
- **P1:** penting untuk rilis setelah MVP.
- **P2:** pengembangan lanjutan.

### 4.1 Authentication dan Organization

| ID | Persyaratan | Prioritas |
|---|---|---|
| AUTH-01 | Owner dapat registrasi dan login. | P0 |
| AUTH-02 | Pengguna dapat logout dan mengelola sesi. | P0 |
| AUTH-03 | Pengguna dapat meminta reset password. | P0 |
| AUTH-04 | Sistem memverifikasi email/nomor sesuai konfigurasi. | P0 |
| ORG-01 | Registrasi Owner membuat organisasi dan membership secara transaksional. | P0 |
| ORG-02 | Pengguna dapat melihat organisasi tempat ia menjadi anggota. | P0 |
| ORG-03 | Pengguna dapat memilih organisasi aktif jika memiliki lebih dari satu. | P1 |
| ORG-04 | Owner dapat mengundang staf dan menetapkan role. | P1 |
| ORG-05 | Owner dapat menonaktifkan anggota. | P1 |
| ORG-06 | Owner dapat mengelola daftar rekening bank organisasi (`organization_bank_accounts`) untuk tujuan transfer manual. | P0 |

### 4.2 Properti dan Unit

| ID | Persyaratan | Prioritas |
|---|---|---|
| PROP-01 | Owner/role berwenang dapat membuat, melihat, mengubah, dan mengarsipkan properti. | P0 |
| PROP-02 | Properti memiliki nama, alamat, kota, provinsi, kode pos, deskripsi, dan status. | P0 |
| UNIT-01 | Pengelola dapat menambahkan unit di dalam properti. | P0 |
| UNIT-02 | Nomor unit unik dalam satu properti. | P0 |
| UNIT-03 | Unit memiliki harga sewa, luas opsional, lantai opsional, dan status. | P0 |
| UNIT-04 | Unit yang memiliki kontrak aktif tidak dapat disewakan ke kontrak aktif lain pada periode yang tumpang tindih. | P0 |
| UNIT-05 | Perubahan harga unit tidak mengubah harga kontrak yang sudah berjalan. | P0 |

Status unit: `AVAILABLE`, `OCCUPIED`, `RESERVED`, `MAINTENANCE`, `INACTIVE`.

### 4.3 Tenant dan Kontrak

| ID | Persyaratan | Prioritas |
|---|---|---|
| TEN-01 | Pengelola dapat membuat dan memperbarui profil tenant. | P0 |
| TEN-02 | Profil tenant menyimpan nama, telepon, email opsional, alamat, dan status. | P0 |
| TEN-03 | Owner dapat mengundang tenant melalui tautan unik. | P0 |
| TEN-04 | Tenant dapat menerima undangan dengan akun yang sudah ada atau membuat akun baru. | P0 |
| TEN-05 | Satu akun pengguna dapat terhubung dengan beberapa profil/kontrak tenant yang sah. | P1 |
| LEASE-01 | Pengelola dapat membuat kontrak untuk unit dan tenant. | P0 |
| LEASE-02 | Kontrak menyimpan periode, harga, siklus tagihan, hari jatuh tempo, deposit opsional, dan ketentuan. | P0 |
| LEASE-03 | Kontrak memiliki dokumen lampiran privat. | P1 |
| LEASE-04 | Kontrak dapat diperpanjang atau diakhiri dengan riwayat perubahan. | P1 |
| LEASE-05 | Harga kontrak disimpan sebagai snapshot dan tidak mengikuti perubahan harga unit. | P0 |

Status kontrak: `DRAFT`, `PENDING`, `ACTIVE`, `EXPIRED`, `TERMINATED`.

Siklus tagihan (`billing_cycle`) yang didukung sejak MVP: `MONTHLY` (bulanan), `QUARTERLY` (3 bulanan), `SEMI_ANNUAL` (6 bulanan), dan `YEARLY` (tahunan) tanpa kalkulasi prorata otomatis.

### 4.4 Billing dan Invoice

| ID | Persyaratan | Prioritas |
|---|---|---|
| BILL-01 | Sistem dapat membuat invoice manual. | P0 |
| BILL-02 | Sistem dapat membuat invoice otomatis dari jadwal kontrak. | P0 |
| BILL-03 | Invoice memiliki nomor unik dalam organisasi. | P0 |
| BILL-04 | Invoice menyimpan periode, tanggal terbit, tanggal jatuh tempo, item, subtotal, diskon, pajak, total, dan saldo. | P0 |
| BILL-05 | Sistem mencegah invoice ganda untuk kontrak dan periode yang sama. | P0 |
| BILL-06 | Sistem menghitung pembayaran sebagian dan sisa tagihan. | P0 |
| BILL-07 | Invoice yang belum lunas setelah jatuh tempo ditandai terlambat. | P0 |
| BILL-08 | Invoice yang dibatalkan tetap memiliki jejak audit. | P0 |
| BILL-09 | Pengelola dapat mengirim pengingat manual. | P0 |

Status invoice: `DRAFT`, `UNPAID`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `CANCELLED`.

Aturan:
- Invoice merupakan snapshot kewajiban untuk satu periode.
- Komponen tagihan fleksibel melalui `invoice_items` (sewa pokok, IPL, utilitas, denda, dll.) serta field `discount` dan `tax` di level invoice.
- Total invoice dihitung dari item, diskon, dan pajak yang berlaku.
- `paid_amount` dapat disimpan sebagai nilai turunan/cache, tetapi harus konsisten dengan alokasi pembayaran terverifikasi.
- Invoice hanya berstatus `PAID` jika saldo terutang nol setelah transaksi terverifikasi.
- Perubahan atau pembatalan invoice setelah pembayaran memerlukan adjustment, reversal, atau refund yang tercatat; tidak boleh menghapus riwayat pembayaran.

### 4.5 Pembayaran

| ID | Persyaratan | Prioritas |
|---|---|---|
| PAY-01 | Tenant dapat memilih metode manual (dan rekening bank tujuan) atau gateway yang tersedia. | P0 |
| PAY-02 | Tenant dapat mengunggah bukti transfer untuk pembayaran manual. | P0 |
| PAY-03 | Finance/role berwenang dapat menerima atau menolak bukti. | P0 |
| PAY-04 | Sistem menyimpan jumlah, metode, rekening bank tujuan (untuk manual), waktu, status, dan referensi transaksi. | P0 |
| PAY-05 | Sistem mendukung pembayaran sebagian. | P0 |
| PAY-06 | Integrasi gateway (BYOK: akun Midtrans/Xendit milik masing-masing Owner) memproses status berdasarkan webhook terverifikasi. | P1 |
| PAY-07 | Webhook duplikat tidak boleh membuat pembayaran ganda. | P1 |
| PAY-08 | Sistem mendukung reversal/refund dengan audit trail. | P1 |
| PAY-09 | Sistem menyediakan rekonsiliasi pembayaran. | P1 |

Status pembayaran: `PENDING`, `VERIFIED`, `FAILED`, `REJECTED`, `REFUNDED`.

Ketentuan keuangan:
- Satu invoice dapat memiliki banyak pembayaran.
- Gunakan tabel `payment_allocations` agar pembayaran dapat dialokasikan ke satu atau lebih invoice.
- Pembayaran manual baru dihitung sebagai dana diterima setelah diverifikasi.
- Gateway dianggap berhasil hanya setelah callback/webhook diverifikasi sesuai dokumentasi provider.
- Verifikasi nominal, mata uang, merchant/account, referensi, dan status transaksi.
- Gunakan idempotency key dan unique provider event/reference.
- Dana sewa milik Owner tidak boleh tercampur dengan pendapatan langganan RUKO360. Dengan model BYOK pada P1, dana cair langsung ke merchant Owner.

### 4.6 Notifikasi dan WhatsApp

| ID | Persyaratan | Prioritas |
|---|---|---|
| NOTIF-01 | Sistem menyimpan notifikasi in-app. | P0 |
| NOTIF-02 | Sistem mengirim undangan melalui kanal yang dikonfigurasi. | P0 |
| NOTIF-03 | Sistem mengirim pengingat H-3, pada hari jatuh tempo, dan H+1 jika belum lunas. | P1 |
| NOTIF-04 | Sistem mengirim konfirmasi setelah pembayaran diverifikasi. | P1 |
| NOTIF-05 | Sistem mencatat status provider, waktu, dan kegagalan. | P1 |
| NOTIF-06 | Pengiriman dilakukan melalui background queue. | P0 |
| NOTIF-07 | Pengguna dapat mengatur preferensi notifikasi yang diizinkan. | P1 |

Integrasi WhatsApp menggunakan WhatsApp Business Platform/Cloud API resmi dengan model **Shared Sender** (satu nomor resmi RUKO360 untuk seluruh organisasi, dengan kuota pesan diatur berdasarkan paket langganan). Penggunaan template, opt-in, kategori pesan, dan aturan jendela layanan harus mengikuti kebijakan Meta yang berlaku. Pengiriman tidak boleh dianggap berhasil hanya karena job masuk queue; status provider dan delivery webhook perlu dicatat.

### 4.7 Keluhan

| ID | Persyaratan | Prioritas |
|---|---|---|
| COMP-01 | Tenant dapat membuat tiket keluhan. | P0 |
| COMP-02 | Keluhan dapat memuat judul, deskripsi, kategori, prioritas, dan foto. | P0 |
| COMP-03 | Pengelola dapat mengubah status dan menetapkan staf. | P0 |
| COMP-04 | Tenant dan pengelola dapat mengirim pesan pada tiket. | P1 |
| COMP-05 | Semua perubahan status tercatat dengan pelaku dan waktu. | P0 |
| COMP-06 | Tenant menerima notifikasi perubahan status. | P1 |
| COMP-07 | Tiket dapat ditandai selesai dan ditutup. | P0 |

Status: `NEW`, `REVIEWED`, `IN_PROGRESS`, `WAITING_TENANT`, `RESOLVED`, `CLOSED`.

### 4.8 Laporan

| ID | Persyaratan | Prioritas |
|---|---|---|
| REP-01 | Owner melihat jumlah properti, unit, dan okupansi. | P1 |
| REP-02 | Owner melihat pendapatan diterima per periode. | P1 |
| REP-03 | Owner melihat invoice belum lunas dan overdue. | P1 |
| REP-04 | Owner dapat memfilter laporan berdasarkan properti dan tanggal. | P1 |
| REP-05 | Owner dapat mengekspor laporan CSV. | P2 |

Laporan pendapatan harus menggunakan pembayaran yang terverifikasi, bukan total invoice yang diterbitkan.

### 4.9 Subscription dan Super Admin

| ID | Persyaratan | Prioritas |
|---|---|---|
| SUB-01 | Platform memiliki paket langganan yang dapat dikonfigurasi (default: Trial/Starter maks 5 unit, Pro maks 30 unit, Business unlimited). | P1 |
| SUB-02 | Paket dapat membatasi jumlah unit, anggota, dan kuota notifikasi WhatsApp. | P1 |
| SUB-03 | Status langganan memiliki masa berlaku dan grace period (default 7 hari). | P1 |
| SUB-04 | Penghentian langganan tidak langsung menghapus data pelanggan. | P1 |
| ADMIN-01 | Super Admin dapat melihat organisasi dan statusnya. | P1 |
| ADMIN-02 | Super Admin dapat mengelola paket dan langganan. | P1 |
| ADMIN-03 | Aksi sensitif Super Admin tercatat dalam audit log. | P0 |
| ADMIN-04 | Akses bantuan ke data pelanggan harus dibatasi, memiliki alasan, dan dapat diaudit. | P1 |

---

## 5. Aturan Bisnis Kritis

1. Setiap data bisnis dimiliki oleh tepat satu organisasi.
2. Organisasi aktif ditentukan dari membership pengguna yang tervalidasi di backend melalui header `X-Organization-Id` (atau fallback default), bukan dari `organization_id` di payload yang dipercaya begitu saja dari browser.
3. Setiap endpoint memeriksa autentikasi, organisasi, dan permission.
4. PostgreSQL Row Level Security (RLS) menjadi lapisan pertahanan tambahan untuk tabel bisnis menggunakan `set_config('app.current_organization_id', ..., false)` yang di-reset setiap siklus request/job.
5. Role aplikasi database tidak boleh menjadi superuser atau memiliki `BYPASSRLS`.
6. Semua relasi antar-data organisasi menggunakan composite foreign key yang memastikan organisasi induk dan anak sama.
7. Satu unit tidak boleh memiliki dua lease aktif dengan periode tumpang tindih (menggunakan PostgreSQL exclusion constraint `btree_gist`).
8. Periode invoice untuk satu lease tidak boleh terbit dua kali.
9. Pembayaran yang belum diverifikasi tidak mengurangi saldo tagihan.
10. Pembayaran terverifikasi dialokasikan secara transaksional dan tidak boleh dihitung dua kali.
11. Perubahan finansial tidak menghapus riwayat; gunakan adjustment, reversal, atau refund.
12. Status unit harus konsisten dengan lease aktif dan proses operasional.
13. Semua tanggal dan pengingat mengikuti timezone organisasi; penyimpanan timestamp menggunakan UTC.
14. Semua file kontrak, bukti pembayaran, dan lampiran keluhan disimpan privat dengan otorisasi akses melalui **Signed Temporary URL (masa berlaku 10 menit)**.
15. Job dan webhook harus idempotent.
16. Kegagalan WhatsApp tidak boleh membatalkan transaksi pembayaran.
17. Super Admin tidak memiliki akses tak terbatas tanpa audit.
18. Penghapusan akun dan retensi data mengikuti kebijakan privasi dan kewajiban hukum yang berlaku.

---

## 6. Arsitektur dan Teknologi

### 6.1 Keputusan Teknologi

| Lapisan | Teknologi |
|---|---|
| Owner/Tenant/Admin frontend | Next.js App Router + TypeScript |
| Styling | Tailwind CSS |
| Form validation | React Hook Form + Zod |
| API data/cache | TanStack Query |
| Backend | Laravel modular monolith |
| Authentication | Laravel Sanctum API Token disimpan di `httpOnly` Cookie via Next.js Server |
| Authorization | Laravel Policies + permission system |
| Database | PostgreSQL |
| Tenant isolation | PostgreSQL RLS + backend authorization |
| Cache/queue | Redis + Laravel Queue |
| Scheduler | Laravel Scheduler |
| File storage | Local Private Disk (Dev) / S3-compatible private object storage seperti R2/S3 (Prod) + Signed Temporary URL (10m) |
| WhatsApp | WhatsApp Cloud API (Shared Sender) |
| Payment | Manual Transfer (MVP P0) + Midtrans/Xendit BYOK (P1) |
| Testing backend | Pest/PHPUnit |
| Testing frontend | Vitest + Playwright |
| API documentation | OpenAPI/Swagger |
| Monitoring | Error tracking, logs, metrics, alerts |
| Deployment | Docker (Dev) / Cloud hosting (Prod) |

### 6.2 Arsitektur

Gunakan **modular monolith** untuk tahap awal. Modul backend:
- Auth
- Organization
- Property
- Unit
- Tenant
- Lease
- Billing
- Payment
- Complaint
- Notification
- Subscription
- Report
- Audit

Next.js tidak boleh mengakses PostgreSQL secara langsung. Seluruh operasi bisnis melalui Laravel API.

### 6.3 Struktur Repository

```text
ruko360/
├── frontend/
│   ├── app/
│   │   ├── (public)/
│   │   ├── (auth)/
│   │   ├── owner/
│   │   ├── tenant/
│   │   └── super-admin/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── forms/
│   │   ├── tables/
│   │   └── charts/
│   ├── features/
│   │   ├── auth/
│   │   ├── organizations/
│   │   ├── properties/
│   │   ├── units/
│   │   ├── tenants/
│   │   ├── leases/
│   │   ├── invoices/
│   │   ├── payments/
│   │   └── complaints/
│   ├── hooks/
│   ├── lib/
│   ├── providers/
│   ├── types/
│   └── public/
│
├── backend/
│   ├── app/
│   │   ├── Modules/
│   │   │   ├── Auth/
│   │   │   ├── Organization/
│   │   │   ├── Property/
│   │   │   ├── Unit/
│   │   │   ├── Tenant/
│   │   │   ├── Lease/
│   │   │   ├── Billing/
│   │   │   ├── Payment/
│   │   │   ├── Complaint/
│   │   │   ├── Notification/
│   │   │   ├── Subscription/
│   │   │   ├── Report/
│   │   │   └── Audit/
│   │   ├── Http/
│   │   ├── Models/
│   │   ├── Policies/
│   │   ├── Jobs/
│   │   ├── Events/
│   │   └── Listeners/
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeders/
│   │   └── factories/
│   ├── routes/
│   ├── tests/
│   │   ├── Feature/
│   │   ├── Unit/
│   │   ├── Integration/
│   │   └── Security/
│   └── storage/
│
├── docs/
│   ├── PRD.md
│   ├── architecture.md
│   ├── database.md
│   ├── api.md
│   ├── security.md
│   └── deployment.md
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 7. Rancangan Database PostgreSQL

Gunakan UUID sebagai primary key untuk entitas bisnis, `NUMERIC(18,2)` untuk nominal uang, `DATE` untuk tanggal periode, `TIMESTAMPTZ` untuk waktu kejadian, dan `JSONB` hanya untuk konfigurasi/payload yang memang fleksibel.

### 7.1 Tabel dan kolom inti

#### Identity dan organisasi

**users**
- `id UUID PK`
- `name VARCHAR(150)`
- `email VARCHAR(255) UNIQUE`
- `phone VARCHAR(30) NULL`
- `password VARCHAR(255)`
- `email_verified_at TIMESTAMPTZ NULL`
- `phone_verified_at TIMESTAMPTZ NULL`
- `is_super_admin BOOLEAN DEFAULT false`
- `status VARCHAR(20)`
- `created_at`, `updated_at`

**organizations**
- `id UUID PK`
- `name VARCHAR(150)`
- `slug VARCHAR(180) UNIQUE`
- `owner_user_id UUID FK users`
- `status VARCHAR(20)`
- `timezone VARCHAR(60) DEFAULT 'Asia/Jakarta'`
- `settings JSONB`
- `created_at`, `updated_at`

**organization_members**
- `id UUID PK`
- `organization_id UUID FK`
- `user_id UUID FK`
- `role_id UUID FK`
- `status VARCHAR(20)`
- unique `(organization_id, user_id)`
- unique `(organization_id, id)`

**roles**, **permissions**, **role_permissions**
- Menyimpan definisi role dan permission.
- Role default: OWNER, ADMIN, MANAGER, FINANCE, STAFF.
- Permission diperiksa backend.

**organization_invitations**
- `id UUID PK`
- `organization_id UUID FK`
- `email VARCHAR(255)`
- `role_id UUID FK`
- `token_hash VARCHAR(255) UNIQUE`
- `expires_at TIMESTAMPTZ`
- `accepted_at TIMESTAMPTZ NULL`
- `created_by UUID FK users`
- `created_at TIMESTAMPTZ`

**organization_bank_accounts**
- `id UUID PK`
- `organization_id UUID FK`
- `bank_name VARCHAR(100)`
- `account_number VARCHAR(50)`
- `account_holder_name VARCHAR(150)`
- `is_primary BOOLEAN DEFAULT false`
- `is_active BOOLEAN DEFAULT true`
- `created_at`, `updated_at`
- unique `(organization_id, id)`

#### Properti

**properties**
- `id UUID PK`
- `organization_id UUID FK`
- `name VARCHAR(180)`
- `address TEXT`
- `city VARCHAR(100) NULL`
- `province VARCHAR(100) NULL`
- `postal_code VARCHAR(15) NULL`
- `description TEXT NULL`
- `status VARCHAR(20)`
- `created_at`, `updated_at`
- unique `(organization_id, id)`

**units**
- `id UUID PK`
- `organization_id UUID`
- `property_id UUID`
- `unit_number VARCHAR(50)`
- `floor_number INTEGER NULL`
- `area_sqm NUMERIC(10,2) NULL`
- `rental_price NUMERIC(18,2)`
- `status VARCHAR(20)`
- `created_at`, `updated_at`
- unique `(organization_id, id)`
- unique `(property_id, unit_number)`
- composite FK `(organization_id, property_id)` ke properties

#### Tenant dan kontrak

**tenants**
- `id UUID PK`
- `organization_id UUID FK`
- `user_id UUID NULL FK users`
- `full_name VARCHAR(150)`
- `phone VARCHAR(30)`
- `email VARCHAR(255) NULL`
- `identity_number_encrypted TEXT NULL`
- `address TEXT NULL`
- `status VARCHAR(20)`
- `created_at`, `updated_at`
- unique `(organization_id, id)`

**tenant_user_links**
- `id UUID PK`
- `organization_id UUID FK`
- `tenant_id UUID`
- `user_id UUID FK`
- `verified_at TIMESTAMPTZ NULL`
- unique `(organization_id, tenant_id, user_id)`
- composite FK untuk memastikan tenant milik organisasi yang sama.

**tenant_invitations**
- `id UUID PK`
- `organization_id UUID FK`
- `tenant_id UUID`
- `destination VARCHAR(255)`
- `token_hash VARCHAR(255) UNIQUE`
- `expires_at TIMESTAMPTZ`
- `accepted_at TIMESTAMPTZ NULL`
- `revoked_at TIMESTAMPTZ NULL`
- `created_at TIMESTAMPTZ`

**leases**
- `id UUID PK`
- `organization_id UUID`
- `unit_id UUID`
- `tenant_id UUID`
- `lease_number VARCHAR(80)`
- `start_date DATE`
- `end_date DATE`
- `rental_price NUMERIC(18,2)`
- `billing_cycle VARCHAR(20)` (`MONTHLY`, `QUARTERLY`, `SEMI_ANNUAL`, `YEARLY`)
- `due_day SMALLINT`
- `deposit_amount NUMERIC(18,2) DEFAULT 0`
- `status VARCHAR(20)`
- `created_at`, `updated_at`
- unique `(organization_id, id)`
- unique `(organization_id, lease_number)`
- composite FK ke units dan tenants.

Tambahkan exclusion constraint PostgreSQL (`USING gist (unit_id WITH =, daterange(start_date, end_date, '[]') WITH &&) WHERE (status IN ('ACTIVE', 'PENDING'))`) untuk mencegah lease aktif yang bertumpang tindih.

**lease_documents**
- `id UUID PK`
- `organization_id UUID`
- `lease_id UUID`
- `storage_key VARCHAR(500)`
- `original_filename VARCHAR(255)`
- `mime_type VARCHAR(100)`
- `size_bytes BIGINT`
- `uploaded_by UUID`
- `created_at`

#### Billing dan pembayaran

**billing_schedules**
- `id UUID PK`
- `organization_id UUID`
- `lease_id UUID`
- `next_run_date DATE`
- `billing_cycle VARCHAR(20)`
- `is_active BOOLEAN`
- `created_at`, `updated_at`

**invoices**
- `id UUID PK`
- `organization_id UUID`
- `lease_id UUID`
- `invoice_number VARCHAR(80)`
- `billing_period_start DATE`
- `billing_period_end DATE`
- `issue_date DATE`
- `due_date DATE`
- `subtotal NUMERIC(18,2)`
- `discount NUMERIC(18,2)`
- `tax NUMERIC(18,2)`
- `total NUMERIC(18,2)`
- `paid_amount NUMERIC(18,2) DEFAULT 0`
- `status VARCHAR(25)`
- `created_at`, `updated_at`
- unique `(organization_id, id)`
- unique `(organization_id, invoice_number)`
- unique `(lease_id, billing_period_start)`
- composite FK ke lease.

**invoice_items**
- `id UUID PK`
- `organization_id UUID`
- `invoice_id UUID`
- `description VARCHAR(255)`
- `quantity NUMERIC(12,2)`
- `unit_price NUMERIC(18,2)`
- `amount NUMERIC(18,2)`
- `created_at`

**payments**
- `id UUID PK`
- `organization_id UUID`
- `destination_bank_account_id UUID NULL`
- `payment_number VARCHAR(80)`
- `amount NUMERIC(18,2)`
- `method VARCHAR(30)`
- `provider VARCHAR(50) NULL`
- `provider_reference VARCHAR(180) NULL`
- `status VARCHAR(20)`
- `paid_at TIMESTAMPTZ NULL`
- `verified_at TIMESTAMPTZ NULL`
- `verified_by UUID NULL`
- `rejection_reason TEXT NULL`
- `created_at`, `updated_at`
- unique `(organization_id, id)`
- unique `(organization_id, payment_number)`
- composite FK `(organization_id, destination_bank_account_id)` ke `organization_bank_accounts`.

**payment_allocations**
- `id UUID PK`
- `organization_id UUID`
- `payment_id UUID`
- `invoice_id UUID`
- `amount NUMERIC(18,2)`
- `created_at`
- Composite FK ke payment dan invoice.
- Constraint memastikan alokasi positif.

**payment_attempts**
- `id UUID PK`
- `organization_id UUID`
- `invoice_id UUID`
- `provider VARCHAR(50)`
- `provider_reference VARCHAR(180) NULL`
- `idempotency_key VARCHAR(180) UNIQUE`
- `status VARCHAR(30)`
- `expires_at TIMESTAMPTZ NULL`
- `created_at`, `updated_at`

**payment_gateway_events**
- `id UUID PK`
- `provider VARCHAR(50)`
- `provider_event_id VARCHAR(180) UNIQUE`
- `payload JSONB`
- `signature_verified BOOLEAN`
- `processed_at TIMESTAMPTZ NULL`
- `created_at`

**payment_proofs**
- `id UUID PK`
- `organization_id UUID`
- `payment_id UUID`
- `storage_key VARCHAR(500)`
- `original_filename VARCHAR(255)`
- `mime_type VARCHAR(100)`
- `size_bytes BIGINT`
- `uploaded_by UUID`
- `created_at`

#### Keluhan dan notifikasi

**complaints**
- `id UUID PK`
- `organization_id UUID`
- `tenant_id UUID`
- `unit_id UUID`
- `ticket_number VARCHAR(80)`
- `title VARCHAR(180)`
- `description TEXT`
- `category VARCHAR(50) NULL`
- `priority VARCHAR(20)`
- `status VARCHAR(25)`
- `assigned_to UUID NULL`
- `resolved_at TIMESTAMPTZ NULL`
- `created_at`, `updated_at`

**complaint_messages**
- `id UUID PK`
- `organization_id UUID`
- `complaint_id UUID`
- `sender_user_id UUID`
- `message TEXT`
- `created_at`

**complaint_attachments**
- `id UUID PK`
- `organization_id UUID`
- `complaint_id UUID`
- `storage_key VARCHAR(500)`
- `original_filename VARCHAR(255)`
- `mime_type VARCHAR(100)`
- `size_bytes BIGINT`
- `uploaded_by UUID`
- `created_at`

**complaint_status_history**
- `id UUID PK`
- `organization_id UUID`
- `complaint_id UUID`
- `old_status VARCHAR(25) NULL`
- `new_status VARCHAR(25)`
- `changed_by UUID`
- `note TEXT NULL`
- `created_at`

**notifications**
- `id UUID PK`
- `organization_id UUID NULL`
- `user_id UUID NULL`
- `channel VARCHAR(20)`
- `template_key VARCHAR(100) NULL`
- `recipient VARCHAR(255)`
- `payload JSONB`
- `status VARCHAR(20)`
- `provider_reference VARCHAR(180) NULL`
- `sent_at TIMESTAMPTZ NULL`
- `read_at TIMESTAMPTZ NULL`
- `created_at`

**notification_logs**
- `id UUID PK`
- `notification_id UUID`
- `attempt_number INTEGER`
- `provider_status VARCHAR(50)`
- `error_code VARCHAR(100) NULL`
- `error_message TEXT NULL`
- `attempted_at TIMESTAMPTZ`

#### Subscription dan audit

**subscription_plans**
- `id UUID PK`
- `code VARCHAR(50) UNIQUE` (`STARTER`, `PRO`, `BUSINESS`)
- `name VARCHAR(100)`
- `price NUMERIC(18,2)`
- `billing_period VARCHAR(20)`
- `max_units INTEGER NULL`
- `max_members INTEGER NULL`
- `monthly_whatsapp_quota INTEGER DEFAULT 0`
- `features JSONB`
- `is_active BOOLEAN`
- `created_at`

**subscriptions**
- `id UUID PK`
- `organization_id UUID FK`
- `plan_id UUID FK`
- `status VARCHAR(20)` (`TRIAL`, `ACTIVE`, `GRACE_PERIOD`, `EXPIRED`, `CANCELLED`)
- `starts_at TIMESTAMPTZ`
- `ends_at TIMESTAMPTZ NULL`
- `grace_ends_at TIMESTAMPTZ NULL`
- `created_at`, `updated_at`

**subscription_payments**
- `id UUID PK`
- `subscription_id UUID`
- `amount NUMERIC(18,2)`
- `provider VARCHAR(50)`
- `provider_reference VARCHAR(180)`
- `status VARCHAR(20)`
- `paid_at TIMESTAMPTZ NULL`
- `created_at`

**audit_logs**
- `id BIGINT GENERATED ALWAYS AS IDENTITY PK`
- `organization_id UUID NULL`
- `actor_user_id UUID NULL`
- `action VARCHAR(100)`
- `entity_type VARCHAR(100)`
- `entity_id UUID NULL`
- `old_values JSONB NULL`
- `new_values JSONB NULL`
- `ip_address INET NULL`
- `created_at`

---

## 8. Keputusan Terkunci (Hasil Diskusi Teknis & Bisnis)

1. **Siklus Tagihan (`billing_cycle`):** Mendukung `MONTHLY`, `QUARTERLY`, `SEMI_ANNUAL`, dan `YEARLY` sejak MVP tanpa kalkulasi prorata otomatis.
2. **Pembayaran & Rekening Tujuan:** MVP fokus pada **Transfer Manual** dengan tabel khusus `organization_bank_accounts` yang berelasi ke `payments`. Untuk Payment Gateway (P1), sistem menggunakan model **BYOK (Bring Your Own Key)** di mana kredensial Midtrans/Xendit dimiliki oleh masing-masing organisasi sehingga dana sewa langsung cair ke rekening Owner.
3. **WhatsApp Cloud API:** Menggunakan model **Shared Sender** (1 nomor resmi RUKO360 untuk seluruh organisasi) dengan kuota pengiriman pesan yang diatur di `subscription_plans`.
4. **Komponen Invoice & Pajak:** Fleksibel melalui baris item (`invoice_items`) ditambah input `discount` dan `tax` di tabel `invoices`.
5. **Paket Langganan Default:** Disediakan 3 tier di seeder: **Starter/Trial** (maks 5 unit), **Pro** (maks 30 unit), dan **Business** (unlimited) dengan masa *grace period* 7 hari.
6. **File Storage & Akses Privat:** Menggunakan Local Private Disk pada saat development dan S3-compatible storage (Cloudflare R2 / AWS S3) pada saat production. Seluruh file diakses melalui **Signed Temporary URL (berlaku 10 menit)** setelah otorisasi Policy dan RLS lolos.
7. **Autentikasi Next.js ↔ Laravel:** Menggunakan **Laravel Sanctum API Token** yang disimpan dalam **`httpOnly` Cookie** oleh Next.js Server (Route Handlers / Server Actions).
8. **Konteks Organisasi & PostgreSQL RLS:** Middleware backend memvalidasi keanggotaan user terhadap header `X-Organization-Id` lalu memanggil `set_config('app.current_organization_id', ..., false)` pada sesi transaksi database dan me-reset-nya setiap siklus request/job selesai.
