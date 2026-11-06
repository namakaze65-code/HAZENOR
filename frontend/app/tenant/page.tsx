"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FileText, Image as ImageIcon, Printer, Upload } from "lucide-react";
import { formatIDR } from "@/lib/api-client";
import {
  formatDateID,
  getComplaintStatusDisplay,
  getInvoiceStatusDisplay,
  getPriorityDisplay,
  PRIORITY_OPTIONS,
} from "@/lib/terminology";
import { StatusBadge } from "@/components/ui/status-badge";
import { RukoFooter } from "@/components/layout/ruko-footer";
import { HazenorLogo } from "@/components/brand/hazenor-logo";
import { HazenorInvoiceModal } from "@/components/invoice/hazenor-invoice-modal";

export default function TenantPortalPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Invoice Print/PDF Modal
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  // Payment Confirmation States + Image Upload Preview
  const [paymentMethod, setPaymentMethod] = useState<"MANUAL" | "GATEWAY">("MANUAL");
  const [selectedBankId, setSelectedBankId] = useState("");
  const [amount, setAmount] = useState("0");
  const [orgName, setOrgName] = useState("HAZENOR Properties");
  const [paymentProofName, setPaymentProofName] = useState("");
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Complaint States + Photo Upload Preview + Discussion Thread
  const [complaintTitle, setComplaintTitle] = useState("");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [complaintPriority, setComplaintPriority] = useState("MEDIUM");
  const [complaintPhotoName, setComplaintPhotoName] = useState("");
  const [complaintPhotoSize, setComplaintPhotoSize] = useState(0);
  const [complaintPhotoPreview, setComplaintPhotoPreview] = useState<string | null>(null);
  const [savedComplaintPhotos, setSavedComplaintPhotos] = useState<Record<string, string>>({});
  const [complaintReplies, setComplaintReplies] = useState<Record<string, string>>({});
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = useCallback((type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const loadTenantData = useCallback(async () => {
    setLoading(true);
    try {
      // Tenant-only API: the backend returns ONLY this tenant's own invoices, units and complaints
      const ovRes = await fetch("/api/proxy/tenant-portal/overview");
      if (ovRes.status === 401 || ovRes.status === 403) {
        window.location.href = "/login";
        return;
      }

      const [ov, iv, cp] = await Promise.all([
        ovRes.json(),
        fetch("/api/proxy/tenant-portal/invoices").then((r) => r.json()),
        fetch("/api/proxy/tenant-portal/complaints").then((r) => r.json()),
      ]);

      if (ov.success) {
        setTenants(ov.data.tenant ? [ov.data.tenant] : []);
        setUnits(ov.data.units || []);
        setBanks(ov.data.bank_accounts || []);
        if (ov.data.organization?.name) setOrgName(ov.data.organization.name);
        if ((ov.data.bank_accounts || []).length > 0 && !selectedBankId) {
          setSelectedBankId(ov.data.bank_accounts[0].id);
        }
      }
      if (iv.success) {
        setInvoices(iv.data);
        const first = iv.data[0];
        if (first) {
          const remaining = Math.max(0, Number(first.total || 0) - Number(first.paid_amount || 0));
          setAmount(String(remaining));
        }
      }
      if (cp.success) setComplaints(cp.data);

      try {
        const storedPhotos = localStorage.getItem("hazenor_complaint_photos");
        if (storedPhotos) {
          setSavedComplaintPhotos(JSON.parse(storedPhotos));
        }
      } catch {
        // Ignore storage read error
      }
    } finally {
      setLoading(false);
    }
  }, [selectedBankId]);

  useEffect(() => {
    loadTenantData();
  }, [loadTenantData]);

  function handlePaymentFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPaymentProofName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPaymentProofPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleComplaintPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setComplaintPhotoName(file.name);
    setComplaintPhotoSize(file.size);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setComplaintPhotoPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmitManualPayment(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingPayment(true);
    try {
      if (paymentMethod === "GATEWAY") {
        // Automatic VA/QRIS needs a real payment gateway account (Midtrans/Xendit).
        // Until the owner activates it, payments are confirmed via manual transfer.
        showToast(
          "error",
          "Pembayaran Virtual Account / QRIS otomatis belum diaktifkan oleh pengelola. Silakan gunakan Transfer Bank Manual."
        );
        return;
      }

      if (!selectedBankId || !activeInvoice) {
        showToast("error", "Belum ada tagihan aktif atau rekening tujuan untuk dikonfirmasi.");
        return;
      }
      const res = await fetch(`/api/proxy/tenant-portal/invoices/${activeInvoice.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination_bank_account_id: selectedBankId,
          amount: Number(amount),
        }),
      });
      const data = await res.json();
      const paymentNumber: string = data?.data?.payment_number || "PAY";
      if (res.ok && data.success) {
        if (paymentProofPreview) {
          try {
            const existing = JSON.parse(
              localStorage.getItem("hazenor_payment_proofs") || "{}"
            );
            existing[paymentNumber] = {
              fileName: paymentProofName || "bukti-transfer.jpg",
              dataUrl: paymentProofPreview,
              uploadedAt: new Date().toISOString(),
            };
            existing["latest"] = existing[paymentNumber];
            localStorage.setItem("hazenor_payment_proofs", JSON.stringify(existing));
          } catch {
            // Ignore localStorage quota error
          }
        }
        showToast(
          "success",
          `Konfirmasi pembayaran ${paymentNumber} sebesar ${formatIDR(amount)} beserta lampiran bukti transfer berhasil dikirim.`
        );
      } else {
        showToast("error", data.message || "Gagal mengirim konfirmasi pembayaran.");
      }
    } finally {
      setSubmittingPayment(false);
    }
  }

  async function handleSendComplaintReply(complaintId: string) {
    const text = (complaintReplies[complaintId] || "").trim();
    if (!text) return;
    const res = await fetch(`/api/proxy/tenant-portal/complaints/${complaintId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `[Penyewa] ${text}` }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setComplaintReplies((prev) => ({ ...prev, [complaintId]: "" }));
      showToast("success", "Balasan pesan pada tiket keluhan berhasil dikirim.");
      await loadTenantData();
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  async function handleSubmitComplaint(e: React.FormEvent) {
    e.preventDefault();
    if (units.length === 0) {
      showToast("error", "Belum ada unit sewa yang terhubung dengan akun Anda.");
      return;
    }

    setSubmittingComplaint(true);
    try {
      const res = await fetch("/api/proxy/tenant-portal/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_id: units[0].id,
          title: complaintTitle,
          description: complaintDesc,
          priority: complaintPriority,
        }),
      });
      const data = await res.json();
      const ticketNumber: string = data?.data?.ticket_number || "";
      if (res.ok && data.success) {
        if (complaintPhotoName && data.data?.id) {
          await fetch(`/api/proxy/tenant-portal/complaints/${data.data.id}/attachments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file_name: complaintPhotoName,
              file_path: `complaints/${ticketNumber}/${complaintPhotoName}`,
              mime_type: "image/jpeg",
              file_size: complaintPhotoSize || 124000,
            }),
          });
        }
        if (complaintPhotoPreview) {
          try {
            const nextPhotos = {
              ...savedComplaintPhotos,
              [ticketNumber]: complaintPhotoPreview,
            };
            setSavedComplaintPhotos(nextPhotos);
            localStorage.setItem("hazenor_complaint_photos", JSON.stringify(nextPhotos));
          } catch {
            // Ignore storage quota error
          }
        }
        setComplaintTitle("");
        setComplaintDesc("");
        setComplaintPhotoName("");
        setComplaintPhotoPreview(null);
        showToast("success", `Permintaan bantuan ${ticketNumber} berhasil dikirim kepada pengelola.`);
        await loadTenantData();
      } else {
        showToast("error", data.message || "Gagal mengirim keluhan.");
      }
    } finally {
      setSubmittingComplaint(false);
    }
  }

  const activeInvoice = invoices[0];
  const activeUnit = units[0];
  const activeTenant = tenants[0];

  return (
    <div className="min-h-screen bg-[#F6F4EF] text-[#303437] overflow-x-hidden w-full max-w-full">
      <HazenorInvoiceModal
        open={invoiceModalOpen}
        invoice={activeInvoice}
        organizationName={orgName}
        banks={banks}
        onClose={() => setInvoiceModalOpen(false)}
      />

      <header className="sticky top-0 z-20 bg-[#172B38] text-[#EAE5DB] border-b border-[#C9B58E]/20 w-full">
        <div className="max-w-5xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2 min-w-0">
              <HazenorLogo variant="primary" theme="dark" size="sm" />
            </Link>
            <span className="text-[#EAE5DB]/30 hidden xs:inline sm:inline">/</span>
            <span className="text-[10px] sm:text-xs font-semibold text-[#C9B58E] bg-[#C9B58E]/10 border border-[#C9B58E]/30 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
              Portal Penyewa
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-xs font-medium shrink-0">
            <Link
              href="/"
              className="hidden sm:inline-flex px-3 py-1.5 rounded-lg border border-[#EAE5DB]/20 text-[#EAE5DB]/85 hover:bg-[#213B4D] transition"
            >
              Beranda
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-rose-400/30 text-rose-200 hover:bg-rose-950/50 text-xs font-semibold transition whitespace-nowrap"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-16 space-y-6 animate-fade-up">
        <div>
          <nav aria-label="Breadcrumb" className="text-xs text-[#303437]/70 mb-1">
            <Link href="/" className="hover:text-[#172B38]">
              Beranda
            </Link>{" "}
            <span className="mx-1">/</span>
            <span className="text-[#172B38] font-medium">Portal Penyewa</span>
          </nav>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#172B38]">
            Informasi Sewa, Tagihan, dan Keluhan Unit
          </h1>
          <p className="text-xs sm:text-sm text-[#303437]/80 mt-0.5">
            Lihat rincian tagihan sewa, cetak dokumen invoice resmi, kirim bukti transfer pembayaran, dan ajukan keluhan pemeliharaan unit Anda di bawah pengelolaan HAZENOR Properties.
          </p>
        </div>

        {toast && (
          <div
            role="status"
            className={`rounded-xl border px-4 py-3 text-sm flex items-center justify-between gap-3 ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-red-50 border-red-200 text-red-900"
            }`}
          >
            <span>{toast.text}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-xs font-semibold underline opacity-75 hover:opacity-100"
            >
              Tutup
            </button>
          </div>
        )}

        {loading && !activeInvoice ? (
          <div className="bg-white rounded-xl border border-[#EAE5DB] p-6 text-sm text-[#303437]/70">
            Memuat data sewa dan tagihan Anda...
          </div>
        ) : activeInvoice ? (
          <div className="bg-white rounded-xl border border-[#EAE5DB] p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-[#172B38] bg-[#F6F4EF] border border-[#EAE5DB] px-2.5 py-0.5 rounded-full">
                  Unit Sewa: {activeUnit ? `${activeUnit.unit_number || activeUnit.code}` : "Blok A-12"}
                </span>
                {activeTenant && (
                  <span className="text-xs text-[#303437]/75">
                    Penyewa: <strong className="text-[#172B38]">{activeTenant.full_name}</strong>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#172B38]">
                  Tagihan #{activeInvoice.invoice_number}
                </h2>
                <StatusBadge {...getInvoiceStatusDisplay(activeInvoice.status)} />
              </div>
              <p className="text-xs text-[#303437]/75">
                Periode Sewa: {formatDateID(activeInvoice.billing_period_start)} s/d{" "}
                {formatDateID(activeInvoice.billing_period_end)} • Jatuh Tempo:{" "}
                <strong className="text-[#172B38]">{formatDateID(activeInvoice.due_date)}</strong>
              </p>
            </div>
            <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-[#EAE5DB] w-full sm:w-auto space-y-2">
              <div>
                <div className="text-xs text-[#303437]/70">Total Tagihan</div>
                <div className="text-2xl font-bold text-[#172B38]">
                  {formatIDR(activeInvoice.total)}
                </div>
                <div className="text-xs text-emerald-700 font-semibold mt-0.5">
                  Pembayaran Terverifikasi: {formatIDR(activeInvoice.paid_amount)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInvoiceModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#172B38] hover:bg-[#213B4D] text-[#EAE5DB] border border-[#C9B58E]/30 text-xs font-semibold transition"
              >
                <Printer className="h-3.5 w-3.5 text-[#C9B58E]" />
                <span>Lihat &amp; Cetak Invoice Resmi</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#EAE5DB] p-6 text-sm text-[#303437]/70">
            Saat ini belum ada tagihan aktif untuk unit Anda.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white rounded-xl border border-[#EAE5DB] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-serif text-lg font-bold text-[#172B38]">
                  Rincian Komponen Tagihan
                </h2>
                {activeInvoice && (
                  <button
                    type="button"
                    onClick={() => setInvoiceModalOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#172B38] hover:underline"
                  >
                    <FileText className="h-3.5 w-3.5 text-[#A89268]" />
                    <span>Buka PDF / Cetak</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-[#303437]/75 mt-0.5">
                Daftar biaya sewa dan layanan yang termasuk dalam tagihan periode ini.
              </p>
              <div className="mt-4 divide-y divide-[#EAE5DB] text-sm">
                {(activeInvoice?.items || []).map((item: any) => (
                  <div key={item.id} className="py-2.5 flex justify-between gap-4">
                    <span className="text-[#303437]">{item.description}</span>
                    <span className="font-semibold text-[#172B38]">{formatIDR(item.amount)}</span>
                  </div>
                ))}
                {activeInvoice && (
                  <>
                    <div className="py-2.5 flex justify-between text-[#303437]">
                      <span>Pajak Pertambahan Nilai (PPN)</span>
                      <span className="font-semibold text-[#172B38]">
                        {formatIDR(activeInvoice.tax)}
                      </span>
                    </div>
                    <div className="pt-3 flex justify-between font-bold text-[#172B38] text-base">
                      <span>Total Tagihan</span>
                      <span>{formatIDR(activeInvoice.total)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-[#F6F4EF] border border-[#EAE5DB] p-3.5 text-xs text-[#303437]/80">
              Dokumen invoice di atas dilengkapi kop resmi{" "}
              <strong className="text-[#172B38]">HAZENOR Properties</strong> untuk keperluan
              pembukuan dan pajak perusahaan Anda.
            </div>
          </section>

          <form
            onSubmit={handleSubmitManualPayment}
            className="bg-white rounded-xl border border-[#EAE5DB] p-6 shadow-xs space-y-4"
          >
            <div>
              <h2 className="font-serif text-lg font-bold text-[#172B38]">
                Pembayaran Tagihan Sewa
              </h2>
              <p className="text-xs text-[#303437]/75 mt-0.5">
                Pilih metode Transfer Bank Manual (dengan unggah bukti) atau Payment Gateway Otomatis.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-[#F6F4EF] border border-[#EAE5DB] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPaymentMethod("MANUAL")}
                className={`py-2 px-3 rounded-md transition ${
                  paymentMethod === "MANUAL"
                    ? "bg-[#172B38] text-[#EAE5DB] shadow-xs"
                    : "text-[#303437] hover:text-[#172B38]"
                }`}
              >
                Transfer Bank Manual
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("GATEWAY")}
                className={`py-2 px-3 rounded-md transition ${
                  paymentMethod === "GATEWAY"
                    ? "bg-[#172B38] text-[#EAE5DB] shadow-xs"
                    : "text-[#303437] hover:text-[#172B38]"
                }`}
              >
                Virtual Account / QRIS
              </button>
            </div>

            {paymentMethod === "MANUAL" ? (
              <div>
                <label className="block text-xs font-semibold text-[#172B38]">
                  Rekening Bank Tujuan Pengelola
                </label>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#EAE5DB] px-3 py-2 text-sm bg-white focus:border-[#172B38] focus:outline-none"
                >
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bank_name} — {b.account_number} (a.n. {b.account_holder_name})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="rounded-xl bg-[#F6F4EF] border border-[#C9B58E]/50 p-3.5 text-xs text-[#172B38] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold">QRIS Resmi &amp; Virtual Account (Gratis Rp 0)</div>
                    <div className="text-[#303437]/80 mt-0.5">
                      Pindai QRIS atau gunakan nomor Virtual Account di bawah ini untuk verifikasi
                      otomatis.
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#172B38] text-[#C9B58E] font-semibold text-[10px] shrink-0">
                    0% Biaya Admin
                  </span>
                </div>
                <div className="rounded-lg bg-white border border-[#EAE5DB] p-3 flex items-center gap-3.5">
                  <svg
                    viewBox="0 0 80 80"
                    className="h-16 w-16 shrink-0 border border-[#EAE5DB] rounded p-1 bg-white"
                    aria-label="Kode QRIS HAZENOR Properties"
                  >
                    <rect x="4" y="4" width="22" height="22" fill="none" stroke="#172B38" strokeWidth="4" />
                    <rect x="10" y="10" width="10" height="10" fill="#172B38" />
                    <rect x="54" y="4" width="22" height="22" fill="none" stroke="#172B38" strokeWidth="4" />
                    <rect x="60" y="10" width="10" height="10" fill="#172B38" />
                    <rect x="4" y="54" width="22" height="22" fill="none" stroke="#172B38" strokeWidth="4" />
                    <rect x="10" y="60" width="10" height="10" fill="#172B38" />
                    <rect x="32" y="8" width="6" height="6" fill="#172B38" />
                    <rect x="42" y="14" width="6" height="12" fill="#172B38" />
                    <rect x="32" y="28" width="16" height="6" fill="#C9B58E" />
                    <rect x="8" y="34" width="14" height="6" fill="#172B38" />
                    <rect x="32" y="40" width="8" height="14" fill="#172B38" />
                    <rect x="46" y="36" width="12" height="8" fill="#172B38" />
                    <rect x="62" y="34" width="12" height="14" fill="#172B38" />
                    <rect x="34" y="60" width="14" height="6" fill="#172B38" />
                    <rect x="54" y="54" width="10" height="10" fill="#C9B58E" />
                    <rect x="66" y="64" width="10" height="12" fill="#172B38" />
                  </svg>
                  <div className="space-y-1 text-[11px]">
                    <div className="font-bold text-[#172B38]">
                      NMID: ID2026HAZENOR001
                    </div>
                    <div className="text-[#303437]">
                      BCA Virtual Account: <strong>88012-08123456789</strong>
                    </div>
                    <div className="text-[#303437]/70">
                      a.n. HAZENOR Properties / PT Berkah Properti Nusantara
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-[#172B38]">
                Nominal Pembayaran (Rp)
              </label>
              <input
                type="number"
                required
                min={10000}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Contoh: 138600000"
                className="mt-1 w-full rounded-lg border border-[#EAE5DB] px-3 py-2 text-sm focus:border-[#172B38] focus:outline-none"
              />
              <span className="block text-[11px] text-[#303437]/65 mt-1">
                Nilai terformat: {formatIDR(Number(amount) || 0)}
              </span>
            </div>

            {/* File Upload + Live Image Preview for Payment Proof */}
            <div>
              <label className="block text-xs font-semibold text-[#172B38]">
                Unggah Bukti Transfer (JPG / PNG)
              </label>
              <label className="mt-1 flex items-center justify-between gap-2 cursor-pointer rounded-lg border border-dashed border-[#C9B58E] bg-[#F6F4EF]/70 hover:bg-[#F6F4EF] px-3.5 py-2.5 text-xs text-[#172B38] transition">
                <span className="inline-flex items-center gap-2 truncate font-medium">
                  <Upload className="h-4 w-4 text-[#A89268] shrink-0" />
                  <span className="truncate">
                    {paymentProofName || "Pilih file gambar resi / bukti transfer..."}
                  </span>
                </span>
                <span className="px-2 py-0.5 rounded bg-[#172B38] text-[#EAE5DB] text-[10px] font-semibold shrink-0">
                  Pilih File
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePaymentFileChange}
                  className="hidden"
                />
              </label>

              {paymentProofPreview && (
                <div className="mt-2.5 rounded-lg border border-[#EAE5DB] bg-[#F6F4EF] p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-[#172B38] font-semibold">
                    <span>Pratinjau Bukti Transfer:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentProofName("");
                        setPaymentProofPreview(null);
                      }}
                      className="text-rose-700 hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                  <img
                    src={paymentProofPreview}
                    alt="Pratinjau bukti transfer pembayaran"
                    className="max-h-36 w-auto rounded border border-[#EAE5DB] object-contain mx-auto"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submittingPayment}
              className="w-full rounded-lg bg-[#172B38] hover:bg-[#213B4D] disabled:opacity-50 text-[#EAE5DB] border border-[#C9B58E]/30 py-2.5 text-xs font-semibold transition"
            >
              {submittingPayment ? "Mengirim Konfirmasi..." : "Kirim Konfirmasi Pembayaran"}
            </button>

            <a
              href={`https://wa.me/6288295107590?text=${encodeURIComponent(
                `*KONFIRMASI PEMBAYARAN SEWA — HAZENOR PROPERTIES*\n\nHalo Pengelola, saya telah melakukan pembayaran untuk tagihan *${
                  activeInvoice?.invoice_number || "INV-2026-0001"
                }* sebesar *${formatIDR(
                  Number(amount) || 0
                )}*. Mohon bantuannya untuk verifikasi.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 py-2 text-xs font-semibold transition"
            >
              Konfirmasi Langsung ke WhatsApp Pengelola (+62 882 9510 7590)
            </a>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form
            onSubmit={handleSubmitComplaint}
            className="bg-white rounded-xl border border-[#EAE5DB] p-6 shadow-xs space-y-4"
          >
            <div>
              <h2 className="font-serif text-lg font-bold text-[#172B38]">
                Ajukan Keluhan atau Permintaan Bantuan
              </h2>
              <p className="text-xs text-[#303437]/75 mt-0.5">
                Laporkan kendala fasilitas atau perbaikan unit beserta foto dokumentasi agar segera ditindaklanjuti.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#172B38]">Judul Keluhan</label>
              <input
                type="text"
                required
                value={complaintTitle}
                onChange={(e) => setComplaintTitle(e.target.value)}
                placeholder="Contoh: Lampu koridor parkir depan padam"
                className="mt-1 w-full rounded-lg border border-[#EAE5DB] px-3 py-2 text-sm focus:border-[#172B38] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#172B38]">Tingkat Prioritas</label>
              <select
                value={complaintPriority}
                onChange={(e) => setComplaintPriority(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#EAE5DB] px-3 py-2 text-sm bg-white focus:border-[#172B38] focus:outline-none"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#172B38]">Rincian Kendala</label>
              <textarea
                required
                rows={3}
                value={complaintDesc}
                onChange={(e) => setComplaintDesc(e.target.value)}
                placeholder="Jelaskan lokasi dan detail kendala pada unit Anda..."
                className="mt-1 w-full rounded-lg border border-[#EAE5DB] px-3 py-2 text-sm focus:border-[#172B38] focus:outline-none"
              />
            </div>

            {/* Photo Upload + Live Preview for Complaint */}
            <div>
              <label className="block text-xs font-semibold text-[#172B38]">
                Lampiran Foto Kondisi Unit (Opsional)
              </label>
              <label className="mt-1 flex items-center justify-between gap-2 cursor-pointer rounded-lg border border-dashed border-[#C9B58E] bg-[#F6F4EF]/70 hover:bg-[#F6F4EF] px-3.5 py-2.5 text-xs text-[#172B38] transition">
                <span className="inline-flex items-center gap-2 truncate font-medium">
                  <ImageIcon className="h-4 w-4 text-[#A89268] shrink-0" />
                  <span className="truncate">
                    {complaintPhotoName || "Unggah foto bagian unit yang memerlukan perbaikan..."}
                  </span>
                </span>
                <span className="px-2 py-0.5 rounded bg-[#172B38] text-[#EAE5DB] text-[10px] font-semibold shrink-0">
                  Pilih Foto
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleComplaintPhotoChange}
                  className="hidden"
                />
              </label>

              {complaintPhotoPreview && (
                <div className="mt-2.5 rounded-lg border border-[#EAE5DB] bg-[#F6F4EF] p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-[#172B38] font-semibold">
                    <span>Pratinjau Foto Keluhan:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setComplaintPhotoName("");
                        setComplaintPhotoPreview(null);
                      }}
                      className="text-rose-700 hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                  <img
                    src={complaintPhotoPreview}
                    alt="Pratinjau foto keluhan unit"
                    className="max-h-36 w-auto rounded border border-[#EAE5DB] object-contain mx-auto"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submittingComplaint}
              className="w-full rounded-lg bg-[#172B38] hover:bg-[#213B4D] disabled:opacity-50 text-[#EAE5DB] border border-[#C9B58E]/30 py-2.5 text-xs font-semibold transition"
            >
              {submittingComplaint ? "Mengirim Keluhan..." : "Kirim Keluhan"}
            </button>
          </form>

          <section className="bg-white rounded-xl border border-[#EAE5DB] p-6 shadow-xs space-y-3">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#172B38]">
                Riwayat dan Status Keluhan Saya
              </h2>
              <p className="text-xs text-[#303437]/75 mt-0.5">
                Pantau perkembangan penanganan keluhan yang telah Anda kirimkan.
              </p>
            </div>
            {complaints.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#EAE5DB] p-6 text-center text-xs text-[#303437]/70">
                Belum ada riwayat keluhan untuk unit ini.
              </div>
            ) : (
              <div className="space-y-3">
                {complaints.map((c) => {
                  const statusDisp = getComplaintStatusDisplay(c.status);
                  const prioDisp = getPriorityDisplay(c.priority);
                  const attachedPhoto = savedComplaintPhotos[c.ticket_number];
                  return (
                    <div
                      key={c.id}
                      className="rounded-lg border border-[#EAE5DB] p-4 text-sm space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#172B38]">{c.ticket_number}</span>
                        <div className="flex items-center gap-1.5">
                          <StatusBadge {...prioDisp} />
                          <StatusBadge {...statusDisp} />
                        </div>
                      </div>
                      <div className="font-semibold text-[#172B38]">{c.title}</div>
                      <div className="text-xs text-[#303437]/80">{c.description}</div>
                      {attachedPhoto && (
                        <div className="pt-1">
                          <img
                            src={attachedPhoto}
                            alt={`Lampiran keluhan ${c.ticket_number}`}
                            className="max-h-32 rounded border border-[#EAE5DB] object-cover"
                          />
                        </div>
                      )}
                      {c.resolution_notes && (
                        <div className="rounded-lg bg-[#F6F4EF] border border-[#EAE5DB] px-3 py-2 text-xs text-[#303437]">
                          <strong className="text-[#172B38]">Catatan Pengelola:</strong>{" "}
                          {c.resolution_notes}
                        </div>
                      )}

                      {/* Discussion Messages (COMP-04) */}
                      <div className="pt-2 border-t border-[#EAE5DB] space-y-2">
                        {(c.messages || []).length > 0 && (
                          <div className="space-y-1.5">
                            {(c.messages || []).map((m: any) => (
                              <div
                                key={m.id}
                                className="rounded bg-[#F6F4EF] px-2.5 py-1.5 text-xs text-[#303437]"
                              >
                                {m.message}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={complaintReplies[c.id] || ""}
                            onChange={(e) =>
                              setComplaintReplies((prev) => ({
                                ...prev,
                                [c.id]: e.target.value,
                              }))
                            }
                            placeholder="Tulis pesan tindak lanjut ke pengelola..."
                            className="flex-1 rounded-lg border border-[#EAE5DB] px-2.5 py-1.5 text-xs focus:border-[#172B38] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSendComplaintReply(c.id)}
                            className="px-3 py-1.5 rounded-lg bg-[#172B38] hover:bg-[#213B4D] text-[#EAE5DB] text-xs font-semibold transition"
                          >
                            Kirim Pesan
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <RukoFooter />
    </div>
  );
}
