import type { Metadata, Viewport } from "next";
import "./globals.css";
import CampaignRenderer from "../components/CampaignRenderer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import AutoTranslate from "@/components/AutoTranslate";
import SitePresence from "@/components/SitePresence";
import AnnouncementBroadcast from "@/components/AnnouncementBroadcast";

const siteUrl = "https://www.haswolf.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "HASWOLF | Item, Yang ve DC Alım Satım Merkezi",
    template: "%s | HASWOLF",
  },
  description: "HASWOLF'ta Item, Yang, DC ve karakter ürünlerini güvenle satın al veya ürünlerini hızlı değerlendirme için bize sat.",
  keywords: ["Haswolf", "Yang satın al", "Yang sat", "DC satın al", "Item satın al", "Royale Online market"],
  applicationName: "HASWOLF",
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "HASWOLF",
    title: "HASWOLF | Bizden Satın Al veya Bize Sat",
    description: "Item, Yang, DC ve karakter alışverişinde güvenli, hızlı ve profesyonel pazar deneyimi.",
    images: [{ url: "/icons/haswolf-512.png", width: 512, height: 512, alt: "HASWOLF" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "HASWOLF | Bizden Satın Al veya Bize Sat",
    description: "Item, Yang, DC ve karakter alışverişinde güvenli pazar deneyimi.",
    images: ["/icons/haswolf-512.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/haswolf-192.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon.ico",
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

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "HASWOLF",
      url: siteUrl,
      logo: `${siteUrl}/icons/haswolf-512.png`,
      sameAs: [
        "https://www.instagram.com/royaleonlinehaswolf",
        "https://www.tiktok.com/@haswolfgame",
        "https://www.youtube.com/@ROYALEONLINEHASWOLF",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "HASWOLF",
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: "tr-TR",
    },
    {
      "@type": "ItemList",
      name: "HASWOLF alışveriş hizmetleri",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Bizden Satın Al", url: `${siteUrl}/#market` },
        { "@type": "ListItem", position: 2, name: "Bize Sat", url: `${siteUrl}/#top` },
        { "@type": "ListItem", position: 3, name: "DC Satış", url: `${siteUrl}/#market` },
        { "@type": "ListItem", position: 4, name: "Yang Market", url: `${siteUrl}/#market` },
      ],
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className="h-full bg-[#050707] antialiased">
      <body className="min-h-full bg-[#050707] text-white">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <AutoTranslate />
        <SitePresence />
        <AnnouncementBroadcast />
        {children}
        <CampaignRenderer />
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
