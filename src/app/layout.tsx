import type { Metadata } from "next";
import { PUBLIC_PATHS } from "@/lib/public-paths";
import { getSiteMetadataBase } from "@/lib/site-config";
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
    default: "Jackals VC | Volleyball Club",
    template: "%s | Jackals VC",
  },
  description:
    "Jackals Volleyball Club — training sessions, events, membership, gallery, and official club shop.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: PUBLIC_PATHS.brand.favicon, type: "image/png" },
      { url: PUBLIC_PATHS.brand.favicon, sizes: "32x32", type: "image/png" },
    ],
    shortcut: PUBLIC_PATHS.brand.favicon,
    apple: PUBLIC_PATHS.brand.favicon,
  },
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
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
