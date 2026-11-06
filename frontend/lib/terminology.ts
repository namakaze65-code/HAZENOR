import { formatIDR } from "./api-client";

export { formatIDR };

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

export interface StatusDisplay {
  label: string;
  variant: BadgeVariant;
}

export function formatDateID(value?: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

export function getUnitStatusDisplay(status?: string): StatusDisplay {
  switch (status) {
    case "AVAILABLE":
      return { label: "Tersedia", variant: "success" };
    case "OCCUPIED":
      return { label: "Disewa", variant: "info" };
    case "RESERVED":
      return { label: "Dipesan", variant: "warning" };
    case "MAINTENANCE":
      return { label: "Dalam Perbaikan", variant: "warning" };
    case "INACTIVE":
      return { label: "Tidak Aktif", variant: "neutral" };
    default:
      return { label: status || "Tidak Diketahui", variant: "neutral" };
  }
}

export function getLeaseStatusDisplay(status?: string): StatusDisplay {
  switch (status) {
    case "ACTIVE":
      return { label: "Aktif", variant: "success" };
    case "PENDING":
      return { label: "Menunggu Aktif", variant: "warning" };
    case "DRAFT":
      return { label: "Draf", variant: "neutral" };
    case "EXPIRED":
      return { label: "Berakhir", variant: "neutral" };
    case "TERMINATED":
      return { label: "Dihentikan", variant: "danger" };
    default:
      return { label: "Aktif", variant: "info" };
  }
}

export function getBillingCycleLabel(cycle?: string): string {
  switch (cycle) {
    case "MONTHLY":
      return "Bulanan";
    case "QUARTERLY":
      return "3 Bulanan";
    case "SEMI_ANNUAL":
      return "6 Bulanan";
    case "YEARLY":
      return "Tahunan";
    default:
      return "Tahunan";
  }
}

export function getInvoiceStatusDisplay(status?: string): StatusDisplay {
  switch (status) {
    case "PAID":
      return { label: "Lunas", variant: "success" };
    case "PARTIALLY_PAID":
      return { label: "Dibayar Sebagian", variant: "info" };
    case "UNPAID":
      return { label: "Belum Dibayar", variant: "warning" };
    case "OVERDUE":
      return { label: "Terlambat", variant: "danger" };
    case "DRAFT":
      return { label: "Draf", variant: "neutral" };
    case "CANCELLED":
      return { label: "Dibatalkan", variant: "neutral" };
    default:
      return { label: "Belum Dibayar", variant: "warning" };
  }
}

export function getPaymentStatusDisplay(status?: string): StatusDisplay {
  switch (status) {
    case "VERIFIED":
      return { label: "Terverifikasi", variant: "success" };
    case "PENDING":
      return { label: "Menunggu Verifikasi", variant: "warning" };
    case "REJECTED":
      return { label: "Ditolak", variant: "danger" };
    case "FAILED":
      return { label: "Gagal", variant: "danger" };
    case "REFUNDED":
      return { label: "Dikembalikan", variant: "neutral" };
    default:
      return { label: "Menunggu Verifikasi", variant: "warning" };
  }
}

export function getPaymentMethodLabel(method?: string): string {
  switch (method) {
    case "MANUAL_TRANSFER":
      return "Transfer Bank Manual";
    case "PAYMENT_GATEWAY":
      return "Pembayaran Otomatis";
    default:
      return "Transfer Bank";
  }
}

/**
 * Maps backend complaint status codes to standardized user-facing Indonesian terms:
 * - Baru (NEW)
 * - Sedang Ditangani (REVIEWED / IN_PROGRESS)
 * - Menunggu Konfirmasi (WAITING_TENANT)
 * - Selesai (RESOLVED)
 * - Ditolak (CLOSED)
 */
export function getComplaintStatusDisplay(status?: string): StatusDisplay {
  switch (status) {
    case "NEW":
      return { label: "Baru", variant: "info" };
    case "REVIEWED":
    case "IN_PROGRESS":
      return { label: "Sedang Ditangani", variant: "warning" };
    case "WAITING_TENANT":
      return { label: "Menunggu Konfirmasi", variant: "warning" };
    case "RESOLVED":
      return { label: "Selesai", variant: "success" };
    case "CLOSED":
      return { label: "Ditolak", variant: "danger" };
    default:
      return { label: "Baru", variant: "info" };
  }
}

export const COMPLAINT_STATUS_OPTIONS = [
  { value: "NEW", label: "Baru" },
  { value: "IN_PROGRESS", label: "Sedang Ditangani" },
  { value: "WAITING_TENANT", label: "Menunggu Konfirmasi" },
  { value: "RESOLVED", label: "Selesai" },
  { value: "CLOSED", label: "Ditolak" },
] as const;

export function getPriorityDisplay(priority?: string): StatusDisplay {
  switch (priority) {
    case "LOW":
      return { label: "Rendah", variant: "neutral" };
    case "MEDIUM":
      return { label: "Sedang", variant: "info" };
    case "HIGH":
      return { label: "Tinggi", variant: "warning" };
    case "URGENT":
      return { label: "Mendesak", variant: "danger" };
    default:
      return { label: "Sedang", variant: "info" };
  }
}

export const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Rendah" },
  { value: "MEDIUM", label: "Sedang" },
  { value: "HIGH", label: "Tinggi" },
  { value: "URGENT", label: "Mendesak" },
] as const;

export function getRoleLabel(roleCode?: string): string {
  switch (roleCode) {
    case "OWNER":
      return "Pemilik";
    case "ADMIN":
      return "Administrator";
    case "MANAGER":
      return "Manajer Properti";
    case "FINANCE":
      return "Staf Keuangan";
    case "STAFF":
      return "Staf Operasional";
    case "TENANT":
      return "Penyewa";
    default:
      return "Staf";
  }
}

export function getAuditActionLabel(action?: string): string {
  switch (action) {
    case "ORGANIZATION_INITIALIZED":
      return "Organisasi dibuat dan diaktifkan";
    case "ORGANIZATION_UPDATED":
      return "Pengaturan organisasi diperbarui";
    case "STAFF_MEMBER_ADDED":
      return "Staf baru ditambahkan ke organisasi";
    case "STAFF_MEMBER_UPDATED":
      return "Peran atau status staf diperbarui";
    case "LEASE_TERMINATED":
      return "Kontrak sewa dihentikan";
    case "LEASE_RENEWED":
      return "Kontrak sewa diperpanjang";
    case "INVOICE_MARKED_OVERDUE":
      return "Tagihan ditandai melewati jatuh tempo";
    case "PAYMENT_VERIFIED":
      return "Pembayaran diverifikasi dan dialokasikan ke tagihan";
    case "PAYMENT_REJECTED":
      return "Bukti pembayaran ditolak";
    case "PAYMENT_REFUNDED":
      return "Pembayaran dikembalikan dan saldo tagihan disesuaikan";
    case "SUPER_ADMIN_ORG_UPDATE":
      return "Status atau paket organisasi diperbarui oleh Administrator";
    default:
      return "Aktivitas sistem tercatat";
  }
}

export function getNotificationTemplateLabel(templateKey?: string): string {
  switch (templateKey) {
    case "INVOICE_ISSUED":
      return "Pemberitahuan Tagihan Baru";
    case "INVOICE_REMINDER_MANUAL":
      return "Pengingat Pembayaran Tagihan";
    case "REMINDER_H_MINUS_3":
      return "Pengingat Tagihan (3 Hari Sebelum Jatuh Tempo)";
    case "REMINDER_DUE_TODAY":
      return "Pengingat Tagihan (Jatuh Tempo Hari Ini)";
    case "REMINDER_H_PLUS_1":
      return "Pemberitahuan Keterlambatan Tagihan (H+1)";
    default:
      return "Pesan Pemberitahuan";
  }
}

export function getOrgStatusDisplay(status?: string): StatusDisplay {
  switch (status) {
    case "ACTIVE":
      return { label: "Aktif", variant: "success" };
    case "SUSPENDED":
      return { label: "Ditangguhkan", variant: "danger" };
    case "PENDING":
      return { label: "Menunggu Verifikasi", variant: "warning" };
    default:
      return { label: "Aktif", variant: "success" };
  }
}

export function getPlanLabel(code?: string): string {
  switch (code) {
    case "STARTER":
      return "Paket Starter";
    case "PRO":
      return "Paket Pro";
    case "BUSINESS":
      return "Paket Business";
    default:
      return "Paket Starter";
  }
}
