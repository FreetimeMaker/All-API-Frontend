import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/auth", "/login", "/logout", "/api/"],
      },
    ],
    sitemap: "https://all-api.vercel.app/sitemap.xml",
  };
}
