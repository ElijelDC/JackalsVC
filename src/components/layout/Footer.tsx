"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Mail } from "lucide-react";
import { CLUB_SLOGAN } from "@/lib/brand";
import { Logo } from "@/components/layout/Logo";
import { EditableText } from "@/components/site-edit/EditableText";
import { CONTACT_EMAIL } from "@/lib/contact";
import { SHOP_ENABLED } from "@/lib/features";
import {
  FACEBOOK_HANDLE,
  FACEBOOK_PAGE_URL,
  INSTAGRAM_HANDLE,
  INSTAGRAM_PROFILE_URL,
} from "@/lib/social";
import { FacebookIcon } from "@/components/ui/FacebookIcon";
import { InstagramIcon } from "@/components/ui/InstagramIcon";
import { NewsletterSubscribeForm } from "@/components/newsletter/NewsletterSubscribeForm";
import { cn } from "@/lib/utils";

function FooterBrand({
  contentKey,
  fallback,
  label,
}: {
  contentKey: string;
  fallback: string;
  label: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Logo size="lg" href="/" className="shrink-0" />
      <p className="min-w-0 pt-1 text-sm leading-relaxed text-zinc-500">
        <EditableText
          contentKey={contentKey}
          fallback={fallback}
          label={label}
          multiline
        />
      </p>
    </div>
  );
}

function FooterLink({
  href,
  children,
  external,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  const className =
    "text-sm text-zinc-400 transition-colors hover:text-jackals-red-light";

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function FooterContactLinks() {
  const linkClassName =
    "group flex items-start gap-2.5 text-sm text-zinc-400 transition-colors hover:text-jackals-red-light";

  return (
    <>
      <li>
        <a href={`mailto:${CONTACT_EMAIL}`} className={linkClassName}>
          <Mail
            className="mt-0.5 h-4 w-4 shrink-0 text-jackals-red-light/70 transition-colors group-hover:text-jackals-red-light"
            aria-hidden
          />
          <span className="min-w-0 break-all leading-snug">{CONTACT_EMAIL}</span>
        </a>
      </li>
      <li>
        <a
          href={INSTAGRAM_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
        >
          <InstagramIcon className="mt-0.5 shrink-0 text-jackals-red-light/70 transition-colors group-hover:text-jackals-red-light" />
          <span className="leading-snug">{INSTAGRAM_HANDLE}</span>
        </a>
      </li>
      <li>
        <a
          href={FACEBOOK_PAGE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
        >
          <FacebookIcon className="mt-0.5 shrink-0 text-jackals-red-light/70 transition-colors group-hover:text-jackals-red-light" />
          <span className="leading-snug">facebook.com/{FACEBOOK_HANDLE}</span>
        </a>
      </li>
    </>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-w-0 border-b border-white/10 sm:border-b-0">
      <button
        type="button"
        className="flex w-full items-center justify-between py-4 text-left sm:pointer-events-none sm:cursor-default sm:py-0"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-jackals-red-light sm:mb-3">
          {title}
        </h3>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-zinc-500 transition-transform sm:hidden",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      <ul
        className={cn(
          "space-y-2.5 overflow-hidden pb-4 sm:block sm:pb-0",
          open ? "block" : "hidden",
        )}
      >
        {children}
      </ul>
    </div>
  );
}

function FooterNewsletter({
  userEmail,
  eventNewsletterSubscribed,
}: {
  userEmail?: string | null;
  eventNewsletterSubscribed?: boolean;
}) {
  return (
    <div>
      <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-jackals-red-light">
        Event emails
      </h3>
      <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">
        New sessions and tournaments — we&apos;ll send a quick heads-up.
      </p>
      <NewsletterSubscribeForm
        source="footer"
        initialEmail={userEmail ?? ""}
        initialSubscribed={eventNewsletterSubscribed ?? false}
        minimal
      />
    </div>
  );
}

function FooterMainGrid({
  brand,
  columns,
}: {
  brand: ReactNode;
  columns: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-x-16">
        <div className="w-full shrink-0 lg:max-w-md">{brand}</div>
        <div className="flex w-full min-w-0 flex-col gap-y-0 sm:flex-row sm:flex-wrap sm:justify-between lg:flex-1 lg:gap-x-12 xl:gap-x-16">
          {columns}
        </div>
      </div>
    </div>
  );
}

function FooterBrandColumn({
  contentKey,
  fallback,
  label,
  userEmail,
  eventNewsletterSubscribed,
}: {
  contentKey: string;
  fallback: string;
  label: string;
  userEmail?: string | null;
  eventNewsletterSubscribed?: boolean;
}) {
  return (
    <div className="space-y-6">
      <FooterBrand contentKey={contentKey} fallback={fallback} label={label} />
      <FooterNewsletter
        userEmail={userEmail}
        eventNewsletterSubscribed={eventNewsletterSubscribed}
      />
    </div>
  );
}

function GuestFooter({
  userEmail,
  eventNewsletterSubscribed,
}: {
  userEmail?: string | null;
  eventNewsletterSubscribed?: boolean;
}) {
  return (
    <FooterMainGrid
      brand={
        <FooterBrandColumn
          contentKey="footer.guest.tagline"
          fallback={`${CLUB_SLOGAN} Your home for volleyball in the community.`}
          label="Footer tagline (guests)"
          userEmail={userEmail}
          eventNewsletterSubscribed={eventNewsletterSubscribed}
        />
      }
      columns={
        <>
          <FooterColumn title="Explore">
            <li>
              <FooterLink href="/events">Events</FooterLink>
            </li>
            <li>
              <FooterLink href="/teams">Our teams</FooterLink>
            </li>
            <li>
              <FooterLink href="/gallery">Gallery</FooterLink>
            </li>
            <li>
              <FooterLink href="/achievements">Achievements</FooterLink>
            </li>
            <li>
              <FooterLink href="/about">About us</FooterLink>
            </li>
          </FooterColumn>

          <FooterColumn title="Plan ahead">
            <li>
              <FooterLink href="/sponsors">For sponsors</FooterLink>
            </li>
            <li>
              <FooterLink href="/sponsors/partners">Our sponsors</FooterLink>
            </li>
            <li>
              <FooterLink href="/contact">Contact us</FooterLink>
            </li>
          </FooterColumn>

          <FooterColumn title="Get in touch">
            <FooterContactLinks />
          </FooterColumn>
        </>
      }
    />
  );
}

function MemberFooter({
  userEmail,
  eventNewsletterSubscribed,
}: {
  userEmail?: string | null;
  eventNewsletterSubscribed?: boolean;
}) {
  return (
    <FooterMainGrid
      brand={
        <FooterBrandColumn
          contentKey="footer.member.tagline"
          fallback={`${CLUB_SLOGAN} See what's on, manage your membership, and stay match-ready.`}
          label="Footer tagline (members)"
          userEmail={userEmail}
          eventNewsletterSubscribed={eventNewsletterSubscribed}
        />
      }
      columns={
        <>
          <FooterColumn title="Your club">
            <li>
              <FooterLink href="/dashboard">Dashboard</FooterLink>
            </li>
            <li>
              <FooterLink href="/membership">Membership</FooterLink>
            </li>
            <li>
              <FooterLink href="/events">Events</FooterLink>
            </li>
            <li>
              <FooterLink href="/training">Trainings</FooterLink>
            </li>
          </FooterColumn>

          <FooterColumn title="Discover">
            <li>
              <FooterLink href="/teams">Teams</FooterLink>
            </li>
            <li>
              <FooterLink href="/gallery">Gallery</FooterLink>
            </li>
            <li>
              <FooterLink href="/achievements">Achievements</FooterLink>
            </li>
            {SHOP_ENABLED && (
              <li>
                <FooterLink href="/shop">Club shop</FooterLink>
              </li>
            )}
          </FooterColumn>

          <FooterColumn title="Contact">
            <li>
              <FooterLink href="/contact">Contact us</FooterLink>
            </li>
            <FooterContactLinks />
          </FooterColumn>
        </>
      }
    />
  );
}

export function Footer({
  isLoggedIn = false,
  userEmail = null,
  eventNewsletterSubscribed = false,
}: {
  isLoggedIn?: boolean;
  userEmail?: string | null;
  eventNewsletterSubscribed?: boolean;
}) {
  return (
    <footer className="relative mt-auto border-t border-white/10 bg-jackals-inset/50">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-jackals-red/40 to-transparent" />

      {isLoggedIn ? (
        <MemberFooter
          userEmail={userEmail}
          eventNewsletterSubscribed={eventNewsletterSubscribed}
        />
      ) : (
        <GuestFooter
          userEmail={userEmail}
          eventNewsletterSubscribed={eventNewsletterSubscribed}
        />
      )}

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-zinc-600">
            © 2024 Jackals Volleyball Club
            <span className="mx-2 text-zinc-700" aria-hidden>
              ·
            </span>
            All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
