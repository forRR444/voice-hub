import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://voicehub.jp";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date("2026-03-23"),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date("2026-03-20"),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/form/demo`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const supabase = createAdminClient();
  const { data: salonPages } = await supabase
    .from("salon_pages")
    .select("slug, updated_at")
    .eq("is_published", true);

  const salonEntries: MetadataRoute.Sitemap = (salonPages ?? []).map((page) => ({
    url: `${baseUrl}/salon/${page.slug}`,
    lastModified: new Date(page.updated_at),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...salonEntries];
}
