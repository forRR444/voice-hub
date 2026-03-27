import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://voicehub.jp";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/onboarding/", "/login/", "/api/", "/preview/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
