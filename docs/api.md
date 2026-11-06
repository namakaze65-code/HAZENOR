# Dokumentasi REST API (`/api/v1`)

Seluruh endpoint mengembalikan respons JSON terstandarisasi:
```json
{
  "success": true,
  "message": "Pesan deskriptif",
  "data": {}
}
```

## Daftar Endpoint Utama
1. **Autentikasi & Undangan**:
   - `POST /api/v1/auth/register` — Registrasi pemilik & pembuatan organisasi secara transaksional.
   - `POST /api/v1/auth/login` — Autentikasi pengguna & penerbitan token Sanctum.
   - `POST /api/v1/auth/logout` — Pencabutan token sesi aktif.
   - `POST /api/v1/auth/forgot-password` & `POST /api/v1/auth/reset-password` — Pemulihan kata sandi.
   - `POST /api/v1/auth/accept-invitation` — Aktivasi undangan penyewa sekali pakai (48 jam).
2. **Properti, Unit, Penyewa & Kontrak**:
   - `GET/POST /api/v1/properties`, `PUT/DELETE /api/v1/properties/{id}`
   - `GET/POST /api/v1/properties/{id}/units`, `PATCH /api/v1/units/{id}/status`
   - `GET/POST /api/v1/tenants`, `POST /api/v1/tenants/{id}/invitations`
   - `GET/POST /api/v1/leases`, `POST /api/v1/leases/{id}/terminate`, `POST /api/v1/leases/{id}/renew`
3. **Tagihan & Pembayaran**:
   - `GET/POST /api/v1/invoices`, `POST /api/v1/invoices/run-engine`, `POST /api/v1/invoices/{id}/send-reminder`
   - `GET /api/v1/payments`, `POST /api/v1/payments/manual`, `POST /api/v1/payments/{id}/verify`, `POST /api/v1/payments/{id}/reject`, `POST /api/v1/payments/{id}/refund`
   - `GET /api/v1/payments/{id}/signed-url` — Signed Temporary URL (10 menit).
   - `POST /api/v1/webhooks/payments/{provider}` — Webhook Payment Gateway idempoten.
4. **Keluhan, Notifikasi, Laporan & Super Admin**:
   - `GET/POST /api/v1/complaints`, `PATCH /api/v1/complaints/{id}/status`, `POST /api/v1/complaints/{id}/messages`, `POST /api/v1/complaints/{id}/attachments`, `POST /api/v1/complaints/{id}/close`
   - `GET /api/v1/notifications`, `GET/PUT /api/v1/notification-preferences`
   - `GET /api/v1/reports/overview`, `GET /api/v1/reports/export-csv`
   - `GET /api/v1/admin/dashboard`, `PATCH /api/v1/admin/organizations/{id}/status`
