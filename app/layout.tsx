import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "HASWOLF",
    template: "%s | HASWOLF",
  },
  description: "HASWOLF Market ve sohbet platformu",
  applicationName: "HASWOLF",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/haswolf-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#050707",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full bg-[#050707] antialiased">
      <body className="min-h-full bg-[#050707] text-white">{children}</body>
    </html>
  );
}
