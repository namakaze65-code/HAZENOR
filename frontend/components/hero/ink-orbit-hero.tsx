"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Home,
  Wallet,
} from "lucide-react";
import { HazenorSymbol } from "@/components/brand/hazenor-logo";

const ROTATING_PHRASES = [
  "Bisnis Sewa Lebih Teratur.",
  "Tagihan Lebih Terkontrol.",
  "Semua Unit dalam Satu Platform.",
];

interface InkOrbitHeroProps {
  isDark: boolean;
}

export function InkOrbitHero({ isDark }: InkOrbitHeroProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  // Rotate headline phrases smoothly
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const timer = window.setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % ROTATING_PHRASES.length);
    }, 3600);

    return () => window.clearInterval(timer);
  }, []);

  // Optimized Architectural Orbit subtle background canvas in Champagne Gold & Midnight Navy
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;
    let isVisible = true;
    let angle = 0;

    const resizeCanvas = () => {
      const isMobile = window.innerWidth < 768;
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.5);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const render = () => {
      if (isVisible) {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        ctx.clearRect(0, 0, width, height);

        const cx = width * 0.5;
        const cy = height * 0.5;
        const isMobile = width < 480;
        const ringCount = isMobile ? 2 : 3;
        const baseRadius = Math.min(width, height) * 0.28;

        for (let i = 0; i < ringCount; i++) {
          const r = baseRadius + i * 34;
          ctx.beginPath();
          ctx.ellipse(
            cx,
            cy,
            r,
            r * 0.62,
            angle * (i % 2 === 0 ? 1 : -0.8) + i * 0.5,
            0,
            Math.PI * 2
          );
          ctx.strokeStyle = isDark
            ? `rgba(201, 181, 142, ${0.22 - i * 0.05})`
            : `rgba(23, 43, 56, ${0.15 - i * 0.03})`;
          ctx.lineWidth = 1.25;
          ctx.stroke();

          // Orbiting Champagne Gold node
          const nodeAngle = angle * 1.3 + i * 2.1;
          const nx = cx + Math.cos(nodeAngle) * r;
          const ny = cy + Math.sin(nodeAngle) * (r * 0.62);
          ctx.beginPath();
          ctx.arc(nx, ny, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(201, 181, 142, 0.85)";
          ctx.fill();
        }

        angle += 0.004;
      }
      animationFrameId = window.requestAnimationFrame(render);
    };

    animationFrameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
      observer.disconnect();
    };
  }, [isDark]);

  return (
    <section
      ref={containerRef}
      aria-labelledby="hero-heading"
      className="relative overflow-hidden py-14 sm:py-20 lg:py-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: HAZENOR Properties Headline, Description & CTAs */}
          <div className="lg:col-span-6 space-y-6">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border max-w-full overflow-hidden ${
                isDark
                  ? "bg-[#172B38] text-[#EAE5DB] border-[#C9B58E]/40"
                  : "bg-[#EAE5DB]/80 text-[#172B38] border-[#C9B58E]/60"
              }`}
            >
              <HazenorSymbol theme={isDark ? "dark" : "light"} className="h-4 w-4 shrink-0" />
              <span className="font-semibold tracking-wider uppercase text-[10px] sm:text-[11px] truncate">
                HAZENOR Properties
              </span>
              <span className="text-[#C9B58E] shrink-0">&bull;</span>
              <span className="font-serif italic text-[11px] sm:text-xs text-[#A89268] dark:text-[#C9B58E] truncate">
                A Legacy Built on Trust.
              </span>
            </div>

            <div className="space-y-2.5">
              <p
                className={`text-xs font-semibold tracking-[0.16em] uppercase ${
                  isDark ? "text-[#C9B58E]" : "text-[#172B38]/80"
                }`}
              >
                HAZENOR — Platform Manajemen Properti Terpadu
              </p>
              <h1
                id="hero-heading"
                className={`font-serif text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.18] sm:leading-[1.15] ${
                  isDark ? "text-[#EAE5DB]" : "text-[#172B38]"
                }`}
              >
                <span className="block">Kelola Properti Lebih Mudah,</span>
                <span
                  aria-live="polite"
                  className={`block mt-1.5 transition-opacity duration-300 ${
                    isDark ? "text-[#C9B58E]" : "text-[#303437]"
                  }`}
                >
                  {ROTATING_PHRASES[phraseIndex]}
                </span>
              </h1>
            </div>

            <p
              className={`text-sm sm:text-base leading-relaxed max-w-xl ${
                isDark ? "text-[#EAE5DB]/80" : "text-[#303437]"
              }`}
            >
              Di bawah standar keunggulan operasional <strong>HAZENOR Properties</strong>, platform
              ini membantu Anda mengelola properti, unit sewa, penyewa, kontrak, tagihan,
              pembayaran, dan keluhan dalam satu sistem yang transparan dan terpercaya.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#172B38] hover:bg-[#213B4D] text-[#EAE5DB] border border-[#C9B58E]/40 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#C9B58E]"
              >
                <span>Mulai Kelola Properti</span>
                <ChevronRight className="h-4 w-4 text-[#C9B58E]" aria-hidden="true" />
              </Link>

              <a
                href="#cara-kerja"
                className={`inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-semibold border transition ${
                  isDark
                    ? "border-[#EAE5DB]/25 bg-[#0F1E28] hover:bg-[#172B38] text-[#EAE5DB]"
                    : "border-[#172B38]/25 bg-white hover:bg-[#EAE5DB]/50 text-[#172B38]"
                }`}
              >
                Lihat Cara Kerja
              </a>
            </div>

            <div
              className={`pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs ${
                isDark ? "text-[#EAE5DB]/75" : "text-[#303437]"
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#172B38] dark:text-[#C9B58E] shrink-0" aria-hidden="true" />
                <span>Pencatatan Kontrak &amp; Tagihan Terstruktur</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#172B38] dark:text-[#C9B58E] shrink-0" aria-hidden="true" />
                <span>Verifikasi Pembayaran Transparan</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#172B38] dark:text-[#C9B58E] shrink-0" aria-hidden="true" />
                <span>Portal Khusus Pemilik &amp; Penyewa</span>
              </div>
            </div>
          </div>

          {/* Right Column: Realistic HAZENOR Dashboard Preview */}
          <div className="lg:col-span-6 relative">
            <canvas
              ref={canvasRef}
              aria-hidden="true"
              className="pointer-events-none absolute -inset-6 w-[calc(100%+3rem)] h-[calc(100%+3rem)] opacity-90"
            />

            <div
              className={`relative rounded-2xl border shadow-xl overflow-hidden ${
                isDark
                  ? "bg-[#172B38]/95 border-[#C9B58E]/30 text-[#EAE5DB]"
                  : "bg-white border-[#EAE5DB] text-[#303437]"
              }`}
            >
              {/* Preview Top Bar */}
              <div
                className={`px-5 py-3.5 border-b flex items-center justify-between text-xs ${
                  isDark
                    ? "bg-[#0F1E28] border-[#C9B58E]/20 text-[#EAE5DB]/80"
                    : "bg-[#172B38] border-[#172B38] text-[#EAE5DB]"
                }`}
              >
                <div className="flex items-center gap-2.5 font-semibold">
                  <HazenorSymbol theme="dark" className="h-5 w-5" />
                  <span>HAZENOR — Ringkasan Eksekutif Properti</span>
                </div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-medium border border-[#C9B58E]/40 text-[#C9B58E] bg-[#0F1E28]/60">
                  Pemantauan Aktif
                </span>
              </div>

              <div className="p-3.5 sm:p-5 space-y-4 sm:space-y-5">
                {/* Summary KPI Row */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div
                    className={`rounded-xl border p-2 sm:p-3.5 ${
                      isDark
                        ? "bg-[#0F1E28]/70 border-[#C9B58E]/20"
                        : "bg-[#F6F4EF] border-[#EAE5DB]"
                    }`}
                  >
                    <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs opacity-75">
                      <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#C9B58E] shrink-0" aria-hidden="true" />
                      <span className="truncate">Total Unit</span>
                    </div>
                    <div className="mt-1 font-serif text-sm sm:text-xl font-bold truncate">Siap Kelola</div>
                    <div className="text-[10px] sm:text-[11px] opacity-70 truncate">Tangerang</div>
                  </div>

                  <div
                    className={`rounded-xl border p-2 sm:p-3.5 ${
                      isDark
                        ? "bg-[#0F1E28]/70 border-[#C9B58E]/20"
                        : "bg-[#F6F4EF] border-[#EAE5DB]"
                    }`}
                  >
                    <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs opacity-75">
                      <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#C9B58E] shrink-0" aria-hidden="true" />
                      <span className="truncate">Hunian</span>
                    </div>
                    <div className="mt-1 font-serif text-sm sm:text-xl font-bold truncate">Real-Time</div>
                    <div className="text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-300 font-medium truncate">
                      Status Unit
                    </div>
                  </div>

                  <div
                    className={`rounded-xl border p-2 sm:p-3.5 overflow-hidden ${
                      isDark
                        ? "bg-[#0F1E28]/70 border-[#C9B58E]/20"
                        : "bg-[#F6F4EF] border-[#EAE5DB]"
                    }`}
                  >
                    <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs opacity-75">
                      <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#C9B58E] shrink-0" aria-hidden="true" />
                      <span className="truncate">Tagihan</span>
                    </div>
                    <div className="mt-1 font-serif text-sm sm:text-xl font-bold truncate">Otomatis</div>
                    <div className="text-[10px] sm:text-[11px] text-amber-700 dark:text-[#C9B58E] font-medium truncate">
                      Invoice &amp; WA
                    </div>
                  </div>
                </div>

                {/* Revenue Overview Box */}
                <div
                  className={`rounded-xl border p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDark
                      ? "bg-[#0F1E28] border-[#C9B58E]/30"
                      : "bg-[#172B38] text-[#EAE5DB] border-[#172B38]"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-[#C9B58E]">
                      <Wallet className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">Sistem Manajemen Aset &amp; Tagihan Sewa</span>
                    </div>
                    <div className="mt-1 font-serif text-lg sm:text-xl font-bold text-white break-words">
                      HAZENOR Properties — Tangerang
                    </div>
                  </div>
                  <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-[#C9B58E]/20 text-[#C9B58E] border border-[#C9B58E]/40 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C9B58E]" />
                    Multi-Organisasi
                  </span>
                </div>

                {/* Recent Payment & Invoice Activity List */}
                <div className="space-y-2 sm:space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold opacity-75">
                    <span>Modul Operasional Terintegrasi</span>
                    <span>Status Sistem</span>
                  </div>

                  <div
                    className={`rounded-lg border p-2.5 sm:p-3 flex items-center justify-between gap-2 text-xs ${
                      isDark
                        ? "border-[#C9B58E]/20 bg-[#0F1E28]/60"
                        : "border-[#EAE5DB] bg-[#F6F4EF]/70"
                    }`}
                  >
                    <div className="min-w-0 pr-1">
                      <div className="font-semibold text-[11px] sm:text-xs leading-snug">
                        Manajemen Properti, Unit, Kontrak &amp; Invoice PDF
                      </div>
                      <div className="opacity-70 mt-0.5 text-[10px] sm:text-[11px] truncate">
                        Isolasi Data Penuh Antar-Akun Pengelola
                      </div>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full font-semibold text-[10px] sm:text-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      Aktif
                    </span>
                  </div>

                  <div
                    className={`rounded-lg border p-2.5 sm:p-3 flex items-center justify-between gap-2 text-xs ${
                      isDark
                        ? "border-[#C9B58E]/20 bg-[#0F1E28]/60"
                        : "border-[#EAE5DB] bg-[#F6F4EF]/70"
                    }`}
                  >
                    <div className="min-w-0 pr-1">
                      <div className="font-semibold text-[11px] sm:text-xs leading-snug">
                        Verifikasi Pembayaran &amp; Notifikasi WhatsApp Resmi
                      </div>
                      <div className="opacity-70 mt-0.5 flex items-center gap-1 text-[10px] sm:text-[11px] truncate">
                        <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span className="truncate">hazenor.id@gmail.com &bull; +62 882 9510 7590</span>
                      </div>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full font-semibold text-[10px] sm:text-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      Siap Pakai
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
