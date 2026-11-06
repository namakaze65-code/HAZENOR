import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HAZENOR Properties — Platform Manajemen Properti & Penyewaan",
  description:
    "HAZENOR Properties adalah platform manajemen properti dan aset penyewaan terpadu. A Legacy Built on Trust.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} ${cormorant.variable}`}>
      <body className="font-sans bg-[#F6F4EF] text-[#303437] antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
