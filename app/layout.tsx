import type { Metadata, Viewport } from "next";
import "./globals.css";
import CampaignRenderer from "../components/CampaignRenderer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import AutoTranslate from "@/components/AutoTranslate";
import SitePresence from "@/components/SitePresence";
import AnnouncementBroadcast from "@/components/AnnouncementBroadcast";
import { PersistentVoiceProvider } from "@/components/PersistentVoiceProvider";

const siteUrl = "https://www.haswolf.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "HASWOLF | Item, Yang ve DC AlÄ±m SatÄ±m Merkezi",
    template: "%s | HASWOLF",
  },
  description: "HASWOLF'ta Item, Yang, DC ve karakter Ã¼rÃ¼nlerini gÃ¼venle satÄ±n al veya Ã¼rÃ¼nlerini hÄ±zlÄ± deÄŸerlendirme iÃ§in bize sat.",
  keywords: ["Haswolf", "Yang satÄ±n al", "Yang sat", "DC satÄ±n al", "Item satÄ±n al", "Royale Online market"],
  applicationName: "HASWOLF",
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "HASWOLF",
    title: "HASWOLF | Bizden SatÄ±n Al veya Bize Sat",
    description: "Item, Yang, DC ve karakter alÄ±ÅŸveriÅŸinde gÃ¼venli, hÄ±zlÄ± ve profesyonel pazar deneyimi.",
    images: [{ url: "/icons/haswolf-512.png", width: 512, height: 512, alt: "HASWOLF" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "HASWOLF | Bizden SatÄ±n Al veya Bize Sat",
    description: "Item, Yang, DC ve karakter alÄ±ÅŸveriÅŸinde gÃ¼venli pazar deneyimi.",
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
      name: "HASWOLF alÄ±ÅŸveriÅŸ hizmetleri",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Bizden SatÄ±n Al", url: `${siteUrl}/#market` },
        { "@type": "ListItem", position: 2, name: "Bize Sat", url: `${siteUrl}/#top` },
        { "@type": "ListItem", position: 3, name: "DC SatÄ±ÅŸ", url: `${siteUrl}/#market` },
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
        <PersistentVoiceProvider>
        <AutoTranslate />
        <SitePresence />
        <AnnouncementBroadcast />
        {children}
        <CampaignRenderer />
        <FloatingWhatsApp />
        </PersistentVoiceProvider>
      </body>
    </html>
  );
}

