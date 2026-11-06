"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatIDR } from "@/lib/api-client";
import {
  formatDateID,
  getAuditActionLabel,
  getOrgStatusDisplay,
  getPlanLabel,
} from "@/lib/terminology";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RukoFooter } from "@/components/layout/ruko-footer";
import { HazenorLogo } from "@/components/brand/hazenor-logo";

export default function SuperAdminPortalPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pendingPlanChange, setPendingPlanChange] = useState<{
    orgId: string;
    orgName: string;
    planCode: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const showToast = useCallback((type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/proxy/admin/dashboard");
      const res = await r.json();
      if (res.success) setData(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function confirmChangePlan() {
    if (!pendingPlanChange) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/proxy/admin/organizations/${pendingPlanChange.orgId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan_code: pendingPlanChange.planCode,
            reason: `Perubahan paket langganan ke ${getPlanLabel(
              pendingPlanChange.planCode
            )} oleh Administrator Platform.`,
          }),
        }
      );
      const payload = await res.json();
      if (res.ok && payload.success) {
        showToast(
          "success",
          `Paket berlangganan untuk ${pendingPlanChange.orgName} berhasil diperbarui ke ${getPlanLabel(
            pendingPlanChange.planCode
          )}.`
        );
        loadDashboard();
      } else {
        showToast("error", payload.message || "Gagal memperbarui paket berlangganan.");
      }
    } finally {
      setSubmitting(false);
      setPendingPlanChange(null);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-[#F6F4EF] text-[#303437] overflow-x-hidden w-full max-w-full">
      <header className="sticky top-0 z-20 bg-[#172B38] text-[#EAE5DB] border-b border-[#C9B58E]/20 w-full">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2 min-w-0">
              <HazenorLogo variant="primary" theme="dark" size="sm" />
            </Link>
            <span className="text-[#EAE5DB]/30 hidden xs:inline sm:inline">/</span>
            <span className="text-[10px] sm:text-xs font-semibold text-[#C9B58E] bg-[#C9B58E]/10 border border-[#C9B58E]/30 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
              Portal Administrator
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-xs font-medium shrink-0">
            <Link
              href="/owner"
              className="hidden md:inline-flex text-[#C9B58E] hover:text-[#DFD1B4] transition font-semibold"
            >
              Portal Pemilik dan Staf →
            </Link>
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-16 space-y-6 animate-fade-up">
        <div>
          <nav aria-label="Breadcrumb" className="text-xs text-[#303437]/70 mb-1">
            <Link href="/" className="hover:text-[#172B38]">
              Beranda
            </Link>{" "}
            <span className="mx-1">/</span>
            <span className="text-[#172B38] font-medium">Portal Administrator</span>
          </nav>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#172B38]">
            Pengelolaan Organisasi, Paket Berlangganan, dan Aktivitas Platform
          </h1>
          <p className="text-xs sm:text-sm text-[#303437]/80 mt-0.5">
            Pantau organisasi terdaftar, kelola batas penggunaan paket berlangganan, dan tinjau riwayat aktivitas seluruh platform di bawah ekosistem HAZENOR Properties.
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-medium text-slate-500">Total Organisasi Terdaftar</div>
            <div className="mt-1.5 text-2xl font-bold text-slate-900">
              {data?.metrics?.total_organizations ?? "—"} Organisasi
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Perusahaan atau pengelola properti aktif
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-medium text-slate-500">Total Pengguna Platform</div>
            <div className="mt-1.5 text-2xl font-bold text-slate-900">
              {data?.metrics?.total_users ?? "—"} Pengguna
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Akun pemilik, staf operasional, dan penyewa
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-medium text-slate-500">Langganan Aktif</div>
            <div className="mt-1.5 text-2xl font-bold text-emerald-600">
              {data?.metrics?.active_subscriptions ?? "—"} Langganan
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Organisasi dengan paket berlangganan berjalan
            </div>
          </div>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Daftar Organisasi dan Paket Berlangganan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola paket berlangganan aktif untuk setiap organisasi pengelola properti.
              </p>
            </div>
          </div>

          {loading && !data ? (
            <div className="mt-4 text-sm text-slate-500">Memuat data organisasi...</div>
          ) : (
            <div className="mt-4 space-y-3">
              {(data?.organizations || []).map((org: any) => {
                const currentPlan = org.subscriptions?.[0]?.plan?.code || "STARTER";
                const orgStatus = getOrgStatusDisplay(org.status);
                return (
                  <div
                    key={org.id}
                    className="rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4 text-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-slate-900">{org.name}</span>
                        <StatusBadge {...orgStatus} />
                      </div>
                      <div className="text-xs text-slate-500">
                        Pemilik: <strong className="text-[#172B38]">{org.owner?.name}</strong> (
                        {org.owner?.email}) • Paket Saat Ini:{" "}
                        <strong className="text-[#172B38]">{getPlanLabel(currentPlan)}</strong>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {(["STARTER", "PRO", "BUSINESS"] as const).map((code) => {
                        const isCurrent = currentPlan === code;
                        return (
                          <button
                            key={code}
                            type="button"
                            disabled={isCurrent}
                            onClick={() =>
                              setPendingPlanChange({
                                orgId: org.id,
                                orgName: org.name,
                                planCode: code,
                              })
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                              isCurrent
                                ? "bg-[#172B38] text-[#EAE5DB] border-[#C9B58E]/40 cursor-default"
                                : "bg-white text-[#303437] border-[#EAE5DB] hover:bg-[#F6F4EF]"
                            }`}
                          >
                            {isCurrent
                              ? `Aktif: ${getPlanLabel(code)}`
                              : `Ubah ke ${getPlanLabel(code)}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">Katalog Paket Berlangganan</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kapasitas unit, jumlah staf pengelola, dan kuota pengingat WhatsApp bulanan pada setiap paket.
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {(data?.plans || []).map((p: any) => (
              <div
                key={p.id}
                className="rounded-xl border border-slate-200 p-5 space-y-2 text-sm bg-slate-50/50"
              >
                <div className="font-serif font-bold text-lg text-[#172B38]">{p.name}</div>
                <div className="text-lg font-bold text-slate-900">
                  {formatIDR(p.price)}{" "}
                  <span className="text-xs font-normal text-slate-500">/ bulan</span>
                </div>
                <ul className="pt-2 space-y-1 text-xs text-slate-600 border-t border-slate-200">
                  <li>
                    Batas Unit Properti:{" "}
                    <strong className="text-slate-900">
                      {p.max_units ? `${p.max_units} Unit` : "Tanpa Batas"}
                    </strong>
                  </li>
                  <li>
                    Batas Akun Pengelola:{" "}
                    <strong className="text-slate-900">
                      {p.max_members ? `${p.max_members} Pengguna` : "Tanpa Batas"}
                    </strong>
                  </li>
                  <li>
                    Kuota Pengingat WhatsApp:{" "}
                    <strong className="text-slate-900">
                      {p.monthly_whatsapp_quota} pesan / bulan
                    </strong>
                  </li>
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">Riwayat Aktivitas Platform</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Catatan perubahan penting yang dilakukan oleh pengguna dan administrator di seluruh organisasi.
          </p>
          <div className="mt-4 divide-y divide-slate-100 text-xs">
            {(data?.audit_logs || []).length === 0 ? (
              <div className="py-6 text-center text-slate-500">
                Belum ada catatan aktivitas platform.
              </div>
            ) : (
              (data?.audit_logs || []).map((log: any) => (
                <div
                  key={log.id}
                  className="py-3 flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900">
                      {getAuditActionLabel(log.action)}
                    </div>
                    <div className="text-slate-500">
                      Alamat IP: {log.ip_address || "—"}
                    </div>
                  </div>
                  <div className="text-slate-500 font-medium">
                    {formatDateID(log.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <ConfirmDialog
        open={Boolean(pendingPlanChange)}
        title="Konfirmasi Perubahan Paket Berlangganan"
        description={
          pendingPlanChange
            ? `Apakah Anda yakin ingin mengubah paket berlangganan organisasi "${
                pendingPlanChange.orgName
              }" menjadi ${getPlanLabel(pendingPlanChange.planCode)}?`
            : ""
        }
        confirmLabel="Ya, Perbarui Paket"
        loading={submitting}
        onConfirm={confirmChangePlan}
        onCancel={() => setPendingPlanChange(null)}
      />

      <RukoFooter />
    </div>
  );
}
