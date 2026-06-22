import type { Metadata } from "next";
import { PUBLIC_PATHS } from "@/lib/public-paths";
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
  title: {
    default: "Jackals VC | Volleyball Club",
    template: "%s | Jackals VC",
  },
  description:
    "Jackals Volleyball Club — training sessions, events, membership, gallery, and official club shop.",
  icons: {
    icon: PUBLIC_PATHS.brand.logo,
    apple: PUBLIC_PATHS.brand.logo,
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
