"use client";

import React, { useState } from "react";
import { formatIDR } from "@/lib/terminology";

interface HazenorAnalyticsChartsProps {
  metrics: {
    total_properties: number;
    total_units: number;
    occupied_units: number;
    available_units: number;
    occupancy_rate: number;
    verified_revenue: string | number;
    pending_payments_count: number;
    unpaid_invoices_count: number;
    overdue_invoices_count: number;
    open_complaints_count: number;
  } | null;
  invoices: any[];
  units: any[];
}

export function HazenorAnalyticsCharts({
  metrics,
  invoices,
  units,
}: HazenorAnalyticsChartsProps) {
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(5);

  const totalUnits = metrics?.total_units ?? units.length ?? 0;
  const occupiedUnits =
    metrics?.occupied_units ??
    units.filter((u) => u.status === "OCCUPIED").length;
  const availableUnits =
    metrics?.available_units ??
    units.filter((u) => u.status === "AVAILABLE").length;
  const maintenanceUnits = Math.max(0, totalUnits - occupiedUnits - availableUnits);
  const occupancyRate =
    metrics?.occupancy_rate ??
    (totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0);

  const totalBilled = invoices.reduce(
    (acc, inv) => acc + Number(inv.total || 0),
    0
  );
  const verifiedRev = Number(metrics?.verified_revenue || 0);
  const effectiveBilled = Math.max(totalBilled, verifiedRev);
  const collectionRate =
    effectiveBilled > 0
      ? Math.min(100, Math.round((verifiedRev / effectiveBilled) * 100))
      : 0;

  // 6-Month Executive Financial Trend calculated from real invoices
  const monthDefs = [
    { month: "Jun", fullLabel: "Juni 2026", monthNum: 6 },
    { month: "Jul", fullLabel: "Juli 2026", monthNum: 7 },
    { month: "Agu", fullLabel: "Agustus 2026", monthNum: 8 },
    { month: "Sep", fullLabel: "September 2026", monthNum: 9 },
    { month: "Okt", fullLabel: "Oktober 2026", monthNum: 10 },
    { month: "Nov", fullLabel: "Periode Berjalan", monthNum: 11 },
  ];

  const monthlySeries = monthDefs.map((m, idx) => {
    if (idx === 5) {
      return {
        month: m.month,
        fullLabel: m.fullLabel,
        billed: totalBilled,
        collected: verifiedRev,
        occupancy: occupancyRate,
      };
    }
    const monthInvoices = invoices.filter((inv) => {
      if (!inv.issue_date) return false;
      const d = new Date(inv.issue_date);
      return d.getMonth() + 1 === m.monthNum;
    });
    const mBilled = monthInvoices.reduce((s, i) => s + Number(i.total || 0), 0);
    const mCollected = monthInvoices.reduce(
      (s, i) => s + Number(i.paid_amount || 0),
      0
    );
    return {
      month: m.month,
      fullLabel: m.fullLabel,
      billed: mBilled,
      collected: mCollected,
      occupancy: mBilled > 0 ? occupancyRate : 0,
    };
  });

  const maxChartVal = Math.max(
    ...monthlySeries.map((m) => Math.max(m.billed, m.collected)),
    1
  );

  const activePoint = monthlySeries[selectedMonthIdx] || monthlySeries[5];

  // SVG Donut calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const occupiedStroke = (occupancyRate / 100) * circumference;

  return (
    <section
      aria-label="Analitik Keuangan dan Tren Okupansi HAZENOR"
      className="grid grid-cols-1 lg:grid-cols-12 gap-6"
    >
      {/* Left 7 Columns: 6-Month Financial Performance & Billing Realization */}
      <div className="lg:col-span-7 bg-white rounded-xl border border-[#EAE5DB] p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#EAE5DB]">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A89268]">
                Analitik Keuangan Eksekutif
              </span>
              <h2 className="font-serif text-xl font-bold text-[#172B38] mt-0.5">
                Tren Tagihan &amp; Realisasi Pendapatan Sewa
              </h2>
              <p className="text-xs text-[#303437]/75 mt-0.5">
                Perbandingan nilai tagihan diterbitkan terhadap pembayaran terverifikasi secara real-time.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-xs bg-[#C9B58E]" />
                <span className="text-[#303437]/80 font-medium">Tagihan Diterbitkan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-xs bg-[#172B38]" />
                <span className="text-[#172B37] font-semibold">Pendapatan Terverifikasi</span>
              </div>
            </div>
          </div>

          {/* Selected Month Highlight Strip */}
          <div className="mt-4 rounded-xl bg-[#F6F4EF] border border-[#EAE5DB] px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[#303437]/70">Periode Dipilih: </span>
              <strong className="text-[#172B38]">{activePoint.fullLabel}</strong>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span>
                Tagihan:{" "}
                <strong className="text-[#A89268]">
                  {formatIDR(activePoint.billed)}
                </strong>
              </span>
              <span>
                Terverifikasi:{" "}
                <strong className="text-[#172B38]">
                  {formatIDR(activePoint.collected)}
                </strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-[#172B38] text-[#C9B58E] font-semibold">
                Hunian {activePoint.occupancy}%
              </span>
            </div>
          </div>

          {/* Interactive Bar Chart */}
          <div className="mt-6 pt-2">
            <div className="grid grid-cols-6 gap-3 sm:gap-5 items-end h-48 pt-4 px-2 border-b border-[#EAE5DB]">
              {monthlySeries.map((item, idx) => {
                const billedHeightPercent =
                  item.billed > 0
                    ? Math.max(12, Math.round((item.billed / maxChartVal) * 100))
                    : 6;
                const collectedHeightPercent =
                  item.collected > 0
                    ? Math.max(12, Math.round((item.collected / maxChartVal) * 100))
                    : 6;
                const isSelected = idx === selectedMonthIdx;

                return (
                  <button
                    key={item.month}
                    type="button"
                    onClick={() => setSelectedMonthIdx(idx)}
                    aria-label={`Lihat rincian ${item.fullLabel}`}
                    className={`group flex flex-col items-center h-full justify-end rounded-t-lg px-1 pt-2 transition ${
                      isSelected ? "bg-[#F6F4EF]" : "hover:bg-[#F6F4EF]/60"
                    }`}
                  >
                    <div className="w-full flex items-end justify-center gap-1.5 h-36">
                      {/* Billed Bar */}
                      <div
                        style={{ height: `${billedHeightPercent}%` }}
                        className="w-3 sm:w-4 rounded-t bg-[#C9B58E] transition-all duration-500 group-hover:opacity-90"
                        title={`Tagihan: ${formatIDR(item.billed)}`}
                      />
                      {/* Collected Bar */}
                      <div
                        style={{ height: `${collectedHeightPercent}%` }}
                        className="w-3 sm:w-4 rounded-t bg-[#172B38] transition-all duration-500 group-hover:bg-[#213B4D]"
                        title={`Terverifikasi: ${formatIDR(item.collected)}`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* X-Axis Labels */}
            <div className="grid grid-cols-6 gap-3 sm:gap-5 pt-2.5 px-2 text-center">
              {monthlySeries.map((item, idx) => (
                <button
                  key={item.month}
                  type="button"
                  onClick={() => setSelectedMonthIdx(idx)}
                  className={`text-xs font-semibold transition ${
                    idx === selectedMonthIdx
                      ? "text-[#172B38] underline decoration-[#C9B58E] decoration-2 underline-offset-4"
                      : "text-[#303437]/70 hover:text-[#172B38]"
                  }`}
                >
                  {item.month}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-[#EAE5DB] flex flex-wrap items-center justify-between gap-2 text-xs text-[#303437]/75">
          <span>Data dihitung otomatis dari tagihan &amp; pembayaran organisasi Anda.</span>
          <span className="font-semibold text-[#172B38]">
            Total Tagihan Aktif: {formatIDR(totalBilled)}
          </span>
        </div>
      </div>

      {/* Right 5 Columns: Unit Occupancy Donut & Collection Efficiency */}
      <div className="lg:col-span-5 bg-white rounded-xl border border-[#EAE5DB] p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="pb-4 border-b border-[#EAE5DB]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A89268]">
              Kinerja Portofolio Aset
            </span>
            <h2 className="font-serif text-xl font-bold text-[#172B38] mt-0.5">
              Komposisi Okupansi &amp; Rasio Kolektibilitas
            </h2>
            <p className="text-xs text-[#303437]/75 mt-0.5">
              Distribusi ketersediaan unit sewa dan efektivitas penagihan berjalan.
            </p>
          </div>

          {/* Donut + Legend Row */}
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative h-36 w-36 shrink-0 flex items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140">
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="#EAE5DB"
                  strokeWidth="14"
                />
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="#172B38"
                  strokeWidth="14"
                  strokeDasharray={`${occupiedStroke} ${circumference}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-serif text-2xl font-bold text-[#172B38]">
                  {occupancyRate}%
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A89268]">
                  Terisi
                </span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F6F4EF] border border-[#EAE5DB]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#172B38]" />
                  <span className="font-medium text-[#303437]">Unit Disewa (Aktif)</span>
                </div>
                <strong className="text-[#172B38]">{occupiedUnits} Unit</strong>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F6F4EF] border border-[#EAE5DB]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#C9B58E]" />
                  <span className="font-medium text-[#303437]">Unit Tersedia</span>
                </div>
                <strong className="text-[#172B38]">{availableUnits} Unit</strong>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F6F4EF] border border-[#EAE5DB]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#303437]/40" />
                  <span className="font-medium text-[#303437]">Pemeliharaan</span>
                </div>
                <strong className="text-[#172B38]">{maintenanceUnits} Unit</strong>
              </div>
            </div>
          </div>

          {/* Collection Rate Progress */}
          <div className="mt-6 pt-5 border-t border-[#EAE5DB] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#172B38]">
                Rasio Pelunasan Tagihan Terverifikasi
              </span>
              <span className="font-bold text-[#172B38]">{collectionRate}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-[#EAE5DB] overflow-hidden">
              <div
                style={{ width: `${collectionRate}%` }}
                className="h-full rounded-full bg-gradient-to-r from-[#172B38] to-[#C9B58E] transition-all duration-500"
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#303437]/70">
              <span>Terverifikasi: {formatIDR(verifiedRev)}</span>
              <span>Target: {formatIDR(effectiveBilled)}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-[#EAE5DB] flex items-center justify-between text-xs text-[#303437]/75">
          <span>Total Portofolio: {metrics?.total_properties ?? 0} Properti</span>
          <span className="font-serif italic text-[#A89268]">
            HAZENOR Asset Intelligence
          </span>
        </div>
      </div>
    </section>
  );
}
