"use client";

import Link from "next/link";
import React, { useState } from "react";
import {
  Dribbble,
  Facebook,
  Globe,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from "lucide-react";
import { HazenorLogo } from "@/components/brand/hazenor-logo";

export function RukoFooter() {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  }

  return (
    <footer
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative bg-[#172B38] text-[#EAE5DB] pt-16 pb-0 overflow-hidden border-t border-[#C9B58E]/25 select-none"
    >
      {/* Restrained Ambient Glow in Champagne Gold & Midnight Navy */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-[#C9B58E]/10 blur-[130px] animate-pulse-glow"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-14">
          {/* Column 1: HAZENOR Properties Brand Identity */}
          <div className="space-y-4">
            <Link href="/" className="inline-block group">
              <HazenorLogo variant="primary" theme="dark" size="md" showSlogan />
            </Link>
            <div className="pt-1">
              <span className="inline-block text-[11px] font-semibold tracking-[0.16em] uppercase px-2.5 py-1 rounded border border-[#C9B58E]/35 bg-[#0F1E28]/60 text-[#C9B58E]">
                HAZENOR — Property Management Platform
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#EAE5DB]/75 leading-relaxed max-w-xs">
              Membangun nilai jangka panjang melalui kepercayaan, keunggulan operasional, dan
              pengelolaan aset properti yang terintegrasi.
            </p>
          </div>

          {/* Column 2: Ekosistem & Produk */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-white tracking-wide">
              Tentang Kami
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href="/#beranda"
                  className="text-[#EAE5DB]/75 hover:text-[#C9B58E] hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Filosofi HAZENOR Properties
                </a>
              </li>
              <li>
                <a
                  href="/#fitur"
                  className="text-[#EAE5DB]/75 hover:text-[#C9B58E] hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Keunggulan Platform HAZENOR
                </a>
              </li>
              <li>
                <a
                  href="/#cara-kerja"
                  className="text-[#EAE5DB]/75 hover:text-[#C9B58E] hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Panduan Operasional
                </a>
              </li>
              <li>
                <a
                  href="/#harga"
                  className="text-[#EAE5DB]/75 hover:text-[#C9B58E] hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Paket Layanan Pengelolaan
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Akses Portal */}
          <div className="relative">
            <h3 className="font-serif text-lg font-semibold text-white tracking-wide">
              Tautan Layanan
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link
                  href="/owner"
                  className="text-[#EAE5DB]/75 hover:text-[#C9B58E] hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Portal Pemilik dan Staf
                </Link>
              </li>
              <li>
                <Link
                  href="/tenant"
                  className="text-[#EAE5DB]/75 hover:text-[#C9B58E] hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Portal Penyewa
                </Link>
              </li>
              <li className="flex items-center gap-3">
                <Link
                  href="/accept-invitation"
                  className="text-[#EAE5DB]/75 hover:text-[#C9B58E] hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Aktivasi Undangan Penyewa
                </Link>
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full bg-[#C9B58E] shadow-[0_0_10px_#C9B58E]"
                />
              </li>
              <li>
                <Link
                  href="/super-admin"
                  className="text-[#EAE5DB]/75 hover:text-[#C9B58E] hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Portal Administrator
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Hubungi Kami */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-white tracking-wide">
              Hubungi Kami
            </h3>
            <ul className="mt-4 space-y-3.5 text-sm">
              <li className="flex items-center gap-3 group">
                <Mail className="h-4 w-4 text-[#C9B58E] shrink-0 group-hover:scale-110 transition-transform" />
                <a
                  href="mailto:hazenor.id@gmail.com"
                  className="text-[#EAE5DB]/85 hover:text-white transition"
                >
                  hazenor.id@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-3 group">
                <Phone className="h-4 w-4 text-[#C9B58E] shrink-0 group-hover:scale-110 transition-transform" />
                <a
                  href="tel:+6288295107590"
                  className="text-[#EAE5DB]/85 hover:text-white transition"
                >
                  +62 882 9510 7590
                </a>
              </li>
              <li className="flex items-center gap-3 group">
                <MapPin className="h-4 w-4 text-[#C9B58E] shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-[#EAE5DB]/85">Tangerang, Indonesia</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Horizontal Divider */}
        <div className="border-t border-[#EAE5DB]/15 pt-7 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Social Icons */}
          <div className="flex items-center gap-5 text-[#EAE5DB]/60">
            <a
              href="/#beranda"
              aria-label="Facebook HAZENOR Properties"
              className="hover:text-[#C9B58E] hover:-translate-y-0.5 transition-all"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="/#beranda"
              aria-label="Instagram HAZENOR Properties"
              className="hover:text-[#C9B58E] hover:-translate-y-0.5 transition-all"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="/#beranda"
              aria-label="Twitter HAZENOR Properties"
              className="hover:text-[#C9B58E] hover:-translate-y-0.5 transition-all"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              href="/#fitur"
              aria-label="Portofolio HAZENOR Properties"
              className="hover:text-[#C9B58E] hover:-translate-y-0.5 transition-all"
            >
              <Dribbble className="h-4 w-4" />
            </a>
            <a
              href="/"
              aria-label="Situs Resmi www.hazenor.id"
              className="hover:text-[#C9B58E] hover:-translate-y-0.5 transition-all"
            >
              <Globe className="h-4 w-4" />
            </a>
          </div>

          {/* Copyright */}
          <p className="text-xs text-[#EAE5DB]/70">
            &copy; 2026 HAZENOR Properties. Seluruh hak cipta dilindungi.
          </p>
        </div>
      </div>

      {/* Architectural Outlined Watermark (HAZENOR) */}
      <div
        aria-hidden="true"
        className="relative w-full max-w-7xl mx-auto px-2 -mt-2 sm:-mt-4 overflow-hidden leading-none pointer-events-none"
      >
        <svg
          viewBox="0 0 1200 205"
          className="w-full h-auto block overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="hazenorStrokeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C9B58E" stopOpacity="0.22" />
              <stop offset="50%" stopColor="#C9B58E" stopOpacity="0.58" />
              <stop offset="100%" stopColor="#C9B58E" stopOpacity="0.22" />
            </linearGradient>
            <radialGradient
              id="hazenorHoverGlow"
              cx={`${mousePos.x}%`}
              cy={`${mousePos.y}%`}
              r="42%"
            >
              <stop
                offset="0%"
                stopColor="#DFD1B4"
                stopOpacity={isHovered ? "0.95" : "0.6"}
              />
              <stop
                offset="55%"
                stopColor="#C9B58E"
                stopOpacity={isHovered ? "0.55" : "0.3"}
              />
              <stop offset="100%" stopColor="#172B38" stopOpacity="0.1" />
            </radialGradient>
          </defs>
          <text
            x="50%"
            y="188"
            textAnchor="middle"
            fill="transparent"
            stroke="url(#hazenorStrokeGrad)"
            strokeWidth="1.8"
            className="font-serif font-semibold uppercase"
            style={{
              fontSize: "198px",
              letterSpacing: "0.12em",
            }}
          >
            HAZENOR
          </text>
          <text
            x="50%"
            y="188"
            textAnchor="middle"
            fill="transparent"
            stroke="url(#hazenorHoverGlow)"
            strokeWidth={isHovered ? "2.8" : "1.5"}
            className="font-serif font-semibold uppercase transition-all duration-300"
            style={{
              fontSize: "198px",
              letterSpacing: "0.12em",
            }}
          >
            HAZENOR
          </text>
        </svg>
      </div>
    </footer>
  );
}
