# Rancangan Database PostgreSQL & Multi-Tenant RLS

## 1. Standar Tipe Data
- **Primary Key**: `UUID` untuk seluruh entitas bisnis.
- **Nominal Keuangan**: `NUMERIC(18,2)` untuk mencegah galat pembulatan *floating-point* (`bcmath` digunakan pada operasi alokasi pembayaran di PHP).
- **Zona Waktu & Periode**: `DATE` untuk periode tagihan/sewa, `TIMESTAMPTZ` untuk waktu kejadian, dan pengaturan zona waktu per organisasi (`Asia/Jakarta`, `Asia/Makassar`, `Asia/Jayapura`).

## 2. Tabel Inti
- **Identitas & Organisasi**: `users`, `organizations`, `organization_members`, `roles`, `permissions`, `organization_invitations`, `organization_bank_accounts`.
- **Properti & Unit**: `properties`, `units` (dengan status `AVAILABLE`, `OCCUPIED`, `RESERVED`, `MAINTENANCE`, `INACTIVE`).
- **Penyewa & Kontrak**: `tenants`, `tenant_invitations` (token hash SHA-256, masa berlaku 48 jam, sekali pakai), `leases` (anti-tumpang tindih pada unit yang sama).
- **Tagihan & Pembayaran**: `billing_schedules`, `invoices`, `invoice_items`, `payments`, `payment_allocations`, `payment_gateway_events` (idempoten berdasarkan `provider_event_id`).
- **Keluhan & Notifikasi**: `complaints`, `complaint_messages`, `complaint_attachments`, `complaint_status_history`, `notifications`, `notification_logs`.
- **Langganan & Audit**: `subscription_plans`, `subscriptions`, `audit_logs`.
