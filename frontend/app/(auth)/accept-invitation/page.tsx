"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { HazenorLogo } from "@/components/brand/hazenor-logo";

function AcceptInvitationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("token") || "";

  const [token, setToken] = useState(initialToken);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/proxy/auth/accept-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          name,
          email,
          password,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(
          data.message ||
            "Gagal mengaktifkan undangan. Pastikan kode undangan masih berlaku (maksimal 48 jam) dan belum pernah digunakan."
        );
        return;
      }

      setSuccess("Akun penyewa Anda berhasil diaktifkan dan terhubung dengan unit sewa.");
      setTimeout(() => {
        router.push("/tenant");
      }, 1500);
    } catch {
      setError("Tidak dapat menghubungi layanan HAZENOR Properties. Pastikan layanan sedang aktif.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-xl border border-[#EAE5DB] shadow-sm p-6 sm:p-8 animate-fade-up">
      <div className="mb-6">
        <nav aria-label="Breadcrumb" className="text-xs text-[#303437]/70 mb-3">
          <Link href="/" className="hover:text-[#172B38]">
            Beranda
          </Link>{" "}
          <span className="mx-1">/</span>
          <span className="text-[#172B38] font-semibold">Aktivasi Undangan Penyewa</span>
        </nav>

        <Link href="/">
          <HazenorLogo variant="product" theme="light" size="sm" />
        </Link>
        <h1 className="mt-4 font-serif text-2xl font-semibold text-[#172B38]">
          Terima Undangan Akun Penyewa
        </h1>
        <p className="mt-1 text-xs text-[#303437]/80 leading-relaxed">
          Masukkan kode undangan yang dikirimkan oleh pengelola properti untuk menghubungkan akun
          Anda dengan profil penyewa.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800"
        >
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#172B38]">
            Kode Undangan Penyewa
          </label>
          <input
            type="text"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Tempel kode undangan 48 karakter dari pengelola"
            className="mt-1 w-full rounded-lg border border-[#EAE5DB] px-3 py-2 text-sm text-[#303437] focus:border-[#172B38] focus:outline-none"
          />
          <span className="block text-[11px] text-[#303437]/65 mt-1">
            Kode undangan hanya berlaku satu kali dalam waktu 48 jam sejak diterbitkan.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#172B38]">Nama Lengkap</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Hendra Wijaya"
            className="mt-1 w-full rounded-lg border border-[#EAE5DB] px-3 py-2 text-sm text-[#303437] focus:border-[#172B38] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#172B38]">Alamat Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@perusahaan.co.id"
            className="mt-1 w-full rounded-lg border border-[#EAE5DB] px-3 py-2 text-sm text-[#303437] focus:border-[#172B38] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#172B38]">Buat Kata Sandi</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 8 karakter"
            className="mt-1 w-full rounded-lg border border-[#EAE5DB] px-3 py-2 text-sm text-[#303437] focus:border-[#172B38] focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#172B38] hover:bg-[#213B4D] text-[#EAE5DB] border border-[#C9B58E]/40 font-semibold py-2.5 text-sm transition disabled:opacity-50"
        >
          {loading ? "Memverifikasi Undangan..." : "Aktifkan Akun Penyewa"}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-[#303437]/80">
        Sudah mengaktifkan akun?{" "}
        <Link href="/login" className="text-[#172B38] font-semibold hover:underline">
          Masuk ke Portal
        </Link>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F4EF] px-4 py-12">
      <Suspense
        fallback={
          <div className="text-sm text-[#303437]">Memuat halaman aktivasi undangan...</div>
        }
      >
        <AcceptInvitationForm />
      </Suspense>
    </div>
  );
}
