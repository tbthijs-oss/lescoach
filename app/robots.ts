import type { MetadataRoute } from "next";

const baseUrl = process.env.APP_URL || "https://lescoach.nl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/beheer", "/school", "/expert", "/api", "/auth/verify"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
