import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/uploads/:path*.heic",
          destination: "/api/internal-uploads/:path*.heic",
        },
        {
          source: "/uploads/:path*.heif",
          destination: "/api/internal-uploads/:path*.heif",
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
