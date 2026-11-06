import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HAZENOR Properties",
    short_name: "HAZENOR",
    description:
      "Platform terpadu untuk mengelola properti, unit sewa, penyewa, kontrak, tagihan, pembayaran, dan keluhan.",
    start_url: "/login",
    display: "standalone",
    orientation: "portrait",
    background_color: "#172B38",
    theme_color: "#172B38",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
