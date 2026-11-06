import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HAZENOR Properties — Sistem Manajemen Properti dan Penyewaan",
    short_name: "HAZENOR",
    description:
      "Platform terpadu untuk mengelola properti, unit sewa, penyewa, kontrak, tagihan, pembayaran, dan keluhan.",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F4EF",
    theme_color: "#172B38",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
