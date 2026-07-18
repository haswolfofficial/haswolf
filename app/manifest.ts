import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HASWOLF",
    short_name: "HASWOLF",
    description: "HASWOLF Market ve Sohbet Platformu",
    start_url: "/",
    display: "standalone",
    background_color: "#050707",
    theme_color: "#d9aa4a",
    orientation: "portrait-primary",
    icons: [
      { src: "/icons/haswolf-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/haswolf-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/haswolf-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
