import type { MetadataRoute } from "next";

type SitemapEntry = {
  path: string;
  lastModified: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
};

const BASE_URL = "https://www.haswolf.com";

// IMPORTANT:
// lastModified must represent a real/meaningful content update date.
// Do not replace these with new Date() during builds; doing so would tell
// search engines that every page changed on every deployment.
const STATIC_PAGES: SitemapEntry[] = [
  { path: "", lastModified: "2026-08-30", changeFrequency: "daily", priority: 1 },
  { path: "/topluluk", lastModified: "2026-08-30", changeFrequency: "daily", priority: 0.9 },
  { path: "/cekilis", lastModified: "2026-08-29", changeFrequency: "daily", priority: 0.9 },
  { path: "/guvenli-ticaret", lastModified: "2026-08-29", changeFrequency: "monthly", priority: 0.8 },
  { path: "/satici-dogrulama", lastModified: "2026-08-29", changeFrequency: "monthly", priority: 0.75 },
  { path: "/topluluk-kurallari", lastModified: "2026-08-29", changeFrequency: "monthly", priority: 0.7 },
  { path: "/sss", lastModified: "2026-08-29", changeFrequency: "monthly", priority: 0.7 },
  { path: "/iletisim", lastModified: "2026-08-29", changeFrequency: "monthly", priority: 0.7 },
  { path: "/gizlilik", lastModified: "2026-08-29", changeFrequency: "yearly", priority: 0.5 },
  { path: "/kullanim-kosullari", lastModified: "2026-08-29", changeFrequency: "yearly", priority: 0.5 },
  { path: "/cerez-politikasi", lastModified: "2026-08-29", changeFrequency: "yearly", priority: 0.5 },
  { path: "/sorun-bildir", lastModified: "2026-08-29", changeFrequency: "monthly", priority: 0.5 },
];

// Future-ready market/server landing pages belong here once the corresponding
// public routes actually exist. Never publish non-existent/404 URLs in sitemap.
const MARKET_LANDING_PAGES: SitemapEntry[] = [];

export default function sitemap(): MetadataRoute.Sitemap {
  return [...STATIC_PAGES, ...MARKET_LANDING_PAGES].map((entry) => ({
    url: `${BASE_URL}${entry.path}`,
    lastModified: new Date(`${entry.lastModified}T00:00:00.000Z`),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
