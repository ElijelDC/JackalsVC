import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  // Helps Turbopack resolve date-fns subpath exports reliably.
  // Gallery bulk uploads send multiple compressed images per request; the
  // default 10MB proxy buffer truncates the body and FormData parsing fails.
  experimental: {
    optimizePackageImports: ["date-fns"],
    // Number form avoids any string-parse ambiguity at runtime. Middleware
    // still clones matched request bodies; upload routes are excluded from the
    // matcher so large gallery batches are not truncated.
    proxyClientMaxBodySize: 300 * 1024 * 1024,
  },
  async redirects() {
    return [
      {
        source: "/trials/session/:slug",
        destination: "/session/:slug",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/uploads/:path*",
          destination: "/api/internal-uploads/:path*",
        },
      ],
    };
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/api/**",
      },
      {
        protocol: "https",
        hostname: "**.cdninstagram.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
