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
    proxyClientMaxBodySize: "150mb",
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
