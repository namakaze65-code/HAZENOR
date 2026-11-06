"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HazenorLogo } from "@/components/brand/hazenor-logo";

export default function RegisterOwnerPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          organization_name: organizationName,
          email,
          phone,
          password,
        }),
      });
      const payload = await res.json();
      if (res.ok && payload.success) {
        router.push("/owner");
        router.refresh();
      } else {
        setError(
          payload.message ||
            "Pendaftaran belum berhasil. Pastikan seluruh kolom telah diisi dengan benar."
        );
      }
    } catch {
      setError("Tidak dapat terhubung ke layanan HAZENOR Properties. Silakan coba kembali.");
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
              Bangun Tata Kelola Properti yang Terpercaya.
            </h2>
            <p className="text-sm text-[#EAE5DB]/75 leading-relaxed">
              Daftarkan perusahaan atau organisasi properti Anda untuk mengelola unit sewa, kontrak,
              tagihan, dan pembayaran secara terpusat.
            </p>
          </div>
        </div>

        <div className="text-xs text-[#EAE5DB]/60 space-y-1">
          <div className="font-serif italic text-sm text-[#C9B58E]">
            &ldquo;A Legacy Built on Trust.&rdquo;
          </div>
          <div>&copy; 2026 HAZENOR Properties. Seluruh hak cipta dilindungi.</div>
        </div>
      </div>

      {/* Right Registration Form Panel */}
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
              / <span className="text-[#172B38] font-semibold">Daftar sebagai Pemilik</span>
            </nav>
            <h1 className="mt-3 font-serif text-2xl sm:text-3xl font-semibold text-[#172B38]">
              Daftar sebagai Pemilik Properti
            </h1>
            <p className="mt-1 text-sm text-[#303437]/80">
              Buat akun pemilik dan organisasi pengelola untuk mulai mencatat properti serta unit
              sewa.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reg-name" className="block text-xs font-semibold text-[#172B38]">
                Nama Lengkap Pemilik
              </label>
              <input
                id="reg-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="mt-1.5 w-full rounded-lg border border-[#EAE5DB] bg-white px-3.5 py-2.5 text-sm text-[#303437] focus:border-[#172B38] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="reg-org" className="block text-xs font-semibold text-[#172B38]">
                Nama Organisasi atau Perusahaan Properti
              </label>
              <input
                id="reg-org"
                type="text"
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Contoh: PT Berkah Properti Nusantara"
                className="mt-1.5 w-full rounded-lg border border-[#EAE5DB] bg-white px-3.5 py-2.5 text-sm text-[#303437] focus:border-[#172B38] focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-[#303437]/70">
                Nama ini akan ditampilkan secara resmi pada tagihan yang dikirimkan kepada penyewa.
              </p>
            </div>
            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-[#172B38]">
                Alamat Email
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.id"
                className="mt-1.5 w-full rounded-lg border border-[#EAE5DB] bg-white px-3.5 py-2.5 text-sm text-[#303437] focus:border-[#172B38] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="reg-phone" className="block text-xs font-semibold text-[#172B38]">
                Nomor Telepon / WhatsApp
              </label>
              <input
                id="reg-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081234567890"
                className="mt-1.5 w-full rounded-lg border border-[#EAE5DB] bg-white px-3.5 py-2.5 text-sm text-[#303437] focus:border-[#172B38] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold text-[#172B38]">
                Kata Sandi
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="mt-1.5 w-full rounded-lg border border-[#EAE5DB] bg-white px-3.5 py-2.5 text-sm text-[#303437] focus:border-[#172B38] focus:outline-none"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-800"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#172B38] hover:bg-[#213B4D] disabled:opacity-60 py-2.5 text-sm font-semibold text-[#EAE5DB] border border-[#C9B58E]/40 transition"
            >
              {loading ? "Menyiapkan Organisasi..." : "Mulai Kelola Properti"}
            </button>
          </form>

          <p className="text-center text-xs text-[#303437]/80">
            Sudah memiliki akun?{" "}
            <Link href="/login" className="text-[#172B38] hover:underline font-semibold">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
