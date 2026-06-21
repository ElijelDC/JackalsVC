import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

export function Footer({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <footer className="relative border-t border-white/10 bg-background">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-jackals-red/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="mb-4">
              <Logo size="lg" showText href={null} glow />
            </div>
            <p className="text-sm leading-relaxed text-zinc-500">
              Volleyball club dedicated to training, competition, and community.
              Train hard. Play fierce. Join the pack.
            </p>
          </div>

          <div>
            <h3 className="font-display mb-4 text-sm font-semibold tracking-widest text-white">
              Quick links
            </h3>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>
                <Link href="/whats-on" className="hover:text-jackals-red-light">
                  What&apos;s on?
                </Link>
              </li>
              <li>
                <Link href="/training" className="hover:text-jackals-red-light">
                  Training times
                </Link>
              </li>
              <li>
                <Link href="/calendar" className="hover:text-jackals-red-light">
                  Events calendar
                </Link>
              </li>
              {isLoggedIn && (
                <li>
                  <Link href="/membership" className="hover:text-jackals-red-light">
                    Membership
                  </Link>
                </li>
              )}
              <li>
                <Link href="/shop" className="hover:text-jackals-red-light">
                  Club shop
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display mb-4 text-sm font-semibold tracking-widest text-white">
              Contact
            </h3>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>info@jackalsvc.com</li>
              <li>Training hall, Sports Centre</li>
            </ul>
          </div>
        </div>

        <div className="section-divider my-8" />

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <Logo size="sm" href={null} />
          <p className="text-center text-sm text-zinc-600">
            © {new Date().getFullYear()} Jackals Volleyball Club. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
