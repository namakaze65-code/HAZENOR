"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Building2,
  CreditCard,
  Download,
  FileText,
  History,
  LayoutDashboard,
  Menu,
  MessageSquareWarning,
  Printer,
  RefreshCw,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { HazenorLogo } from "@/components/brand/hazenor-logo";
import { HazenorInvoiceModal } from "@/components/invoice/hazenor-invoice-modal";
import { HazenorAnalyticsCharts } from "@/components/dashboard/hazenor-analytics-charts";
import {
  COMPLAINT_STATUS_OPTIONS,
  formatDateID,
  formatIDR,
  getAuditActionLabel,
  getBillingCycleLabel,
  getComplaintStatusDisplay,
  getInvoiceStatusDisplay,
  getLeaseStatusDisplay,
  getNotificationTemplateLabel,
  getPaymentMethodLabel,
  getPaymentStatusDisplay,
  getPriorityDisplay,
  getRoleLabel,
  getUnitStatusDisplay,
} from "@/lib/terminology";

type NavKey =
  | "ringkasan"
  | "properti"
  | "penyewa"
  | "tagihan"
  | "keluhan"
  | "notifikasi"
  | "aktivitas"
  | "rekening"
  | "pengaturan";

interface OverviewMetrics {
  total_properties: number;
  total_units: number;
  occupied_units: number;
  available_units: number;
  occupancy_rate: number;
  verified_revenue: string;
  pending_payments_count: number;
  unpaid_invoices_count: number;
  overdue_invoices_count: number;
  open_complaints_count: number;
}

const SIDEBAR_ITEMS: { key: NavKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "ringkasan", label: "Ringkasan", icon: LayoutDashboard },
  { key: "properti", label: "Properti dan Unit", icon: Building2 },
  { key: "penyewa", label: "Penyewa dan Kontrak", icon: Users },
  { key: "tagihan", label: "Tagihan dan Pembayaran", icon: FileText },
  { key: "keluhan", label: "Keluhan dan Permintaan Bantuan", icon: MessageSquareWarning },
  { key: "notifikasi", label: "Notifikasi", icon: Bell },
  { key: "aktivitas", label: "Riwayat Aktivitas", icon: History },
  { key: "rekening", label: "Rekening dan Pengguna", icon: CreditCard },
  { key: "pengaturan", label: "Pengaturan", icon: Settings },
];

export default function OwnerPortalPage() {
  const [activeNav, setActiveNav] = useState<NavKey>("ringkasan");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Confirmation Dialog State
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    variant: "danger" | "primary";
    action: () => Promise<void>;
  } | null>(null);

  // Data States
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [leases, setLeases] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  // Filter & Search States
  const [unitSearch, setUnitSearch] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [complaintSearch, setComplaintSearch] = useState("");
  const [complaintFilterStatus, setComplaintFilterStatus] = useState("ALL");

  // Form States
  const [newPropName, setNewPropName] = useState("");
  const [newPropAddress, setNewPropAddress] = useState("");
  const [newPropCity, setNewPropCity] = useState("Tangerang");

  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [newUnitNumber, setNewUnitNumber] = useState("");
  const [newUnitFloor, setNewUnitFloor] = useState("3");
  const [newUnitArea, setNewUnitArea] = useState("150");
  const [newUnitPrice, setNewUnitPrice] = useState("120000000");

  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantPhone, setNewTenantPhone] = useState("");
  const [newTenantEmail, setNewTenantEmail] = useState("");
  const [inviteLinkResult, setInviteLinkResult] = useState<string | null>(null);

  const [leaseUnitId, setLeaseUnitId] = useState("");
  const [leaseTenantId, setLeaseTenantId] = useState("");
  const [leaseNumber, setLeaseNumber] = useState("KTR-2026-0001");
  const [leaseStart, setLeaseStart] = useState("2026-01-01");
  const [leaseEnd, setLeaseEnd] = useState("2026-12-31");
  const [leasePrice, setLeasePrice] = useState("120000000");
  const [leaseCycle, setLeaseCycle] = useState<"MONTHLY" | "QUARTERLY" | "SEMI_ANNUAL" | "YEARLY">(
    "YEARLY"
  );

  const [invLeaseId, setInvLeaseId] = useState("");
  const [invNumber, setInvNumber] = useState("INV-2026-0001");
  const [invPeriodStart, setInvPeriodStart] = useState("2026-01-01");
  const [invPeriodEnd, setInvPeriodEnd] = useState("2026-12-31");
  const [invDueDate, setInvDueDate] = useState("2026-01-15");
  const [invDesc, setInvDesc] = useState("Tagihan Sewa Unit dan Pemeliharaan Lingkungan");
  const [invAmount, setInvAmount] = useState("120000000");
  const [invDiscount, setInvDiscount] = useState("0");
  const [invTax, setInvTax] = useState("0");

  const [bankName, setBankName] = useState("");
  const [bankNumber, setBankNumber] = useState("");
  const [bankHolder, setBankHolder] = useState("HAZENOR Properties");

  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffRole, setStaffRole] = useState("FINANCE");

  const [orgName, setOrgName] = useState("HAZENOR Properties");
  const [orgTimezone, setOrgTimezone] = useState("Asia/Jakarta");
  const [gatewayProvider, setGatewayProvider] = useState("MIDTRANS");
  const [gatewayMerchantId, setGatewayMerchantId] = useState("");

  const [signedUrlPreview, setSignedUrlPreview] = useState<string | null>(null);
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<any | null>(null);
  const [ownerComplaintReplies, setOwnerComplaintReplies] = useState<Record<string, string>>({});
  const [previewPaymentReceipt, setPreviewPaymentReceipt] = useState<{
    paymentNumber: string;
    amount: string | number;
    bankLabel: string;
    dataUrl?: string;
    fileName?: string;
  } | null>(null);

  const showToast = (type: "ok" | "err", text: string) => {
    setToast({ type, text });
  };

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const ovRes = await fetch("/api/proxy/reports/overview");
      if (ovRes.status === 401 || ovRes.status === 403) {
        // Session expired or this account is not an owner/staff -> back to login
        setAuthenticated(false);
        setLoading(false);
        window.location.href = "/login";
        return;
      }

      setAuthenticated(true);
      const [ov, pr, un, tn, ls, iv, py, cp, nf, al, bk, mb, orgCur] = await Promise.all([
        ovRes.json(),
        fetch("/api/proxy/properties").then((r) => r.json()),
        fetch("/api/proxy/units").then((r) => r.json()),
        fetch("/api/proxy/tenants").then((r) => r.json()),
        fetch("/api/proxy/leases").then((r) => r.json()),
        fetch("/api/proxy/invoices").then((r) => r.json()),
        fetch("/api/proxy/payments").then((r) => r.json()),
        fetch("/api/proxy/complaints").then((r) => r.json()),
        fetch("/api/proxy/notifications").then((r) => r.json()),
        fetch("/api/proxy/audit-logs").then((r) => r.json()),
        fetch("/api/proxy/organizations/bank-accounts").then((r) => r.json()),
        fetch("/api/proxy/organizations/members").then((r) => r.json()),
        fetch("/api/proxy/organizations/current").then((r) => r.json()),
      ]);

      if (orgCur?.success && orgCur.data?.name) {
        setOrgName(orgCur.data.name);
        setBankHolder(orgCur.data.name);
      }

      if (ov.success) setMetrics(ov.data);
      if (pr.success) {
        setProperties(pr.data);
        if (pr.data.length > 0 && !selectedPropertyId) {
          setSelectedPropertyId(pr.data[0].id);
        }
      }
      if (un.success) {
        setUnits(un.data);
        if (un.data.length > 0 && !leaseUnitId) {
          setLeaseUnitId(un.data[0].id);
        }
      }
      if (tn.success) {
        setTenants(tn.data);
        if (tn.data.length > 0 && !leaseTenantId) {
          setLeaseTenantId(tn.data[0].id);
        }
      }
      if (ls.success) {
        setLeases(ls.data);
        if (ls.data.length > 0 && !invLeaseId) {
          setInvLeaseId(ls.data[0].id);
        }
      }
      if (iv.success) setInvoices(iv.data);
      if (py.success) setPayments(py.data);
      if (cp.success) setComplaints(cp.data);
      if (nf.success) setNotifications(nf.data);
      if (al.success) setAuditLogs(al.data);
      if (bk.success) setBanks(bk.data);
      if (mb.success) setMembers(mb.data);
    } catch {
      showToast("err", "Gagal memuat data terbaru. Silakan periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  }, [invLeaseId, leaseTenantId, leaseUnitId, selectedPropertyId]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => setIsSuperAdmin(Boolean(s?.data?.is_super_admin)))
      .catch(() => setIsSuperAdmin(false));
  }, []);

  function loginWithDemoOwner() {
    window.location.href = "/login";
  }

  async function handleRunBillingEngine() {
    const res = await fetch("/api/proxy/invoices/run-engine", { method: "POST" });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast(
        "ok",
        `Pemeriksaan selesai: ${data.data.generated_invoices_count} tagihan terjadwal diterbitkan dan ${data.data.marked_overdue_count} tagihan diperbarui status jatuh temponya.`
      );
      await loadAllData();
    } else {
      showToast("err", data.message || "Gagal memproses jadwal tagihan.");
    }
  }

  async function handleExportCsv() {
    const res = await fetch("/api/proxy/reports/export-csv");
    const data = await res.json();
    if (res.ok && data.success) {
      const blob = new Blob([data.data.csv_content], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.data.filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast("ok", `Laporan keuangan berhasil diunduh (${data.data.filename}).`);
    }
  }

  async function handleSendWaReminder(inv: any) {
    const res = await fetch(`/api/proxy/invoices/${inv.id}/send-reminder`, {
      method: "POST",
    });
    const data = await res.json();

    const rawPhone = String(inv.lease?.tenant?.phone || "081299887766").replace(/\D/g, "");
    const intlPhone = rawPhone.startsWith("0")
      ? `62${rawPhone.slice(1)}`
      : rawPhone.startsWith("62")
      ? rawPhone
      : `62${rawPhone}`;
    const primaryBank = banks[0];
    const bankInfo = primaryBank
      ? `${primaryBank.bank_name} ${primaryBank.account_number} a.n. ${primaryBank.account_holder_name}`
      : "BCA 8720-1928-33 a.n. PT Berkah Properti Nusantara";
    const remaining = Math.max(0, Number(inv.total || 0) - Number(inv.paid_amount || 0));

    const waText = [
      `*HAZENOR PROPERTIES — PENGINGAT TAGIHAN SEWA*`,
      ``,
      `Yth. *${inv.lease?.tenant?.full_name || "Penyewa"}*,`,
      `Berikut rincian tagihan sewa unit properti Anda di bawah pengelolaan *${orgName}*:`,
      `• Nomor Tagihan: *${inv.invoice_number}*`,
      `• Sisa Tagihan: *${formatIDR(remaining)}*`,
      `• Jatuh Tempo: *${formatDateID(inv.due_date)}*`,
      `• Rekening Tujuan: *${bankInfo}*`,
      ``,
      `Silakan lakukan pembayaran dan unggah bukti transfer melalui Portal Penyewa HAZENOR Properties.`,
      `_A Legacy Built on Trust._`,
    ].join("\n");

    window.open(
      `https://wa.me/${intlPhone}?text=${encodeURIComponent(waText)}`,
      "_blank",
      "noopener,noreferrer"
    );

    if (res.ok && data.success) {
      showToast(
        "ok",
        "Pengingat tercatat di sistem & jendela WhatsApp resmi telah dibuka (Gratis Rp 0)."
      );
      await loadAllData();
    } else {
      showToast("ok", "Jendela WhatsApp pengingat tagihan resmi telah dibuka.");
    }
  }

  function confirmResetToCleanProduction() {
    setConfirmState({
      open: true,
      title: "Bersihkan Seluruh Data Contoh?",
      description:
        "Tindakan ini akan menghapus seluruh data properti, unit, penyewa, kontrak, tagihan, dan keluhan contoh bawaan agar Anda dapat mulai menginput data properti asli Anda dari nol.",
      confirmLabel: "Ya, Bersihkan Data Contoh",
      variant: "danger",
      action: async () => {
        const res = await fetch("/api/proxy/organizations/reset-data", {
          method: "POST",
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast(
            "ok",
            "Seluruh data contoh berhasil dibersihkan. Silakan mulai tambahkan properti asli Anda."
          );
          await loadAllData();
        } else {
          showToast("err", data.message || "Gagal membersihkan data contoh.");
        }
      },
    });
  }

  async function handleCreateProperty(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/proxy/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newPropName,
        address: newPropAddress,
        city: newPropCity,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setNewPropName("");
      setNewPropAddress("");
      showToast("ok", "Data properti baru berhasil disimpan.");
      await loadAllData();
    } else {
      showToast("err", data.message || "Gagal menyimpan properti.");
    }
  }

  async function handleCreateUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPropertyId) return;
    const res = await fetch(`/api/proxy/properties/${selectedPropertyId}/units`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unit_number: newUnitNumber,
        floor_number: Number(newUnitFloor),
        area_sqm: Number(newUnitArea),
        rental_price: Number(newUnitPrice),
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setNewUnitNumber("");
      showToast("ok", "Unit sewa baru berhasil ditambahkan.");
      await loadAllData();
    } else {
      showToast("err", data.message || "Gagal menambahkan unit.");
    }
  }

  async function handleCreateTenant(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/proxy/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: newTenantName,
        phone: newTenantPhone,
        email: newTenantEmail || null,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setNewTenantName("");
      setNewTenantPhone("");
      setNewTenantEmail("");
      showToast("ok", "Profil penyewa baru berhasil disimpan.");
      await loadAllData();
    } else {
      showToast("err", data.message || "Gagal menyimpan profil penyewa.");
    }
  }

  async function handleInviteTenant(tenantId: string) {
    const res = await fetch(`/api/proxy/tenants/${tenantId}/invitations`, {
      method: "POST",
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setInviteLinkResult(
        `/accept-invitation?token=${data.data.invitation_token}`
      );
      showToast(
        "ok",
        "Tautan undangan portal penyewa berhasil dibuat dan berlaku selama 48 jam."
      );
    }
  }

  async function handleCreateLease(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/proxy/leases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unit_id: leaseUnitId,
        tenant_id: leaseTenantId,
        lease_number: leaseNumber,
        start_date: leaseStart,
        end_date: leaseEnd,
        rental_price: Number(leasePrice),
        billing_cycle: leaseCycle,
        due_day: 10,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast("ok", "Kontrak sewa dan jadwal penagihan berhasil dibuat.");
      await loadAllData();
    } else {
      showToast(
        "err",
        data.message || "Unit ini sudah memiliki kontrak sewa aktif pada periode tanggal tersebut."
      );
    }
  }

  function confirmTerminateLease(leaseId: string, leaseNo: string) {
    setConfirmState({
      open: true,
      title: `Hentikan Kontrak Sewa ${leaseNo}?`,
      description:
        "Menghentikan kontrak sewa akan menonaktifkan jadwal tagihan berikutnya dan mengubah status unit kembali menjadi Tersedia.",
      confirmLabel: "Ya, Hentikan Kontrak",
      variant: "danger",
      action: async () => {
        const res = await fetch(`/api/proxy/leases/${leaseId}/terminate`, { method: "POST" });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast("ok", `Kontrak sewa ${leaseNo} telah dihentikan.`);
          await loadAllData();
        }
      },
    });
  }

  async function handleRenewLease(leaseId: string, leaseNo: string) {
    const res = await fetch(`/api/proxy/leases/${leaseId}/renew`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ end_date: "2027-12-31" }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast("ok", `Kontrak sewa ${leaseNo} berhasil diperpanjang hingga 31 Desember 2027.`);
      await loadAllData();
    }
  }

  async function handleCreateManualInvoice(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/proxy/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lease_id: invLeaseId,
        invoice_number: invNumber,
        billing_period_start: invPeriodStart,
        billing_period_end: invPeriodEnd,
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: invDueDate,
        discount: Number(invDiscount),
        tax: Number(invTax),
        items: [
          {
            description: invDesc,
            quantity: 1,
            unit_price: Number(invAmount),
          },
        ],
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast("ok", `Tagihan ${invNumber} berhasil diterbitkan.`);
      await loadAllData();
    } else {
      showToast("err", data.message || "Gagal menerbitkan tagihan.");
    }
  }

  async function handleVerifyPayment(paymentId: string, amount: string) {
    const targetInvoice = invoices.find((inv) => inv.status !== "PAID") || invoices[0];
    if (!targetInvoice) {
      showToast("err", "Tidak ada tagihan yang belum lunas untuk dialokasikan.");
      return;
    }

    const res = await fetch(`/api/proxy/payments/${paymentId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoice_id: targetInvoice.id,
        allocated_amount: Number(amount),
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast(
        "ok",
        `Pembayaran berhasil diverifikasi dan dialokasikan ke tagihan ${targetInvoice.invoice_number}.`
      );
      await loadAllData();
    } else {
      showToast("err", data.message || "Gagal memverifikasi pembayaran.");
    }
  }

  function confirmRejectPayment(paymentId: string, paymentNumber: string) {
    setConfirmState({
      open: true,
      title: `Tolak Pembayaran ${paymentNumber}?`,
      description:
        "Pembayaran yang ditolak tidak akan mengurangi saldo tagihan penyewa dan akan tercatat di riwayat aktivitas.",
      confirmLabel: "Ya, Tolak Pembayaran",
      variant: "danger",
      action: async () => {
        const res = await fetch(`/api/proxy/payments/${paymentId}/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rejection_reason: "Nominal bukti pembayaran belum sesuai dengan mutasi rekening.",
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast("ok", `Pembayaran ${paymentNumber} telah ditolak.`);
          await loadAllData();
        }
      },
    });
  }

  function confirmRefundPayment(paymentId: string, paymentNumber: string) {
    setConfirmState({
      open: true,
      title: `Kembalikan Dana Pembayaran ${paymentNumber}?`,
      description:
        "Tindakan ini akan membatalkan alokasi pembayaran pada tagihan terkait dan menghitung ulang sisa tagihan penyewa.",
      confirmLabel: "Ya, Kembalikan Pembayaran",
      variant: "danger",
      action: async () => {
        const res = await fetch(`/api/proxy/payments/${paymentId}/refund`, {
          method: "POST",
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast("ok", "Pembayaran telah dikembalikan dan saldo tagihan disesuaikan.");
          await loadAllData();
        }
      },
    });
  }

  async function handleGenerateSignedUrl(payment: any) {
    const res = await fetch(`/api/proxy/payments/${payment.id}/signed-url`);
    const data = await res.json();
    if (res.ok && data.success) {
      setSignedUrlPreview(data.data.signed_url);
      let storedProof: { dataUrl?: string; fileName?: string } = {};
      try {
        const allProofs = JSON.parse(
          localStorage.getItem("hazenor_payment_proofs") || "{}"
        );
        storedProof =
          allProofs[payment.payment_number] || allProofs["latest"] || {};
      } catch {
        // Ignore storage error
      }
      setPreviewPaymentReceipt({
        paymentNumber: payment.payment_number,
        amount: payment.amount,
        bankLabel: `${payment.destination_bank_account?.bank_name || "BCA"} (${
          payment.destination_bank_account?.account_number || "8720-1928-33"
        })`,
        dataUrl: storedProof.dataUrl,
        fileName: storedProof.fileName,
      });
      showToast(
        "ok",
        "Pratinjau dokumen dan tautan aman bukti pembayaran berhasil dibuka (berlaku selama 10 menit)."
      );
    }
  }

  async function handleUpdateComplaintStatus(complaintId: string, newStatus: string) {
    const res = await fetch(`/api/proxy/complaints/${complaintId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      const statusLabel = getComplaintStatusDisplay(newStatus).label;
      showToast("ok", `Status penanganan keluhan berhasil diperbarui menjadi "${statusLabel}".`);
      await loadAllData();
    }
  }

  async function handleSendOwnerComplaintReply(complaintId: string) {
    const text = (ownerComplaintReplies[complaintId] || "").trim();
    if (!text) return;
    const res = await fetch(`/api/proxy/complaints/${complaintId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `[Pengelola] ${text}` }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setOwnerComplaintReplies((prev) => ({ ...prev, [complaintId]: "" }));
      showToast("ok", "Pesan tanggapan berhasil dikirimkan kepada penyewa.");
      await loadAllData();
    }
  }

  async function handleCloseComplaint(complaintId: string) {
    const res = await fetch(`/api/proxy/complaints/${complaintId}/close`, {
      method: "POST",
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast("ok", "Tiket keluhan telah ditandai selesai dan ditutup.");
      await loadAllData();
    }
  }

  async function handleChangeUnitStatus(unitId: string, newStatus: string) {
    const res = await fetch(`/api/proxy/units/${unitId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast("ok", "Status ketersediaan unit berhasil diperbarui.");
      await loadAllData();
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  async function handleCreateBank(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/proxy/organizations/bank-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bank_name: bankName,
        account_number: bankNumber,
        account_holder_name: bankHolder,
        is_primary: false,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setBankName("");
      setBankNumber("");
      showToast("ok", "Rekening bank tujuan berhasil disimpan.");
      await loadAllData();
    }
  }

  async function handleInviteStaff(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/proxy/organizations/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: staffName,
        email: staffEmail,
        role_code: staffRole,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setStaffName("");
      setStaffEmail("");
      showToast("ok", "Anggota staf berhasil ditambahkan ke organisasi.");
      await loadAllData();
    } else {
      showToast("err", data.message || "Gagal menambahkan staf.");
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/proxy/organizations/current", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: orgName,
        timezone: orgTimezone,
        gateway_provider: gatewayProvider,
        gateway_merchant_id: gatewayMerchantId,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast("ok", "Pengaturan organisasi berhasil disimpan.");
      await loadAllData();
    }
  }

  const currentNavLabel =
    SIDEBAR_ITEMS.find((item) => item.key === activeNav)?.label || "Ringkasan";

  const filteredUnits = units.filter((u) => {
    const q = unitSearch.toLowerCase();
    return (
      u.unit_number?.toLowerCase().includes(q) ||
      u.property?.name?.toLowerCase().includes(q)
    );
  });

  const filteredInvoices = invoices.filter((inv) => {
    const q = invoiceSearch.toLowerCase();
    return (
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.lease?.tenant?.full_name?.toLowerCase().includes(q)
    );
  });

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      c.ticket_number?.toLowerCase().includes(complaintSearch.toLowerCase()) ||
      c.title?.toLowerCase().includes(complaintSearch.toLowerCase()) ||
      c.tenant?.full_name?.toLowerCase().includes(complaintSearch.toLowerCase());

    const matchesStatus =
      complaintFilterStatus === "ALL" || c.status === complaintFilterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#F6F4EF] text-[#303437] flex flex-col lg:flex-row overflow-x-hidden w-full max-w-full">
      {/* Official Printable Invoice Modal */}
      <HazenorInvoiceModal
        open={Boolean(selectedInvoiceForModal)}
        invoice={selectedInvoiceForModal}
        organizationName={orgName}
        banks={banks}
        onClose={() => setSelectedInvoiceForModal(null)}
      />

      {/* Confirmation Modal */}
      <ConfirmDialog
        open={Boolean(confirmState?.open)}
        title={confirmState?.title || ""}
        description={confirmState?.description || ""}
        confirmLabel={confirmState?.confirmLabel}
        variant={confirmState?.variant}
        onCancel={() => setConfirmState(null)}
        onConfirm={async () => {
          if (confirmState?.action) {
            await confirmState.action();
          }
          setConfirmState(null);
        }}
      />

      {/* Mobile Top Header */}
      <header className="lg:hidden bg-[#172B38] text-[#EAE5DB] px-3.5 sm:px-4 h-14 flex items-center justify-between sticky top-0 z-30 border-b border-[#C9B58E]/20">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <HazenorLogo variant="product" theme="dark" size="sm" />
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <span className="whitespace-nowrap text-[10px] font-semibold px-2 py-0.5 rounded bg-[#C9B58E]/15 text-[#C9B58E] border border-[#C9B58E]/30">
            Paket Pro
          </span>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Buka menu navigasi"
            className="p-1.5 rounded-lg text-[#EAE5DB] hover:bg-[#213B4D]"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Dark Navy Sidebar (Desktop + Mobile Responsive Drawer) */}
      <aside
        aria-label="Menu Pengelolaan Properti"
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } lg:flex w-full lg:w-72 bg-[#172B38] text-[#EAE5DB] flex-col justify-between p-5 shrink-0 lg:min-h-screen border-r border-[#C9B58E]/20`}
      >
        <div>
          <div className="flex flex-col gap-2 pb-5 border-b border-[#EAE5DB]/10">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <Link href="/" className="flex items-center gap-2 min-w-0">
                <HazenorLogo variant="primary" theme="dark" size="sm" />
              </Link>
              <span className="shrink-0 whitespace-nowrap text-[10px] font-semibold px-2 py-0.5 rounded bg-[#C9B58E]/15 text-[#C9B58E] border border-[#C9B58E]/30">
                Paket Pro
              </span>
            </div>
          </div>

          <nav className="mt-2 lg:mt-5 space-y-1 text-sm">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setActiveNav(item.key);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg font-medium transition ${
                    isActive
                      ? "bg-[#213B4D] text-[#EAE5DB] border-l-2 border-[#C9B58E] shadow-xs"
                      : "text-[#EAE5DB]/75 hover:bg-[#213B4D]/60 hover:text-[#EAE5DB]"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? "text-[#C9B58E]" : "text-[#EAE5DB]/70"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-6 pt-4 border-t border-[#EAE5DB]/10 text-xs text-[#EAE5DB]/70 space-y-2">
          <div>
            <div className="font-semibold text-[#EAE5DB]">{orgName}</div>
            <div>Waktu: Waktu Indonesia Barat (WIB)</div>
            <div className="mt-1.5 text-[11px] text-[#C9B58E] font-serif italic">
              HAZENOR Properties — A Legacy Built on Trust.
            </div>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-medium">
            <div className="flex flex-wrap gap-3">
              {/* Only platform super admins see the admin portal link */}
              {isSuperAdmin && (
                <Link href="/super-admin" className="text-[#C9B58E] hover:underline">
                  Portal Administrator →
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="text-rose-300 hover:text-rose-200 underline"
            >
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
        {/* Breadcrumb & Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#EAE5DB] pb-5">
          <div>
            <nav aria-label="Breadcrumb" className="text-xs text-[#303437]/70 mb-1.5">
              <Link href="/" className="hover:text-[#172B38]">
                Beranda
              </Link>{" "}
              / <span>Portal Pemilik</span> /{" "}
              <span className="font-semibold text-[#172B38]">{currentNavLabel}</span>
            </nav>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#172B38]">
              {activeNav === "ringkasan" ? "Ringkasan Pengelolaan Properti" : currentNavLabel}
            </h1>
            <p className="mt-1 text-sm text-[#303437]/80">
              {activeNav === "keluhan"
                ? "Pantau keluhan penyewa dan tindak lanjuti setiap permintaan bantuan."
                : "Pantau kondisi properti, unit sewa, pembayaran, dan aktivitas penyewa di bawah standar HAZENOR Properties."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {authenticated ? (
              <>
                <button
                  type="button"
                  onClick={handleRunBillingEngine}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#172B38] hover:bg-[#213B4D] text-[#EAE5DB] border border-[#C9B58E]/30 text-xs font-semibold shadow-xs transition"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-[#C9B58E]" aria-hidden="true" />
                  <span>Proses Tagihan dan Periksa Jatuh Tempo</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#EAE5DB] bg-white hover:bg-[#EAE5DB]/50 text-[#172B38] text-xs font-semibold transition"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Unduh Laporan</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={loginWithDemoOwner}
                className="px-4 py-2.5 rounded-lg bg-[#172B38] hover:bg-[#213B4D] text-[#EAE5DB] border border-[#C9B58E]/30 text-xs font-semibold shadow-xs transition"
              >
                Masuk ke Akun Anda
              </button>
            )}
          </div>
        </div>

        {/* Toast Notification Banner */}
        {toast && (
          <div
            role="status"
            className={`rounded-xl border px-4 py-3 text-sm flex items-center justify-between gap-4 ${
              toast.type === "ok"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}
          >
            <span className="font-medium">{toast.text}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-xs font-bold underline shrink-0"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-12 text-center text-sm text-slate-500">
            Memuat data pengelolaan properti...
          </div>
        )}

        {/* Unauthenticated Prompt */}
        {!authenticated && !loading && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900">
              Silakan Masuk untuk Mengelola Properti Anda
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              Gunakan akun pemilik untuk melihat ringkasan hunian, menerbitkan tagihan, serta
              memverifikasi pembayaran sewa.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={loginWithDemoOwner}
                className="px-5 py-2.5 rounded-lg bg-[#172B38] hover:bg-[#213B4D] text-[#EAE5DB] border border-[#C9B58E]/30 text-sm font-semibold transition"
              >
                Masuk dengan Akun Contoh
              </button>
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition"
              >
                Ke Halaman Masuk
              </Link>
            </div>
          </div>
        )}

        {/* 1. RINGKASAN */}
        {authenticated && !loading && activeNav === "ringkasan" && (
          <div className="space-y-8 animate-fade-up">
            {/* 7 Separate Standardized Metric Items */}
            <section aria-label="Statistik Utama Properti">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
                  <div className="text-xs font-medium text-slate-500">Total Properti</div>
                  <div className="mt-1.5 text-2xl font-bold text-slate-900">
                    {metrics?.total_properties ?? 0} Lokasi
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Properti aktif dikelola</div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
                  <div className="text-xs font-medium text-slate-500">Total Unit</div>
                  <div className="mt-1.5 text-2xl font-bold text-slate-900">
                    {metrics?.total_units ?? 0} Unit
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {metrics?.available_units ?? 0} Tersedia • {metrics?.occupied_units ?? 0} Disewa
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
                  <div className="text-xs font-medium text-slate-500">Tingkat Hunian</div>
                  <div className="mt-1.5 text-2xl font-bold text-[#172B38]">
                    {metrics?.occupancy_rate ?? 0}%
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Persentase unit yang sedang disewa
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
                  <div className="text-xs font-medium text-slate-500">
                    Total Pembayaran Diterima
                  </div>
                  <div className="mt-1.5 text-2xl font-bold text-emerald-700">
                    {formatIDR(metrics?.verified_revenue ?? 0)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Dana pembayaran yang telah terverifikasi
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
                  <div className="text-xs font-medium text-slate-500">Tagihan Belum Dibayar</div>
                  <div className="mt-1.5 text-2xl font-bold text-amber-600">
                    {metrics?.unpaid_invoices_count ?? 0} Tagihan
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {metrics?.overdue_invoices_count ?? 0} tagihan melewati jatuh tempo
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
                  <div className="text-xs font-medium text-slate-500">
                    Pembayaran Menunggu Verifikasi
                  </div>
                  <div className="mt-1.5 text-2xl font-bold text-[#172B38]">
                    {metrics?.pending_payments_count ?? 0} Pembayaran
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Bukti transfer yang perlu diperiksa staf keuangan
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 sm:col-span-2 lg:col-span-2 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
                  <div className="text-xs font-medium text-slate-500">Keluhan Aktif</div>
                  <div className="mt-1.5 text-2xl font-bold text-slate-900">
                    {metrics?.open_complaints_count ?? 0} Permintaan Bantuan
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Laporan penyewa yang sedang dalam proses penanganan
                  </div>
                </div>
              </div>
            </section>

            {/* Executive Financial & Occupancy Analytics Charts */}
            <HazenorAnalyticsCharts
              metrics={metrics}
              invoices={invoices}
              units={units}
            />

            {/* Tables for Recent Payments & Unit Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Pembayaran Terbaru dari Penyewa
                    </h2>
                    <p className="text-xs text-slate-500">
                      Periksa dan verifikasi pembayaran yang masuk ke rekening pengelola.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveNav("tagihan")}
                    className="text-xs font-semibold text-[#172B38] hover:underline"
                  >
                    Lihat Semua →
                  </button>
                </div>

                <div className="divide-y divide-slate-200">
                  {payments.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      Belum ada catatan pembayaran.
                    </div>
                  ) : (
                    payments.slice(0, 5).map((p) => {
                      const st = getPaymentStatusDisplay(p.status);
                      return (
                        <div
                          key={p.id}
                          className="px-5 py-3.5 flex items-center justify-between gap-4 text-sm"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">
                              {p.payment_number} — {formatIDR(p.amount)}
                            </div>
                            <div className="text-xs text-slate-500">
                              Rekening Tujuan: {p.destination_bank_account?.bank_name || "-"}{" "}
                              {p.destination_bank_account?.account_number || ""}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge label={st.label} variant={st.variant} />
                            {p.status === "PENDING" && (
                              <button
                                type="button"
                                onClick={() => handleVerifyPayment(p.id, p.amount)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                              >
                                Verifikasi
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Status Unit Sewa</h2>
                    <p className="text-xs text-slate-500">
                      Kondisi ketersediaan unit pada properti yang Anda kelola.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveNav("properti")}
                    className="text-xs font-semibold text-[#172B38] hover:underline"
                  >
                    Kelola Unit →
                  </button>
                </div>

                <div className="divide-y divide-slate-200">
                  {units.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      Belum ada unit terdaftar.
                    </div>
                  ) : (
                    units.slice(0, 5).map((u) => {
                      const st = getUnitStatusDisplay(u.status);
                      return (
                        <div
                          key={u.id}
                          className="px-5 py-3.5 flex items-center justify-between gap-4 text-sm"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">
                              {u.property?.name} — {u.unit_number}
                            </div>
                            <div className="text-xs text-slate-500">
                              Harga Sewa: {formatIDR(u.rental_price)} • {u.floor_number || 1} Lantai
                              ({u.area_sqm || 0} m²)
                            </div>
                          </div>
                          <StatusBadge label={st.label} variant={st.variant} />
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* 2. PROPERTI DAN UNIT */}
        {authenticated && !loading && activeNav === "properti" && (
          <div className="space-y-6 animate-fade-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form
                onSubmit={handleCreateProperty}
                className="bg-white rounded-xl border border-slate-200 p-6 space-y-4"
              >
                <div>
                  <h2 className="text-base font-bold text-slate-900">Tambah Properti Baru</h2>
                  <p className="text-xs text-slate-500">
                    Daftarkan gedung atau kompleks ruko yang Anda kelola.
                  </p>
                </div>
                <div>
                  <label htmlFor="prop-name" className="block text-xs font-semibold text-slate-700">
                    Nama Properti
                  </label>
                  <input
                    id="prop-name"
                    type="text"
                    required
                    value={newPropName}
                    onChange={(e) => setNewPropName(e.target.value)}
                    placeholder="Contoh: Ruko Grand Wijaya Center"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="prop-addr" className="block text-xs font-semibold text-slate-700">
                    Alamat Lengkap
                  </label>
                  <input
                    id="prop-addr"
                    type="text"
                    required
                    value={newPropAddress}
                    onChange={(e) => setNewPropAddress(e.target.value)}
                    placeholder="Contoh: Jl. Wijaya II No. 45"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="prop-city" className="block text-xs font-semibold text-slate-700">
                    Kota / Kabupaten
                  </label>
                  <input
                    id="prop-city"
                    type="text"
                    value={newPropCity}
                    onChange={(e) => setNewPropCity(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#172B38] hover:bg-[#213B4D] text-[#EAE5DB] border border-[#C9B58E]/30 text-xs font-semibold transition"
                >
                  Simpan Properti
                </button>
              </form>

              <form
                onSubmit={handleCreateUnit}
                className="bg-white rounded-xl border border-slate-200 p-6 space-y-4"
              >
                <div>
                  <h2 className="text-base font-bold text-slate-900">Tambah Unit Sewa</h2>
                  <p className="text-xs text-slate-500">
                    Tambahkan unit di dalam properti beserta informasi luas dan harga sewanya.
                  </p>
                </div>
                <div>
                  <label htmlFor="unit-prop" className="block text-xs font-semibold text-slate-700">
                    Pilih Lokasi Properti
                  </label>
                  <select
                    id="unit-prop"
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="unit-no" className="block text-xs font-semibold text-slate-700">
                      Nomor Unit
                    </label>
                    <input
                      id="unit-no"
                      type="text"
                      required
                      value={newUnitNumber}
                      onChange={(e) => setNewUnitNumber(e.target.value)}
                      placeholder="Blok B-08"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="unit-floor"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Jumlah Lantai
                    </label>
                    <input
                      id="unit-floor"
                      type="number"
                      value={newUnitFloor}
                      onChange={(e) => setNewUnitFloor(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="unit-area"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Luas Bangunan (m²)
                    </label>
                    <input
                      id="unit-area"
                      type="number"
                      value={newUnitArea}
                      onChange={(e) => setNewUnitArea(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="unit-price" className="block text-xs font-semibold text-slate-700">
                    Harga Sewa Dasar (Rp)
                  </label>
                  <input
                    id="unit-price"
                    type="number"
                    required
                    value={newUnitPrice}
                    onChange={(e) => setNewUnitPrice(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#172B38] hover:bg-[#213B4D] text-[#EAE5DB] border border-[#C9B58E]/30 text-xs font-semibold transition"
                >
                  Simpan Unit
                </button>
              </form>
            </div>

            {/* Unit Table with Search */}
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Daftar Seluruh Unit</h3>
                  <p className="text-xs text-slate-500">
                    Menampilkan {filteredUnits.length} unit dari {properties.length} properti.
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search
                    className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={unitSearch}
                    onChange={(e) => setUnitSearch(e.target.value)}
                    placeholder="Cari nomor unit atau properti..."
                    aria-label="Cari unit"
                    className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-5">Properti</th>
                      <th className="py-3 px-5">Nomor Unit</th>
                      <th className="py-3 px-5">Spesifikasi</th>
                      <th className="py-3 px-5">Harga Sewa Dasar</th>
                      <th className="py-3 px-5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredUnits.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-slate-500">
                          Tidak ada unit yang sesuai dengan pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredUnits.map((u) => {
                        const st = getUnitStatusDisplay(u.status);
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/70">
                            <td className="py-3.5 px-5 font-medium text-slate-900">
                              {u.property?.name || "-"}
                            </td>
                            <td className="py-3.5 px-5 font-semibold text-slate-900">
                              {u.unit_number}
                            </td>
                            <td className="py-3.5 px-5 text-xs text-slate-600">
                              {u.floor_number || 1} Lantai • {u.area_sqm || 0} m²
                            </td>
                            <td className="py-3.5 px-5 font-medium text-slate-900">
                              {formatIDR(u.rental_price)}
                            </td>
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-2">
                                <StatusBadge label={st.label} variant={st.variant} />
                                <select
                                  aria-label={`Ubah status unit ${u.unit_number}`}
                                  value={u.status}
                                  onChange={(e) => handleChangeUnitStatus(u.id, e.target.value)}
                                  className="rounded border border-[#EAE5DB] bg-white px-2 py-1 text-[11px] font-medium text-[#172B38]"
                                >
                                  <option value="AVAILABLE">Tersedia</option>
                                  <option value="OCCUPIED">Disewa</option>
                                  <option value="RESERVED">Dipesan</option>
                                  <option value="MAINTENANCE">Pemeliharaan</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* 3. PENYEWA DAN KONTRAK */}
        {authenticated && !loading && activeNav === "penyewa" && (
          <div className="space-y-6 animate-fade-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form
                onSubmit={handleCreateTenant}
                className="bg-white rounded-xl border border-slate-200 p-6 space-y-4"
              >
                <div>
                  <h2 className="text-base font-bold text-slate-900">Tambah Data Penyewa</h2>
                  <p className="text-xs text-slate-500">
                    Catat nama penyewa beserta nomor WhatsApp aktif untuk pengiriman tagihan.
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="tenant-name"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Nama Penyewa atau Nama Usaha
                  </label>
                  <input
                    id="tenant-name"
                    type="text"
                    required
                    value={newTenantName}
                    onChange={(e) => setNewTenantName(e.target.value)}
                    placeholder="Contoh: PT Kuliner Maju Bersama"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="tenant-phone"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Nomor Telepon / WhatsApp
                    </label>
                    <input
                      id="tenant-phone"
                      type="text"
                      required
                      value={newTenantPhone}
                      onChange={(e) => setNewTenantPhone(e.target.value)}
                      placeholder="081299887766"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="tenant-email"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Alamat Email (Opsional)
                    </label>
                    <input
                      id="tenant-email"
                      type="email"
                      value={newTenantEmail}
                      onChange={(e) => setNewTenantEmail(e.target.value)}
                      placeholder="kontak@usaha.id"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#172B38] hover:bg-[#213B4D] text-[#EAE5DB] border border-[#C9B58E]/30 text-xs font-semibold transition"
                >
                  Simpan Data Penyewa
                </button>
              </form>

              <form
                onSubmit={handleCreateLease}
                className="bg-white rounded-xl border border-slate-200 p-6 space-y-4"
              >
                <div>
                  <h2 className="text-base font-bold text-slate-900">Buat Kontrak Sewa Baru</h2>
                  <p className="text-xs text-slate-500">
                    Hubungkan penyewa dengan unit yang dipilih beserta periode dan nilai sewanya.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="lease-unit"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Pilih Unit
                    </label>
                    <select
                      id="lease-unit"
                      value={leaseUnitId}
                      onChange={(e) => setLeaseUnitId(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.unit_number} ({getUnitStatusDisplay(u.status).label})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="lease-tenant"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Pilih Penyewa
                    </label>
                    <select
                      id="lease-tenant"
                      value={leaseTenantId}
                      onChange={(e) => setLeaseTenantId(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor="lease-no"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Nomor Kontrak
                    </label>
                    <input
                      id="lease-no"
                      type="text"
                      required
                      value={leaseNumber}
                      onChange={(e) => setLeaseNumber(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lease-start"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Tanggal Mulai
                    </label>
                    <input
                      id="lease-start"
                      type="date"
                      required
                      value={leaseStart}
                      onChange={(e) => setLeaseStart(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lease-end"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Tanggal Berakhir
                    </label>
                    <input
                      id="lease-end"
                      type="date"
                      required
                      value={leaseEnd}
                      onChange={(e) => setLeaseEnd(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="lease-cycle"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Siklus Penagihan
                    </label>
                    <select
                      id="lease-cycle"
                      value={leaseCycle}
                      onChange={(e) => setLeaseCycle(e.target.value as any)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="MONTHLY">Bulanan</option>
                      <option value="QUARTERLY">3 Bulanan</option>
                      <option value="SEMI_ANNUAL">6 Bulanan</option>
                      <option value="YEARLY">Tahunan</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="lease-price"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Nilai Sewa per Siklus (Rp)
                    </label>
                    <input
                      id="lease-price"
                      type="number"
                      required
                      value={leasePrice}
                      onChange={(e) => setLeasePrice(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#172B38] hover:bg-[#213B4D] text-[#EAE5DB] border border-[#C9B58E]/30 text-xs font-semibold transition"
                >
                  Simpan Kontrak Sewa
                </button>
              </form>
            </div>

            {inviteLinkResult && (
              <div className="bg-[#F6F4EF] border border-[#C9B58E]/50 rounded-xl p-4 text-xs text-[#172B38] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-bold">
                    Tautan Undangan Portal Penyewa (Berlaku 48 Jam):
                  </div>
                  <div className="mt-1 font-mono break-all">
                    {`http://localhost:3000${inviteLinkResult}`}
                  </div>
                </div>
                <Link
                  href={inviteLinkResult}
                  className="px-3.5 py-2 rounded-lg bg-[#172B38] hover:bg-[#213B4D] text-[#EAE5DB] font-semibold transition shrink-0"
                >
                  Buka Halaman Aktivasi Undangan →
                </Link>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-base font-bold text-slate-900">Daftar Penyewa</h3>
                <div className="mt-4 divide-y divide-slate-200">
                  {tenants.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      Belum ada penyewa terdaftar.
                    </div>
                  ) : (
                    tenants.map((t) => (
                      <div
                        key={t.id}
                        className="py-3.5 flex items-center justify-between gap-3 text-sm"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">{t.full_name}</div>
                          <div className="text-xs text-slate-500">
                            Telepon/WA: {t.phone} • Email: {t.email || "-"}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleInviteTenant(t.id)}
                          className="px-3 py-1.5 rounded-lg border border-[#172B38] text-[#172B38] hover:bg-[#F6F4EF] text-xs font-semibold transition"
                        >
                          Buat Undangan Portal
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-base font-bold text-slate-900">Daftar Kontrak Sewa</h3>
                <div className="mt-4 divide-y divide-slate-200">
                  {leases.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      Belum ada kontrak sewa.
                    </div>
                  ) : (
                    leases.map((ls) => {
                      const st = getLeaseStatusDisplay(ls.status);
                      return (
                        <div key={ls.id} className="py-3.5 space-y-2 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-900">
                              {ls.lease_number} • Unit {ls.unit?.unit_number}
                            </span>
                            <StatusBadge label={st.label} variant={st.variant} />
                          </div>
                          <div className="text-xs text-slate-600">
                            Penyewa: <strong>{ls.tenant?.full_name}</strong> • Siklus:{" "}
                            {getBillingCycleLabel(ls.billing_cycle)} ({formatIDR(ls.rental_price)})
                          </div>
                          <div className="text-xs text-slate-500">
                            Masa Berlaku: {formatDateID(ls.start_date)} s/d{" "}
                            {formatDateID(ls.end_date)}
                          </div>
                          {ls.status === "ACTIVE" && (
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleRenewLease(ls.id, ls.lease_number)}
                                className="px-3 py-1 rounded-lg bg-[#F6F4EF] hover:bg-[#EAE5DB] text-[#172B38] border border-[#EAE5DB] text-xs font-semibold transition"
                              >
                                Perpanjang Kontrak
                              </button>
                              <button
                                type="button"
                                onClick={() => confirmTerminateLease(ls.id, ls.lease_number)}
                                className="px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition"
                              >
                                Hentikan Kontrak
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* 4. TAGIHAN DAN PEMBAYARAN */}
        {authenticated && !loading && activeNav === "tagihan" && (
          <div className="space-y-6 animate-fade-up">
            <form
              onSubmit={handleCreateManualInvoice}
              className="bg-white rounded-xl border border-slate-200 p-6 space-y-4"
            >
              <div>
                <h2 className="text-base font-bold text-slate-900">Buat Tagihan Baru</h2>
                <p className="text-xs text-slate-500">
                  Terbitkan tagihan untuk kontrak sewa beserta komponen biaya, potongan, atau pajak.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label htmlFor="inv-lease" className="block text-xs font-semibold text-slate-700">
                    Pilih Kontrak Sewa
                  </label>
                  <select
                    id="inv-lease"
                    value={invLeaseId}
                    onChange={(e) => setInvLeaseId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {leases.map((ls) => (
                      <option key={ls.id} value={ls.id}>
                        {ls.lease_number} — {ls.tenant?.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="inv-no" className="block text-xs font-semibold text-slate-700">
                    Nomor Tagihan
                  </label>
                  <input
                    id="inv-no"
                    type="text"
                    required
                    value={invNumber}
                    onChange={(e) => setInvNumber(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="inv-start" className="block text-xs font-semibold text-slate-700">
                    Awal Periode Tagihan
                  </label>
                  <input
                    id="inv-start"
                    type="date"
                    required
                    value={invPeriodStart}
                    onChange={(e) => setInvPeriodStart(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="inv-due" className="block text-xs font-semibold text-slate-700">
                    Tanggal Jatuh Tempo
                  </label>
                  <input
                    id="inv-due"
                    type="date"
                    required
                    value={invDueDate}
                    onChange={(e) => setInvDueDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label htmlFor="inv-desc" className="block text-xs font-semibold text-slate-700">
                    Keterangan Tagihan
                  </label>
                  <input
                    id="inv-desc"
                    type="text"
                    required
                    value={invDesc}
                    onChange={(e) => setInvDesc(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="inv-amount"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Nominal Pokok (Rp)
                  </label>
                  <input
                    id="inv-amount"
                    type="number"
                    required
                    value={invAmount}
                    onChange={(e) => setInvAmount(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="inv-disc" className="block text-xs font-semibold text-slate-700">
                    Potongan Harga (Rp)
                  </label>
                  <input
                    id="inv-disc"
                    type="number"
                    value={invDiscount}
                    onChange={(e) => setInvDiscount(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="inv-tax" className="block text-xs font-semibold text-slate-700">
                    Pajak (Rp)
                  </label>
                  <input
                    id="inv-tax"
                    type="number"
                    value={invTax}
                    onChange={(e) => setInvTax(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#172B38] hover:bg-[#213B4D] text-[#EAE5DB] border border-[#C9B58E]/30 text-xs font-semibold transition"
              >
                Terbitkan Tagihan
              </button>
            </form>

            {/* Invoices List */}
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Daftar Tagihan Sewa</h2>
                  <p className="text-xs text-slate-500">
                    Pantau status pelunasan dan kirimkan pengingat pembayaran kepada penyewa.
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search
                    className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    placeholder="Cari nomor tagihan atau penyewa..."
                    aria-label="Cari tagihan"
                    className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="divide-y divide-slate-200">
                {filteredInvoices.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Tidak ada tagihan yang ditemukan.
                  </div>
                ) : (
                  filteredInvoices.map((inv) => {
                    const st = getInvoiceStatusDisplay(inv.status);
                    return (
                      <div
                        key={inv.id}
                        className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-sm"
                      >
                        <div>
                          <div className="font-bold text-slate-900">
                            {inv.invoice_number} —{" "}
                            <span>{inv.lease?.tenant?.full_name || "Penyewa"}</span>
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">
                            Total Tagihan: <strong>{formatIDR(inv.total)}</strong> • Sudah
                            Dibayar: <strong>{formatIDR(inv.paid_amount)}</strong>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Periode: {formatDateID(inv.billing_period_start)} s/d{" "}
                            {formatDateID(inv.billing_period_end)} • Jatuh Tempo:{" "}
                            {formatDateID(inv.due_date)}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceForModal(inv)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#172B38] hover:bg-[#213B4D] text-[#EAE5DB] border border-[#C9B58E]/30 text-xs font-semibold transition"
                          >
                            <Printer className="h-3.5 w-3.5 text-[#C9B58E]" />
                            <span>Cetak / PDF</span>
                          </button>
                          {inv.status !== "PAID" && inv.status !== "CANCELLED" && (
                            <button
                              type="button"
                              onClick={() => handleSendWaReminder(inv)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition"
                            >
                              Kirim WA (Gratis)
                            </button>
                          )}
                          <StatusBadge label={st.label} variant={st.variant} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Payments Verification Section */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Daftar Pembayaran dan Verifikasi
                </h2>
                <p className="text-xs text-slate-500">
                  Verifikasi pembayaran yang masuk agar saldo tagihan penyewa diperbarui secara
                  akurat.
                </p>
              </div>

              {signedUrlPreview && (
                <div className="rounded-xl bg-[#F6F4EF] border border-[#C9B58E]/50 p-4 text-xs text-[#172B38] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-sm">
                      Pratinjau Dokumen Bukti Pembayaran{" "}
                      {previewPaymentReceipt ? `— ${previewPaymentReceipt.paymentNumber}` : ""}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSignedUrlPreview(null);
                        setPreviewPaymentReceipt(null);
                      }}
                      className="text-xs font-semibold underline"
                    >
                      Tutup Pratinjau
                    </button>
                  </div>

                  {previewPaymentReceipt?.dataUrl ? (
                    <div className="rounded-lg bg-white border border-[#EAE5DB] p-3 text-center space-y-2">
                      <img
                        src={previewPaymentReceipt.dataUrl}
                        alt="Lampiran bukti transfer penyewa"
                        className="max-h-56 w-auto mx-auto rounded border border-[#EAE5DB] object-contain"
                      />
                      <div className="text-[11px] text-[#303437]/75">
                        File diunggah penyewa: <strong>{previewPaymentReceipt.fileName}</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-white border border-[#EAE5DB] p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[#303437]/65 block">Nomor Referensi</span>
                        <strong className="text-[#172B38]">
                          {previewPaymentReceipt?.paymentNumber || "PAY-2026-0001"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#303437]/65 block">Nominal Ditransfer</span>
                        <strong className="text-emerald-700">
                          {formatIDR(previewPaymentReceipt?.amount || 138600000)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#303437]/65 block">Rekening Tujuan</span>
                        <strong className="text-[#172B38]">
                          {previewPaymentReceipt?.bankLabel || "BCA (8720-1928-33)"}
                        </strong>
                      </div>
                    </div>
                  )}

                  <div className="pt-1 border-t border-[#EAE5DB]">
                    <div className="font-semibold">
                      Tautan Dokumen Bukti Pembayaran (Signed URL Aktif 10 Menit):
                    </div>
                    <div className="mt-1 font-mono text-[11px] break-all text-[#303437]/80">
                      {signedUrlPreview}
                    </div>
                  </div>
                </div>
              )}

              <div className="divide-y divide-slate-200">
                {payments.map((p) => {
                  const st = getPaymentStatusDisplay(p.status);
                  return (
                    <div
                      key={p.id}
                      className="py-4 flex flex-wrap items-center justify-between gap-4 text-sm"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {p.payment_number} — {formatIDR(p.amount)}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Metode: {getPaymentMethodLabel(p.method)} • Rekening Tujuan:{" "}
                          {p.destination_bank_account?.bank_name || "-"} (
                          {p.destination_bank_account?.account_number || "-"})
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleGenerateSignedUrl(p)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
                        >
                          Lihat Bukti Pembayaran
                        </button>
                        {p.status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleVerifyPayment(p.id, p.amount)}
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                            >
                              Verifikasi Pembayaran
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmRejectPayment(p.id, p.payment_number)}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition"
                            >
                              Tolak
                            </button>
                          </>
                        )}
                        {p.status === "VERIFIED" && (
                          <button
                            type="button"
                            onClick={() => confirmRefundPayment(p.id, p.payment_number)}
                            className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition"
                          >
                            Kembalikan Dana
                          </button>
                        )}
                        <StatusBadge label={st.label} variant={st.variant} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* 5. KELUHAN DAN PERMINTAAN BANTUAN */}
        {authenticated && !loading && activeNav === "keluhan" && (
          <div className="space-y-6 animate-fade-up">
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Daftar Keluhan dan Permintaan Bantuan
                  </h2>
                  <p className="text-xs text-slate-500">
                    Menampilkan {filteredComplaints.length} laporan dari penyewa.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-56">
                    <Search
                      className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={complaintSearch}
                      onChange={(e) => setComplaintSearch(e.target.value)}
                      placeholder="Cari nomor atau judul keluhan..."
                      aria-label="Cari keluhan"
                      className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-xs"
                    />
                  </div>
                  <select
                    value={complaintFilterStatus}
                    onChange={(e) => setComplaintFilterStatus(e.target.value)}
                    aria-label="Filter status keluhan"
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium bg-white"
                  >
                    <option value="ALL">Semua Status</option>
                    {COMPLAINT_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="divide-y divide-slate-200">
                {filteredComplaints.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    Belum ada laporan keluhan yang sesuai dengan filter.
                  </div>
                ) : (
                  filteredComplaints.map((c) => {
                    const statusDisplay = getComplaintStatusDisplay(c.status);
                    const priorityDisplay = getPriorityDisplay(c.priority);
                    return (
                      <div key={c.id} className="p-6 space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-1 max-w-2xl">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-[#172B38] bg-[#F6F4EF] px-2.5 py-0.5 rounded border border-[#EAE5DB]">
                                Nomor Keluhan: {c.ticket_number}
                              </span>
                              <StatusBadge
                                label={`Prioritas ${priorityDisplay.label}`}
                                variant={priorityDisplay.variant}
                              />
                              <StatusBadge
                                label={statusDisplay.label}
                                variant={statusDisplay.variant}
                              />
                            </div>
                            <h3 className="text-base font-bold text-slate-900 pt-1">{c.title}</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {c.description}
                            </p>
                          </div>

                          <div className="flex flex-col sm:items-end gap-1.5">
                            <label
                              htmlFor={`status-${c.id}`}
                              className="text-xs font-semibold text-slate-600"
                            >
                              Ubah Status Penanganan
                            </label>
                            <select
                              id={`status-${c.id}`}
                              value={
                                c.status === "REVIEWED" ? "IN_PROGRESS" : c.status
                              }
                              onChange={(e) =>
                                handleUpdateComplaintStatus(c.id, e.target.value)
                              }
                              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800"
                            >
                              {COMPLAINT_STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                          <div>
                            <span className="text-slate-400 block">Nama Penyewa</span>
                            <span className="font-semibold text-slate-800">
                              {c.tenant?.full_name || "-"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Properti &amp; Nomor Unit</span>
                            <span className="font-semibold text-slate-800">
                              {c.unit?.property?.name || "Ruko Golden Boulevard BSD"} —{" "}
                              {c.unit?.unit_number || "-"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Tanggal Laporan</span>
                            <span className="font-semibold text-slate-800">
                              {formatDateID(c.created_at)}
                            </span>
                          </div>
                           <div>
                             <span className="text-slate-400 block">Petugas yang Menangani</span>
                             <span className="font-semibold text-slate-800">
                               Tim Operasional Properti
                             </span>
                           </div>
                         </div>

                         {/* Complaint Discussion Messages & Close Button (COMP-04 & COMP-07) */}
                         <div className="pt-3 border-t border-slate-100 space-y-2.5">
                           {(c.messages || []).length > 0 && (
                             <div className="space-y-1.5">
                               {(c.messages || []).map((m: any) => (
                                 <div
                                   key={m.id}
                                   className="rounded-lg bg-[#F6F4EF] border border-[#EAE5DB] px-3 py-1.5 text-xs text-[#303437]"
                                 >
                                   {m.message}
                                 </div>
                               ))}
                             </div>
                           )}
                           <div className="flex flex-wrap items-center gap-2">
                             <input
                               type="text"
                               value={ownerComplaintReplies[c.id] || ""}
                               onChange={(e) =>
                                 setOwnerComplaintReplies((prev) => ({
                                   ...prev,
                                   [c.id]: e.target.value,
                                 }))
                               }
                               placeholder="Tulis tanggapan atau instruksi teknisi kepada penyewa..."
                               className="flex-1 min-w-[220px] rounded-lg border border-[#EAE5DB] px-3 py-1.5 text-xs focus:border-[#172B38] focus:outline-none"
                             />
                             <button
                               type="button"
                               onClick={() => handleSendOwnerComplaintReply(c.id)}
                               className="px-3.5 py-1.5 rounded-lg bg-[#172B38] hover:bg-[#213B4D] text-[#EAE5DB] text-xs font-semibold transition"
                             >
                               Kirim Tanggapan
                             </button>
                             {c.status !== "CLOSED" && (
                               <button
                                 type="button"
                                 onClick={() => handleCloseComplaint(c.id)}
                                 className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition"
                               >
                                 Tandai Selesai &amp; Tutup Tiket
                               </button>
                             )}
                           </div>
                         </div>
                       </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        )}

        {/* 6. NOTIFIKASI */}
        {authenticated && !loading && activeNav === "notifikasi" && (
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-fade-up">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                Riwayat Pengiriman Notifikasi WhatsApp
              </h2>
              <p className="text-xs text-slate-500">
                Daftar pesan pengingat dan pemberitahuan tagihan yang dikirimkan kepada penyewa.
              </p>
            </div>

            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Belum ada riwayat pengiriman notifikasi. Anda dapat mengirim pengingat pada menu
                Tagihan dan Pembayaran.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-sm"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {getNotificationTemplateLabel(n.template_key)} — Tujuan: {n.recipient}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Saluran: WhatsApp Resmi • Waktu Pengiriman:{" "}
                        {formatDateID(n.sent_at || n.created_at)}
                      </div>
                    </div>
                    <StatusBadge
                      label={n.status === "SENT" ? "Terkirim" : "Sedang Diproses"}
                      variant={n.status === "SENT" ? "success" : "info"}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 7. RIWAYAT AKTIVITAS */}
        {authenticated && !loading && activeNav === "aktivitas" && (
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-fade-up">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">Riwayat Aktivitas Organisasi</h2>
              <p className="text-xs text-slate-500">
                Catatan aktivitas penting seperti verifikasi pembayaran, perubahan kontrak, dan
                pengelolaan anggota.
              </p>
            </div>

            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Belum ada riwayat aktivitas tercatat.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-sm"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {getAuditActionLabel(log.action)}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Tanggal: {formatDateID(log.created_at)} • Alamat IP: {log.ip_address || "-"}
                      </div>
                    </div>
                    <StatusBadge label="Tercatat" variant="neutral" />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 8. REKENING DAN PENGGUNA */}
        {authenticated && !loading && activeNav === "rekening" && (
          <div className="space-y-6 animate-fade-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form
                onSubmit={handleCreateBank}
                className="bg-white rounded-xl border border-slate-200 p-6 space-y-4"
              >
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Tambah Rekening Bank Penerima
                  </h2>
                  <p className="text-xs text-slate-500">
                    Rekening ini akan ditampilkan kepada penyewa sebagai tujuan transfer pembayaran
                    tagihan.
                  </p>
                </div>
                <div>
                  <label htmlFor="bank-name" className="block text-xs font-semibold text-slate-700">
                    Nama Bank
                  </label>
                  <input
                    id="bank-name"
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Contoh: BCA / Mandiri / BRI"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="bank-no" className="block text-xs font-semibold text-slate-700">
                    Nomor Rekening
                  </label>
                  <input
                    id="bank-no"
                    type="text"
                    required
                    value={bankNumber}
                    onChange={(e) => setBankNumber(e.target.value)}
                    placeholder="Contoh: 8720-1928-33"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="bank-holder"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Nama Pemilik Rekening
                  </label>
                  <input
                    id="bank-holder"
                    type="text"
                    required
                    value={bankHolder}
                    onChange={(e) => setBankHolder(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#172B38] hover:bg-[#213B4D] text-[#EAE5DB] border border-[#C9B58E]/30 text-xs font-semibold transition"
                >
                  Simpan Rekening Bank
                </button>
              </form>

              <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
                <h2 className="text-base font-bold text-slate-900">Daftar Rekening Bank Aktif</h2>
                <div className="divide-y divide-slate-200">
                  {banks.map((b) => (
                    <div
                      key={b.id}
                      className="py-3.5 flex items-center justify-between text-sm"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {b.bank_name} — {b.account_number}
                        </div>
                        <div className="text-xs text-slate-500">a.n. {b.account_holder_name}</div>
                      </div>
                      {b.is_primary && <StatusBadge label="Rekening Utama" variant="info" />}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form
                onSubmit={handleInviteStaff}
                className="bg-white rounded-xl border border-slate-200 p-6 space-y-4"
              >
                <div>
                  <h2 className="text-base font-bold text-slate-900">Tambah Staf Pengelola</h2>
                  <p className="text-xs text-slate-500">
                    Undang anggota tim Anda dan berikan peran sesuai tanggung jawabnya.
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="staff-name"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Nama Lengkap Staf
                  </label>
                  <input
                    id="staff-name"
                    type="text"
                    required
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="Contoh: Rina Wulandari"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="staff-email"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Alamat Email Staf
                    </label>
                    <input
                      id="staff-email"
                      type="email"
                      required
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      placeholder="rina@perusahaan.id"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="staff-role"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Peran Staf
                    </label>
                    <select
                      id="staff-role"
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="ADMIN">Administrator</option>
                      <option value="MANAGER">Manajer Properti</option>
                      <option value="FINANCE">Staf Keuangan</option>
                      <option value="STAFF">Staf Operasional</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#172B38] hover:bg-[#213B4D] text-[#EAE5DB] border border-[#C9B58E]/30 text-xs font-semibold transition"
                >
                  Simpan Anggota Staf
                </button>
              </form>

              <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
                <h2 className="text-base font-bold text-slate-900">
                  Daftar Pengguna dalam Organisasi ({members.length})
                </h2>
                <div className="divide-y divide-slate-200">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="py-3.5 flex items-center justify-between text-sm"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{m.user?.name}</div>
                        <div className="text-xs text-slate-500">{m.user?.email}</div>
                      </div>
                      <StatusBadge label={getRoleLabel(m.role?.code)} variant="info" />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* 9. PENGATURAN */}
        {authenticated && !loading && activeNav === "pengaturan" && (
          <form
            onSubmit={handleSaveSettings}
            className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl space-y-5 animate-fade-up"
          >
            <div>
              <h2 className="text-base font-bold text-slate-900">Pengaturan Organisasi</h2>
              <p className="text-xs text-slate-500">
                Sesuaikan profil organisasi, zona waktu pengingat tagihan, dan layanan pembayaran
                otomatis.
              </p>
            </div>

            <div>
              <label htmlFor="set-org-name" className="block text-xs font-semibold text-slate-700">
                Nama Organisasi / Pengelola
              </label>
              <input
                id="set-org-name"
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="set-tz" className="block text-xs font-semibold text-slate-700">
                Zona Waktu Operasional
              </label>
              <select
                id="set-tz"
                value={orgTimezone}
                onChange={(e) => setOrgTimezone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              >
                <option value="Asia/Jakarta">Waktu Indonesia Barat (Asia/Jakarta)</option>
                <option value="Asia/Makassar">Waktu Indonesia Tengah (Asia/Makassar)</option>
                <option value="Asia/Jayapura">Waktu Indonesia Timur (Asia/Jayapura)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Pengaturan Pembayaran Otomatis (Opsional)
                </h3>
                <p className="text-xs text-slate-500">
                  Hubungkan akun penyedia pembayaran milik bisnis Anda agar pembayaran penyewa
                  langsung diteruskan ke rekening perusahaan.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="set-gw" className="block text-xs font-semibold text-slate-700">
                    Penyedia Layanan Pembayaran
                  </label>
                  <select
                    id="set-gw"
                    value={gatewayProvider}
                    onChange={(e) => setGatewayProvider(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="MIDTRANS">Midtrans</option>
                    <option value="XENDIT">Xendit</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="set-merchant"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Kode Identitas Merchant
                  </label>
                  <input
                    id="set-merchant"
                    type="text"
                    value={gatewayMerchantId}
                    onChange={(e) => setGatewayMerchantId(e.target.value)}
                    placeholder="Contoh: G123456789"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#172B38] hover:bg-[#213B4D] text-[#EAE5DB] border border-[#C9B58E]/30 text-xs font-semibold transition"
            >
              Simpan Pengaturan
            </button>

            <div className="pt-5 border-t border-slate-200 space-y-3">
              <div className="rounded-xl bg-[#F6F4EF] border border-[#C9B58E]/40 p-4 space-y-2">
                <div className="text-xs font-bold text-[#172B38] uppercase tracking-wider">
                  Status Layanan Tanpa Biaya (100% Gratis Aktif)
                </div>
                <ul className="text-xs text-[#303437] space-y-1.5">
                  <li>
                    • <strong>WhatsApp Direct &amp; Fonnte Free Tier:</strong> Aktif (Kirim
                    tagihan langsung ke nomor WhatsApp penyewa Rp 0).
                  </li>
                  <li>
                    • <strong>Transfer Bank Manual &amp; QRIS Statis:</strong> Aktif (0% potongan
                    biaya admin pihak ketiga).
                  </li>
                  <li>
                    • <strong>Database PostgreSQL Produksi:</strong> Aktif (Seluruh data tersimpan
                    permanen).
                  </li>
                </ul>
              </div>

              <div className="rounded-xl bg-rose-50/70 border border-rose-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-rose-900">
                    Mulai Data Baru (Bersihkan Data Contoh Awal)
                  </div>
                  <p className="text-[11px] text-rose-800/80 mt-0.5">
                    Hapus seluruh properti, unit, penyewa, dan tagihan contoh bawaan agar ruang
                    kerja ini siap diisi 100% data properti asli Anda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={confirmResetToCleanProduction}
                  className="px-3.5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shrink-0 transition"
                >
                  Bersihkan Data Contoh
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
