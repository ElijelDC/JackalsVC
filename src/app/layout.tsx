import type { Metadata } from "next";
import { getSiteMetadataBase } from "@/lib/site-config";
import { OrganizationJsonLd } from "@/components/seo/OrganizationJsonLd";
import {
  SEO_DEFAULT_DESCRIPTION,
  SEO_KEYWORDS,
  SEO_SITE_NAME,
} from "@/lib/seo";
import { Geist, Geist_Mono } from "next/font/google";
import { Oswald } from "next/font/google";
import { CartProvider } from "@/components/shop/CartProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: getSiteMetadataBase(),
  title: {
    default: SEO_SITE_NAME,
    template: `%s | ${SEO_SITE_NAME}`,
  },
  description: SEO_DEFAULT_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Jackals VC",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "theme-color": "#202121",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} h-full`}
      style={{ backgroundColor: "#202121" }}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-background text-zinc-100 antialiased"
        style={{ backgroundColor: "#202121", color: "#f5f5f5" }}
        suppressHydrationWarning
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
              a { color: inherit; text-decoration: none; }
              img { max-width: 100%; height: auto; }
            `,
          }}
        />
        <OrganizationJsonLd />
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
