# Standar Keamanan & Isolasi Multi-Tenant

1. **Isolasi Data Organisasi Berlapis**:
   - Setiap permintaan API yang membutuhkan konteks organisasi divalidasi oleh middleware `ResolveOrganizationContext` terhadap tabel `organization_members`.
   - Model bisnis menerapkan `BelongsToOrganization` global scope serta kebijakan PostgreSQL Row Level Security (RLS).
2. **Keamanan Undangan Penyewa**:
   - Token undangan di-hash menggunakan `SHA-256` sebelum disimpan di database (`token_hash`).
   - Berlaku maksimal 48 jam dan langsung ditandai `accepted_at` saat digunakan sehingga tidak dapat dipakai ulang.
3. **Integritas Transaksi Keuangan**:
   - Pembayaran manual berstatus `PENDING` tidak mengubah `paid_amount` pada tagihan sebelum diverifikasi oleh pemilik/staf keuangan.
   - Verifikasi pembayaran, penolakan, dan pengembalian dana (*refund*) dieksekusi di dalam `DB::transaction` dengan `lockForUpdate()`.
   - Webhook payment gateway memeriksa `provider_event_id` unik untuk mencegah pencatatan pembayaran ganda.
4. **Dokumen Privat**:
   - Bukti pembayaran diakses melalui *Signed Temporary URL* yang kedaluwarsa dalam 10 menit.
