"use client";

import React from "react";
import { Download, Printer, X } from "lucide-react";
import { HazenorLogo, HazenorSymbol } from "@/components/brand/hazenor-logo";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  formatDateID,
  formatIDR,
  getInvoiceStatusDisplay,
} from "@/lib/terminology";

interface HazenorInvoiceModalProps {
  open: boolean;
  invoice: any | null;
  organizationName?: string;
  banks?: any[];
  onClose: () => void;
}

export function HazenorInvoiceModal({
  open,
  invoice,
  organizationName = "PT Berkah Properti Nusantara",
  banks = [],
  onClose,
}: HazenorInvoiceModalProps) {
  if (!open || !invoice) return null;

  const statusDisplay = getInvoiceStatusDisplay(invoice.status);
  const tenantName =
    invoice.lease?.tenant?.full_name || "CV Kopi Nusantara Sejahtera";
  const tenantPhone = invoice.lease?.tenant?.phone || "081199887766";
  const tenantEmail =
    invoice.lease?.tenant?.email || "finance@kopinusantara.id";
  const unitNumber = invoice.lease?.unit?.unit_number || "Blok A-12";
  const leaseNumber = invoice.lease?.lease_number || "LEASE-2026-0001";
  const remainingAmount = Math.max(
    0,
    Number(invoice.total || 0) - Number(invoice.paid_amount || 0)
  );

  function handlePrintInvoice() {
    window.print();
  }

  function handleDownloadHtmlInvoice() {
    const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${invoice.invoice_number} — HAZENOR Properties</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #303437; background: #F6F4EF; margin: 0; padding: 32px; }
    .sheet { max-width: 800px; margin: 0 auto; background: #ffffff; border: 1px solid #EAE5DB; border-radius: 12px; padding: 40px; box-sizing: border-box; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #172B38; padding-bottom: 24px; }
    .brand-title { font-family: Georgia, serif; font-size: 24px; font-weight: bold; color: #172B38; letter-spacing: 0.18em; }
    .brand-sub { font-size: 10px; color: #C9B58E; letter-spacing: 0.24em; text-transform: uppercase; margin-top: 4px; font-weight: 600; }
    .slogan { font-family: Georgia, serif; font-style: italic; font-size: 12px; color: #303437; margin-top: 4px; }
    .inv-badge { text-align: right; }
    .inv-badge h1 { font-family: Georgia, serif; font-size: 22px; color: #172B38; margin: 0; }
    .inv-no { font-size: 14px; font-weight: bold; color: #303437; margin-top: 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px; font-size: 13px; }
    .box { background: #F6F4EF; border: 1px solid #EAE5DB; border-radius: 8px; padding: 16px; }
    .box-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #172B38; font-weight: bold; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 28px; font-size: 13px; }
    th { background: #172B38; color: #EAE5DB; text-align: left; padding: 12px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
    td { padding: 12px 14px; border-bottom: 1px solid #EAE5DB; }
    .totals { margin-top: 20px; width: 320px; margin-left: auto; font-size: 13px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; }
    .totals-row.grand { border-top: 2px solid #172B38; font-weight: bold; font-size: 16px; color: #172B38; padding-top: 10px; margin-top: 6px; }
    .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #EAE5DB; font-size: 11px; color: #666; display: flex; justify-content: space-between; }
    @media print { body { background: #fff; padding: 0; } .sheet { border: none; padding: 20px; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <div class="brand-title">HAZENOR</div>
        <div class="brand-sub">PROPERTIES</div>
        <div class="slogan">A Legacy Built on Trust.</div>
        <div style="margin-top: 10px; font-size: 12px; font-weight: 600; color: #172B38;">Diterbitkan oleh: ${organizationName}</div>
      </div>
      <div class="inv-badge">
        <h1>INVOICE TAGIHAN SEWA</h1>
        <div class="inv-no">#${invoice.invoice_number}</div>
        <div style="margin-top: 6px; font-size: 12px; color: #172B38; font-weight: 600;">Status: ${statusDisplay.label}</div>
      </div>
    </div>

    <div class="grid">
      <div class="box">
        <div class="box-title">Ditagihkan Kepada (Penyewa)</div>
        <div><strong>${tenantName}</strong></div>
        <div>Telepon / WA: ${tenantPhone}</div>
        <div>Email: ${tenantEmail}</div>
        <div>Unit Sewa: <strong>${unitNumber}</strong> (${leaseNumber})</div>
      </div>
      <div class="box">
        <div class="box-title">Informasi Periode & Jatuh Tempo</div>
        <div>Periode Sewa: <strong>${formatDateID(invoice.billing_period_start)} – ${formatDateID(invoice.billing_period_end)}</strong></div>
        <div>Tanggal Terbit: ${formatDateID(invoice.issue_date)}</div>
        <div>Jatuh Tempo: <strong>${formatDateID(invoice.due_date)}</strong></div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Deskripsi Komponen Tagihan</th>
          <th style="text-align: center;">Kuantitas</th>
          <th style="text-align: right;">Harga Satuan</th>
          <th style="text-align: right;">Jumlah</th>
        </tr>
      </thead>
      <tbody>
        ${(invoice.items || [
          {
            description: `Sewa Unit ${unitNumber} (${formatDateID(invoice.billing_period_start)} - ${formatDateID(invoice.billing_period_end)})`,
            quantity: 1,
            unit_price: invoice.subtotal || invoice.total,
            amount: invoice.subtotal || invoice.total,
          },
        ])
          .map(
            (item: any) => `
          <tr>
            <td>${item.description}</td>
            <td style="text-align: center;">${item.quantity || 1}</td>
            <td style="text-align: right;">${formatIDR(item.unit_price || item.amount)}</td>
            <td style="text-align: right; font-weight: 600;">${formatIDR(item.amount)}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row"><span>Subtotal</span><span>${formatIDR(invoice.subtotal || invoice.total)}</span></div>
      <div class="totals-row"><span>Potongan Diskon</span><span>- ${formatIDR(invoice.discount || 0)}</span></div>
      <div class="totals-row"><span>PPN (Pajak)</span><span>${formatIDR(invoice.tax || 0)}</span></div>
      <div class="totals-row grand"><span>Total Tagihan</span><span>${formatIDR(invoice.total)}</span></div>
      <div class="totals-row" style="color: #047857; font-weight: 600;"><span>Telah Dibayar</span><span>${formatIDR(invoice.paid_amount || 0)}</span></div>
      <div class="totals-row" style="font-weight: bold;"><span>Sisa Tagihan</span><span>${formatIDR(remainingAmount)}</span></div>
    </div>

    <div class="footer">
      <span>Dokumen ini diterbitkan secara resmi melalui ekosistem HAZENOR Properties.</span>
      <span>Dicetak pada: ${formatDateID(new Date().toISOString())}</span>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice-${invoice.invoice_number}-HAZENOR.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1E28]/75 backdrop-blur-xs p-4 overflow-y-auto print:bg-white print:p-0"
    >
      <div className="relative w-full max-w-3xl rounded-2xl bg-white border border-[#EAE5DB] shadow-2xl overflow-hidden my-8 print:shadow-none print:border-none print:my-0">
        {/* Top Action Bar (Hidden when printing) */}
        <div className="bg-[#172B38] text-[#EAE5DB] px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#C9B58E]/30 print:hidden">
          <div className="flex items-center gap-2.5">
            <HazenorSymbol theme="dark" className="h-6 w-6" />
            <span
              id="invoice-modal-title"
              className="font-serif text-lg font-semibold tracking-wide text-white"
            >
              Dokumen Tagihan Resmi #{invoice.invoice_number}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintInvoice}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#C9B58E] hover:bg-[#DFD1B4] text-[#172B38] text-xs font-bold transition"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadHtmlInvoice}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#EAE5DB]/25 hover:bg-[#213B4D] text-[#EAE5DB] text-xs font-semibold transition"
            >
              <Download className="h-3.5 w-3.5 text-[#C9B58E]" />
              <span>Unduh Dokumen</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup jendela tagihan"
              className="p-1.5 rounded-lg text-[#EAE5DB]/70 hover:text-white hover:bg-[#213B4D] transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-6 sm:p-8 space-y-6 text-[#303437]">
          {/* Corporate Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-[#172B38]">
            <div>
              <HazenorLogo variant="primary" theme="light" size="md" showSlogan />
              <div className="mt-3 text-xs text-[#303437]/80">
                Pengelola Resmi:{" "}
                <strong className="text-[#172B38]">{organizationName}</strong>
              </div>
            </div>
            <div className="sm:text-right space-y-1">
              <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#A89268]">
                Official Rental Invoice
              </div>
              <div className="font-serif text-2xl font-bold text-[#172B38]">
                #{invoice.invoice_number}
              </div>
              <div className="inline-flex sm:justify-end pt-1">
                <StatusBadge {...statusDisplay} />
              </div>
            </div>
          </div>

          {/* Billing & Period Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl bg-[#F6F4EF] border border-[#EAE5DB] p-4 space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#172B38]">
                Ditagihkan Kepada (Penyewa)
              </div>
              <div className="text-sm font-bold text-[#172B38]">{tenantName}</div>
              <div>Telepon / WhatsApp: {tenantPhone}</div>
              <div>Email: {tenantEmail}</div>
              <div className="pt-1 text-[#172B38] font-semibold">
                Unit Sewa: {unitNumber} &bull; Kontrak: {leaseNumber}
              </div>
            </div>

            <div className="rounded-xl bg-[#F6F4EF] border border-[#EAE5DB] p-4 space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#172B38]">
                Rincian Periode &amp; Jatuh Tempo
              </div>
              <div className="flex justify-between">
                <span className="text-[#303437]/75">Periode Sewa:</span>
                <strong className="text-[#172B38]">
                  {formatDateID(invoice.billing_period_start)} s/d{" "}
                  {formatDateID(invoice.billing_period_end)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#303437]/75">Tanggal Diterbitkan:</span>
                <span>{formatDateID(invoice.issue_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#303437]/75">Batas Jatuh Tempo:</span>
                <strong className="text-[#172B38]">
                  {formatDateID(invoice.due_date)}
                </strong>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="rounded-xl border border-[#EAE5DB] overflow-hidden">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#172B38] text-[#EAE5DB] text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Deskripsi Tagihan</th>
                  <th className="py-3 px-4 text-center">Jml</th>
                  <th className="py-3 px-4 text-right">Harga Satuan</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE5DB]">
                {(invoice.items && invoice.items.length > 0
                  ? invoice.items
                  : [
                      {
                        id: "default-1",
                        description: `Tagihan Sewa Unit ${unitNumber} (${formatDateID(
                          invoice.billing_period_start
                        )} – ${formatDateID(invoice.billing_period_end)})`,
                        quantity: 1,
                        unit_price: invoice.subtotal || invoice.total,
                        amount: invoice.subtotal || invoice.total,
                      },
                    ]
                ).map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="bg-white">
                    <td className="py-3 px-4 font-medium text-[#172B38]">
                      {item.description}
                    </td>
                    <td className="py-3 px-4 text-center">{item.quantity || 1}</td>
                    <td className="py-3 px-4 text-right">
                      {formatIDR(item.unit_price || item.amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-[#172B38]">
                      {formatIDR(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary & Payment Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-7 rounded-xl bg-[#F6F4EF] border border-[#EAE5DB] p-4 text-xs space-y-2">
              <div className="font-bold text-[#172B38] uppercase tracking-wider text-[11px]">
                Rekening Tujuan Pembayaran Resmi
              </div>
              {banks.length === 0 ? (
                <div className="text-[#303437]/80">
                  BCA 8720-1928-33 a.n. {organizationName}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {banks.map((b: any) => (
                    <div
                      key={b.id}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAE5DB] pb-1.5 last:border-none last:pb-0"
                    >
                      <span className="font-semibold text-[#172B38]">
                        {b.bank_name} — {b.account_number}
                      </span>
                      <span className="text-[#303437]/75">
                        a.n. {b.account_holder_name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-[#303437]/70 pt-1">
                Mohon cantumkan nomor tagihan{" "}
                <strong className="text-[#172B38]">#{invoice.invoice_number}</strong>{" "}
                pada berita transfer dan unggah bukti bayar melalui Portal Penyewa.
              </p>
            </div>

            <div className="md:col-span-5 space-y-2 text-xs sm:text-sm bg-white rounded-xl border border-[#EAE5DB] p-4">
              <div className="flex justify-between text-[#303437]/80">
                <span>Subtotal</span>
                <span>{formatIDR(invoice.subtotal || invoice.total)}</span>
              </div>
              {Number(invoice.discount || 0) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Potongan Diskon</span>
                  <span>- {formatIDR(invoice.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#303437]/80">
                <span>PPN (Pajak)</span>
                <span>{formatIDR(invoice.tax || 0)}</span>
              </div>
              <div className="pt-2 border-t border-[#172B38] flex justify-between font-serif text-base font-bold text-[#172B38]">
                <span>Total Tagihan</span>
                <span>{formatIDR(invoice.total)}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                <span>Pembayaran Terverifikasi</span>
                <span>{formatIDR(invoice.paid_amount || 0)}</span>
              </div>
              <div className="pt-1.5 border-t border-[#EAE5DB] flex justify-between text-xs font-bold text-[#172B38]">
                <span>Sisa Tagihan</span>
                <span>{formatIDR(remainingAmount)}</span>
              </div>
            </div>
          </div>

          {/* Corporate Footer Note */}
          <div className="pt-4 border-t border-[#EAE5DB] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#303437]/65">
            <span>
              HAZENOR Properties &mdash;{" "}
              <em className="font-serif text-[#A89268]">A Legacy Built on Trust.</em>
            </span>
            <span>Dokumen Tagihan Sah &bull; Dicetak otomatis oleh sistem</span>
          </div>
        </div>
      </div>
    </div>
  );
}
