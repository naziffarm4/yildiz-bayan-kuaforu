import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://yildizbayankuaforu.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "", changeFrequency: "daily", priority: 1.0 },
    { path: "/hizmetler", changeFrequency: "weekly", priority: 0.9 },
    { path: "/galeri", changeFrequency: "daily", priority: 0.9 },
    { path: "/randevu", changeFrequency: "daily", priority: 0.95 },
    { path: "/hakkimizda", changeFrequency: "monthly", priority: 0.7 },
    { path: "/iletisim", changeFrequency: "monthly", priority: 0.8 },
    { path: "/degerlendir", changeFrequency: "weekly", priority: 0.8 },
    { path: "/kvkk", changeFrequency: "yearly", priority: 0.5 },
  ];

  return routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
