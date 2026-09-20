import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/membership/2026-27",
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/agent/",
          "/admin/",
          "/coach/",
          "/api/",
          "/dashboard",
          "/profile",
          "/membership",
          "/membership/",
          "/payments",
          "/matches",
          "/training",
          "/login",
          "/shop/cart",
          "/sponsors/presentation",
          "/calendar/",
          "/committee",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
