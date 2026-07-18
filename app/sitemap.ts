import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.haswolf.com";
  return ["", "/topluluk", "/cekilis", "/guvenli-ticaret", "/sss", "/iletisim"].map((path, index) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: index === 0 ? "daily" : "weekly", priority: index === 0 ? 1 : .7 }));
}
