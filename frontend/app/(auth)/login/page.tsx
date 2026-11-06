"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HazenorLogo } from "@/components/brand/hazenor-logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "info" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "info", text: "Memverifikasi kredensial akun Anda..." });

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await res.json();
      if (res.ok && payload.success) {
        setStatus({
          type: "info",
          text: "Berhasil masuk. Mengarahkan ke portal Anda...",
        });
        const portal = payload.data?.portal;
        router.push(portal === "tenant" ? "/tenant" : portal === "super-admin" ? "/super-admin" : "/owner");
        router.refresh();
      } else {
        setStatus({
          type: "error",
          text: payload.message || "Alamat email atau kata sandi belum sesuai. Silakan periksa kembali.",
        });
      }
    } catch {
      setStatus({
        type: "error",
        text: "Tidak dapat terhubung ke layanan HAZENOR Properties. Silakan coba beberapa saat lagi.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setStatus({
        type: "error",
        text: "Masukkan alamat email Anda terlebih dahulu untuk meminta tautan pemulihan kata sandi.",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/proxy/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = await res.json();
      setStatus({
        type: "info",
        text:
          payload.message ||
          `Instruksi pemulihan kata sandi telah dikirimkan ke ${email}.`,
      });
    } catch {
      setStatus({
        type: "error",
        text: "Gagal mengirim permintaan pemulihan kata sandi.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#172B38] text-[#303437] grid grid-cols-1 lg:grid-cols-12">
      {/* Left Architectural Brand Panel */}
      <div className="hidden lg:flex lg:col-span-5 bg-[#0F1E28] text-[#EAE5DB] p-12 flex-col justify-between border-r border-[#C9B58E]/20">
        <div>
          <Link href="/">
            <HazenorLogo variant="primary" theme="dark" size="lg" showSlogan />
          </Link>
          <div className="mt-8 pt-8 border-t border-[#C9B58E]/20 space-y-4">
            <span className="inline-block text-[11px] font-semibold tracking-[0.18em] uppercase px-2.5 py-1 rounded border border-[#C9B58E]/40 text-[#C9B58E]">
              HAZENOR — Property Management Platform
            </span>
            <h2 className="font-serif text-3xl font-semibold text-white leading-snug">
              Keunggulan Operasional dalam Pengelolaan Aset Properti.
            </h2>
            <p className="text-sm text-[#EAE5DB]/75 leading-relaxed">
              Pantau seluruh portofolio properti, unit sewa, kontrak penyewa, tagihan, serta
              verifikasi pembayaran melalui satu sistem yang terintegrasi.
            </p>
          </div>
        </div>

        <div className="text-xs text-[#EAE5DB]/60 space-y-1">
          <div className="font-serif italic text-sm text-[#C9B58E]">
            &ldquo;Building lasting value through trust, innovation, and excellence in property
            management.&rdquo;
          </div>
          <div>&copy; 2026 HAZENOR Properties. Seluruh hak cipta dilindungi.</div>
        </div>
      </div>

      {/* Right Authentication Form Panel */}
      <div className="lg:col-span-7 bg-[#F6F4EF] flex flex-col justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-md mx-auto rounded-xl border border-[#EAE5DB] bg-white p-6 sm:p-8 shadow-sm space-y-6 animate-fade-up">
          <div className="lg:hidden pb-4 border-b border-[#EAE5DB]">
            <Link href="/">
              <HazenorLogo variant="product" theme="light" size="sm" />
            </Link>
          </div>

          <div>
            <nav aria-label="Breadcrumb" className="text-xs text-[#303437]/70">
              <Link href="/" className="hover:text-[#172B38] underline-offset-2 hover:underline">
                Beranda
              </Link>{" "}
              / <span className="text-[#172B38] font-semibold">Masuk Akun</span>
            </nav>
            <h1 className="mt-3 font-serif text-2xl sm:text-3xl font-semibold text-[#172B38]">
              Masuk ke HAZENOR Properties
            </h1>
            <p className="mt-1 text-sm text-[#303437]/80">
              Kelola properti, unit, tagihan, dan penyewa Anda di bawah ekosistem HAZENOR Properties.
            </p>
          </div>

          <div className="rounded-lg bg-[#F6F4EF] border border-[#EAE5DB] p-3.5 text-xs text-[#303437]/85">
            Setiap akun hanya dapat membuka portalnya sendiri: pemilik &amp; staf ke Portal Pemilik,
            penyewa ke Portal Penyewa (melalui tautan undangan dari pengelola).
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-[#172B38]">
                Alamat Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.id"
                className="mt-1.5 w-full rounded-lg border border-[#EAE5DB] bg-white px-3.5 py-2.5 text-sm text-[#303437] focus:border-[#172B38] focus:outline-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-[#172B38]"
                >
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-semibold text-[#A89268] hover:text-[#172B38] transition"
                >
                  Lupa Kata Sandi?
                </button>
              </div>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="mt-1.5 w-full rounded-lg border border-[#EAE5DB] bg-white px-3.5 py-2.5 text-sm text-[#303437] focus:border-[#172B38] focus:outline-none"
              />
            </div>

            {status && (
              <div
                role="status"
                className={`rounded-lg border p-3 text-xs font-medium ${
                  status.type === "error"
                    ? "bg-rose-50 border-rose-200 text-rose-800"
                    : "bg-[#F6F4EF] border-[#C9B58E]/50 text-[#172B38]"
                }`}
              >
                {status.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#172B38] hover:bg-[#213B4D] disabled:opacity-60 py-2.5 text-sm font-semibold text-[#EAE5DB] border border-[#C9B58E]/40 transition"
            >
              {loading ? "Memproses..." : "Masuk ke Sistem"}
            </button>
          </form>

          <p className="text-center text-xs text-[#303437]/80">
            Belum memiliki akun pengelola?{" "}
            <Link href="/register" className="text-[#172B38] hover:underline font-semibold">
              Daftar sebagai Pemilik Properti
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
