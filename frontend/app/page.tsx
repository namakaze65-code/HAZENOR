"use client";

import Link from "next/link";
import React, { useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  KeyRound,
  MessageSquareWarning,
  Moon,
  Shield,
  Sun,
  Users,
  WalletCards,
} from "lucide-react";
import { HazenorLogo } from "@/components/brand/hazenor-logo";
import { InkOrbitHero } from "@/components/hero/ink-orbit-hero";
import { RukoFooter } from "@/components/layout/ruko-footer";
import { RevealOnScroll } from "@/components/ui/reveal-on-scroll";

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Daftarkan Akun Pemilik",
    description:
      "Buat akun pemilik properti menggunakan alamat email dan nomor telepon aktif.",
  },
  {
    step: "02",
    title: "Buat Organisasi Pengelola",
    description:
      "Siapkan ruang kerja organisasi Anda beserta pengaturan rekening bank tujuan pembayaran.",
  },
  {
    step: "03",
    title: "Tambahkan Properti dan Unit",
    description:
      "Catat daftar gedung atau kompleks properti beserta detail nomor unit, luas, dan harga sewa.",
  },
  {
    step: "04",
    title: "Daftarkan atau Undang Penyewa",
    description:
      "Simpan data penyewa dan kirimkan tautan undangan khusus agar penyewa dapat mengakses portalnya.",
  },
  {
    step: "05",
    title: "Buat Kontrak dan Tagihan Sewa",
    description:
      "Atur masa sewa bulanan, triwulanan, semesteran, atau tahunan serta terbitkan tagihan secara teratur.",
  },
  {
    step: "06",
    title: "Catat dan Verifikasi Pembayaran",
    description:
      "Periksa bukti pembayaran dari penyewa dan verifikasi penerimaan dana secara akurat.",
  },
  {
    step: "07",
    title: "Pantau Keluhan dan Permintaan Bantuan",
    description:
      "Terima laporan kendala unit dari penyewa dan perbarui status penanganannya hingga selesai.",
  },
];

const CORE_FEATURES = [
  {
    icon: Building2,
    title: "Manajemen Properti dan Unit",
    description:
      "Pantau daftar lokasi properti, ketersediaan unit, harga sewa dasar, dan status hunian di satu tampilan.",
  },
  {
    icon: Users,
    title: "Data Penyewa dan Kontrak Sewa",
    description:
      "Kelola profil penyewa dan masa berlaku kontrak sewa dengan perlindungan otomatis terhadap jadwal yang berbenturan.",
  },
  {
    icon: FileSpreadsheet,
    title: "Tagihan dan Pengingat Jatuh Tempo",
    description:
      "Terbitkan rincian tagihan secara berkala dan kirimkan pengingat pembayaran resmi melalui WhatsApp.",
  },
  {
    icon: WalletCards,
    title: "Verifikasi Pembayaran dan Riwayat",
    description:
      "Catat pembayaran ke rekening resmi pengelola dan pastikan saldo tagihan selalu sesuai dengan dana yang telah diverifikasi.",
  },
  {
    icon: MessageSquareWarning,
    title: "Keluhan dan Permintaan Bantuan",
    description:
      "Kelola laporan perbaikan atau keluhan dari penyewa lengkap dengan tingkat prioritas dan riwayat penanganannya.",
  },
  {
    icon: Shield,
    title: "Pemisahan Data Antar-Organisasi",
    description:
      "Setiap pemilik properti dan staf bekerja di dalam ruang organisasi masing-masing sesuai pembagian hak akses.",
  },
];

const PRICING_PLANS = [
  {
    name: "Paket Starter (Uji Coba)",
    price: "Rp 0",
    period: "14 hari masa uji coba",
    limits: [
      "Hingga 5 unit properti",
      "Hingga 2 anggota staf pengelola",
      "Pencatatan dan verifikasi pembayaran manual",
      "Kuota 100 pesan pengingat WhatsApp / bulan",
    ],
  },
  {
    name: "Paket Pro Pengelola",
    price: "Rp 299.000",
    period: "per bulan",
    featured: true,
    limits: [
      "Hingga 30 unit properti",
      "Hingga 10 anggota staf pengelola",
      "Verifikasi pembayaran manual & integrasi pembayaran",
      "Kuota 1.000 pesan pengingat WhatsApp / bulan",
    ],
  },
  {
    name: "Paket Business",
    price: "Rp 799.000",
    period: "per bulan",
    limits: [
      "Jumlah unit properti tidak terbatas",
      "Jumlah anggota staf tidak terbatas",
      "Unduh laporan keuangan dan operasional lengkap",
      "Kuota 5.000 pesan pengingat WhatsApp / bulan",
    ],
  },
];

export default function LandingPage() {
  const [isDark, setIsDark] = useState(false);

  return (
    <div
      className={
        isDark
          ? "dark min-h-screen bg-[#0F1E28] text-[#EAE5DB] flex flex-col transition-colors duration-300"
          : "min-h-screen bg-[#F6F4EF] text-[#303437] flex flex-col transition-colors duration-300"
      }
    >
      {/* Top Corporate Bar — HAZENOR Properties */}
      <div className="bg-[#172B38] text-[#EAE5DB] border-b border-[#C9B58E]/20 text-[11px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 sm:h-9 flex items-center justify-between gap-2 overflow-hidden">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold tracking-[0.16em] sm:tracking-[0.18em] uppercase text-[#C9B58E] text-[10px] sm:text-[11px] truncate">
              HAZENOR Properties
            </span>
            <span className="hidden sm:inline text-[#EAE5DB]/40">|</span>
            <span className="hidden md:inline font-serif italic text-xs text-[#EAE5DB]/85">
              A Legacy Built on Trust.
            </span>
          </div>
          <div className="text-[#EAE5DB]/75 text-[10px] sm:text-[11px] shrink-0">
            <span className="hidden sm:inline">Platform Digital: </span>
            <strong className="text-white">Portal Properti</strong>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-md transition-colors duration-300 ${
          isDark
            ? "bg-[#172B38]/95 border-[#C9B58E]/20"
            : "bg-white/95 border-[#EAE5DB]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-4 lg:gap-8 min-w-0">
            <Link href="/" className="group min-w-0">
              <HazenorLogo
                variant="product"
                theme={isDark ? "dark" : "light"}
                size="sm"
              />
            </Link>

            <nav
              aria-label="Navigasi Utama"
              className="hidden md:flex items-center gap-6 text-sm font-medium"
            >
              {[
                { href: "#beranda", label: "Beranda" },
                { href: "#fitur", label: "Fitur" },
                { href: "#cara-kerja", label: "Cara Kerja" },
                { href: "#harga", label: "Paket Layanan" },
              ].map((nav) => (
                <a
                  key={nav.href}
                  href={nav.href}
                  className={`relative py-1 transition after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#C9B58E] hover:after:w-full after:transition-all after:duration-300 ${
                    isDark
                      ? "text-[#EAE5DB]/80 hover:text-white"
                      : "text-[#303437] hover:text-[#172B38]"
                  }`}
                >
                  {nav.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              aria-label={isDark ? "Aktifkan tampilan terang" : "Aktifkan tampilan gelap"}
              className={`p-1.5 sm:p-2 rounded-lg border text-xs font-medium transition-all duration-200 shrink-0 ${
                isDark
                  ? "border-[#C9B58E]/30 bg-[#0F1E28] text-[#C9B58E] hover:text-white"
                  : "border-[#EAE5DB] bg-[#F6F4EF] text-[#172B38] hover:bg-[#EAE5DB]"
              }`}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link
              href="/login"
              className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition shrink-0 ${
                isDark
                  ? "text-[#EAE5DB] hover:bg-[#0F1E28]"
                  : "text-[#172B38] hover:bg-[#EAE5DB]/60"
              }`}
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg bg-[#172B38] hover:bg-[#213B4D] text-[#EAE5DB] border border-[#C9B58E]/40 shadow-xs transition-all duration-200 shrink-0"
            >
              <span className="sm:hidden">Daftar</span>
              <span className="hidden sm:inline">Daftar sebagai Pemilik</span>
            </Link>
          </div>
        </div>
      </header>

      <main id="beranda" className="flex-1">
        {/* HAZENOR Properties InkOrbitHero */}
        <InkOrbitHero isDark={isDark} />

        {/* Access Portals Section */}
        <section
          aria-labelledby="portal-heading"
          className={`py-16 border-y ${
            isDark
              ? "bg-[#172B38]/60 border-[#C9B58E]/20"
              : "bg-[#EAE5DB]/55 border-[#EAE5DB]"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealOnScroll>
              <div className="max-w-2xl">
                <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-[#172B38] dark:text-[#C9B58E]">
                  Ekosistem HAZENOR Properties
                </span>
                <h2
                  id="portal-heading"
                  className={`mt-1 font-serif text-2xl sm:text-3xl font-semibold tracking-tight ${
                    isDark ? "text-[#EAE5DB]" : "text-[#172B38]"
                  }`}
                >
                  Akses Portal Sesuai Peran Pengguna
                </h2>
                <p
                  className={`mt-2 text-sm leading-relaxed ${
                    isDark ? "text-[#EAE5DB]/75" : "text-[#303437]"
                  }`}
                >
                  Pilih ruang kerja yang sesuai dengan tanggung jawab Anda di dalam pengelolaan
                  properti.
                </p>
              </div>
            </RevealOnScroll>

            <div className="mt-9 grid grid-cols-1 md:grid-cols-3 gap-6">
              <RevealOnScroll delayMs={80}>
                <Link
                  href="/owner"
                  className={`group h-full rounded-xl border p-6 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between ${
                    isDark
                      ? "border-[#C9B58E]/25 bg-[#172B38] hover:border-[#C9B58E]"
                      : "border-[#EAE5DB] bg-white hover:border-[#172B38] hover:shadow-md"
                  }`}
                >
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#172B38] dark:text-[#C9B58E] bg-[#EAE5DB] dark:bg-[#0F1E28] px-2.5 py-1 rounded">
                      <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                      Pengelola Properti
                    </span>
                    <h3
                      className={`mt-3 font-serif text-xl font-semibold ${
                        isDark ? "text-white" : "text-[#172B38]"
                      }`}
                    >
                      Portal Pemilik dan Staf
                    </h3>
                    <p
                      className={`mt-2 text-sm leading-relaxed ${
                        isDark ? "text-[#EAE5DB]/75" : "text-[#303437]"
                      }`}
                    >
                      Kelola properti, unit, penyewa, kontrak sewa, tagihan, pembayaran, dan
                      laporan operasional sesuai hak akses.
                    </p>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#172B38] dark:text-[#C9B58E] group-hover:translate-x-1 transition-transform">
                    Buka Portal Pemilik
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </RevealOnScroll>

              <RevealOnScroll delayMs={160}>
                <Link
                  href="/tenant"
                  className={`group h-full rounded-xl border p-6 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between ${
                    isDark
                      ? "border-[#C9B58E]/25 bg-[#172B38] hover:border-[#C9B58E]"
                      : "border-[#EAE5DB] bg-white hover:border-[#172B38] hover:shadow-md"
                  }`}
                >
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#172B38] dark:text-[#C9B58E] bg-[#EAE5DB] dark:bg-[#0F1E28] px-2.5 py-1 rounded">
                      <Users className="h-3.5 w-3.5" aria-hidden="true" />
                      Khusus Penyewa
                    </span>
                    <h3
                      className={`mt-3 font-serif text-xl font-semibold ${
                        isDark ? "text-white" : "text-[#172B38]"
                      }`}
                    >
                      Portal Penyewa
                    </h3>
                    <p
                      className={`mt-2 text-sm leading-relaxed ${
                        isDark ? "text-[#EAE5DB]/75" : "text-[#303437]"
                      }`}
                    >
                      Lihat informasi kontrak sewa, periksa rincian tagihan, kirim konfirmasi
                      pembayaran, dan sampaikan permintaan bantuan.
                    </p>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#172B38] dark:text-[#C9B58E] group-hover:translate-x-1 transition-transform">
                    Buka Portal Penyewa
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </RevealOnScroll>

              <RevealOnScroll delayMs={240}>
                <Link
                  href="/super-admin"
                  className={`group h-full rounded-xl border p-6 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between ${
                    isDark
                      ? "border-[#C9B58E]/25 bg-[#172B38] hover:border-[#C9B58E]"
                      : "border-[#EAE5DB] bg-white hover:border-[#172B38] hover:shadow-md"
                  }`}
                >
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#172B38] dark:text-[#C9B58E] bg-[#EAE5DB] dark:bg-[#0F1E28] px-2.5 py-1 rounded">
                      <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                      Tata Kelola Platform
                    </span>
                    <h3
                      className={`mt-3 font-serif text-xl font-semibold ${
                        isDark ? "text-white" : "text-[#172B38]"
                      }`}
                    >
                      Portal Administrator
                    </h3>
                    <p
                      className={`mt-2 text-sm leading-relaxed ${
                        isDark ? "text-[#EAE5DB]/75" : "text-[#303437]"
                      }`}
                    >
                      Pantau seluruh organisasi terdaftar, kelola paket berlangganan, dan tinjau
                      catatan aktivitas sistem.
                    </p>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#172B38] dark:text-[#C9B58E] group-hover:translate-x-1 transition-transform">
                    Buka Portal Administrator
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </RevealOnScroll>
            </div>
          </div>
        </section>

        {/* Core Features Section */}
        <section id="fitur" aria-labelledby="fitur-heading" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealOnScroll>
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#172B38] dark:text-[#C9B58E]">
                  Kapabilitas Utama HAZENOR
                </p>
                <h2
                  id="fitur-heading"
                  className={`mt-1 font-serif text-2xl sm:text-3xl font-semibold tracking-tight ${
                    isDark ? "text-[#EAE5DB]" : "text-[#172B38]"
                  }`}
                >
                  Dirancang untuk Pengelolaan Aset Properti yang Rapi dan Transparan
                </h2>
                <p
                  className={`mt-2 text-sm leading-relaxed ${
                    isDark ? "text-[#EAE5DB]/75" : "text-[#303437]"
                  }`}
                >
                  Seluruh fitur difokuskan untuk menyederhanakan administrasi sewa dan memastikan
                  setiap transaksi tercatat secara akurat.
                </p>
              </div>
            </RevealOnScroll>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {CORE_FEATURES.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <RevealOnScroll key={feat.title} delayMs={idx * 75}>
                    <div
                      className={`group h-full rounded-xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
                        isDark
                          ? "border-[#C9B58E]/20 bg-[#172B38]/80 hover:border-[#C9B58E]/60"
                          : "border-[#EAE5DB] bg-white hover:border-[#172B38]/40 hover:shadow-md"
                      }`}
                    >
                      <div className="h-11 w-11 rounded-lg bg-[#172B38] text-[#C9B58E] flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <h3
                        className={`mt-4 font-serif text-lg font-semibold ${
                          isDark ? "text-white" : "text-[#172B38]"
                        }`}
                      >
                        {feat.title}
                      </h3>
                      <p
                        className={`mt-2 text-sm leading-relaxed ${
                          isDark ? "text-[#EAE5DB]/75" : "text-[#303437]"
                        }`}
                      >
                        {feat.description}
                      </p>
                    </div>
                  </RevealOnScroll>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works (Walkthrough) Section */}
        <section
          id="cara-kerja"
          aria-labelledby="cara-kerja-heading"
          className={`py-20 border-t ${
            isDark
              ? "bg-[#172B38]/50 border-[#C9B58E]/20"
              : "bg-[#EAE5DB]/45 border-[#EAE5DB]"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealOnScroll>
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#172B38] dark:text-[#C9B58E]">
                  Standar Operasional
                </p>
                <h2
                  id="cara-kerja-heading"
                  className={`mt-1 font-serif text-2xl sm:text-3xl font-semibold tracking-tight ${
                    isDark ? "text-[#EAE5DB]" : "text-[#172B38]"
                  }`}
                >
                  Cara Kerja HAZENOR dalam 7 Langkah
                </h2>
                <p
                  className={`mt-2 text-sm leading-relaxed ${
                    isDark ? "text-[#EAE5DB]/75" : "text-[#303437]"
                  }`}
                >
                  Alur kerja yang terstruktur sejak pendaftaran pemilik properti hingga pemantauan
                  pembayaran dan keluhan penyewa.
                </p>
              </div>
            </RevealOnScroll>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {WORKFLOW_STEPS.map((item, idx) => (
                <RevealOnScroll key={item.step} delayMs={idx * 65}>
                  <div
                    className={`group h-full rounded-xl border p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                      isDark
                        ? "border-[#C9B58E]/25 bg-[#172B38] hover:border-[#C9B58E]"
                        : "border-[#EAE5DB] bg-white hover:border-[#172B38]/50 hover:shadow-sm"
                    }`}
                  >
                    <div>
                      <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded bg-[#172B38] text-[#C9B58E] border border-[#C9B58E]/30">
                        Langkah {item.step}
                      </span>
                      <h3
                        className={`mt-3 font-serif text-lg font-semibold ${
                          isDark ? "text-white" : "text-[#172B38]"
                        }`}
                      >
                        {item.title}
                      </h3>
                      <p
                        className={`mt-1.5 text-xs leading-relaxed ${
                          isDark ? "text-[#EAE5DB]/75" : "text-[#303437]"
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Plans Section */}
        <section
          id="harga"
          aria-labelledby="harga-heading"
          className={`py-20 border-t ${
            isDark ? "border-[#C9B58E]/20" : "border-[#EAE5DB]"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RevealOnScroll>
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#172B38] dark:text-[#C9B58E]">
                  Paket Layanan Berlangganan
                </p>
                <h2
                  id="harga-heading"
                  className={`mt-1 font-serif text-2xl sm:text-3xl font-semibold tracking-tight ${
                    isDark ? "text-[#EAE5DB]" : "text-[#172B38]"
                  }`}
                >
                  Sesuaikan dengan Skala Portofolio Properti Anda
                </h2>
                <p
                  className={`mt-2 text-sm leading-relaxed ${
                    isDark ? "text-[#EAE5DB]/75" : "text-[#303437]"
                  }`}
                >
                  Mulai dengan masa uji coba tanpa biaya dan tingkatkan kapasitas unit seiring
                  perkembangan bisnis properti Anda.
                </p>
              </div>
            </RevealOnScroll>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              {PRICING_PLANS.map((plan, idx) => (
                <RevealOnScroll key={plan.name} delayMs={idx * 90}>
                  <div
                    className={`h-full rounded-xl border p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 ${
                      plan.featured
                        ? isDark
                          ? "border-[#C9B58E] bg-[#172B38] shadow-lg"
                          : "border-[#172B38] bg-white shadow-md"
                        : isDark
                        ? "border-[#C9B58E]/20 bg-[#172B38]/60"
                        : "border-[#EAE5DB] bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3
                          className={`font-serif text-xl font-semibold ${
                            isDark ? "text-white" : "text-[#172B38]"
                          }`}
                        >
                          {plan.name}
                        </h3>
                        {plan.featured && (
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-[#172B38] text-[#C9B58E] border border-[#C9B58E]/40">
                            Pilihan Utama
                          </span>
                        )}
                      </div>
                      <div className="mt-3">
                        <span
                          className={`font-serif text-3xl font-bold ${
                            isDark ? "text-[#C9B58E]" : "text-[#172B38]"
                          }`}
                        >
                          {plan.price}
                        </span>
                        <span
                          className={`ml-1.5 text-xs ${
                            isDark ? "text-[#EAE5DB]/70" : "text-[#303437]/80"
                          }`}
                        >
                          / {plan.period}
                        </span>
                      </div>
                      <ul className="mt-5 space-y-2.5 text-xs">
                        {plan.limits.map((lim) => (
                          <li key={lim} className="flex items-start gap-2">
                            <CheckCircle2
                              className="h-4 w-4 text-[#172B38] dark:text-[#C9B58E] shrink-0 mt-0.5"
                              aria-hidden="true"
                            />
                            <span className={isDark ? "text-[#EAE5DB]/85" : "text-[#303437]"}>
                              {lim}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#EAE5DB] dark:border-[#C9B58E]/20">
                      <Link
                        href="/register"
                        className={`w-full inline-flex justify-center py-2.5 px-4 rounded-lg text-xs font-semibold transition ${
                          plan.featured
                            ? "bg-[#172B38] hover:bg-[#213B4D] text-[#EAE5DB] border border-[#C9B58E]/40"
                            : isDark
                            ? "bg-[#0F1E28] hover:bg-[#172B38] text-[#EAE5DB] border border-[#C9B58E]/30"
                            : "bg-[#EAE5DB]/70 hover:bg-[#EAE5DB] text-[#172B38]"
                        }`}
                      >
                        Mulai Kelola Properti
                      </Link>
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* HAZENOR Properties Corporate & Product Footer */}
      <RukoFooter />
    </div>
  );
}
