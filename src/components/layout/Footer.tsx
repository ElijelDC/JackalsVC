"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, ChevronDown, Mail } from "lucide-react";
import { CLUB_SLOGAN } from "@/lib/brand";
import { Logo } from "@/components/layout/Logo";
import { EditableText } from "@/components/site-edit/EditableText";
import { CONTACT_EMAIL } from "@/lib/contact";
import { SHOP_ENABLED } from "@/lib/features";
import { INSTAGRAM_PROFILE_URL } from "@/lib/instagram";
import { InstagramIcon } from "@/components/ui/InstagramIcon";
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
  const tagline = (
    <p className="min-w-0 text-sm leading-relaxed text-zinc-500 lg:w-full">
      <EditableText
        contentKey={contentKey}
        fallback={fallback}
        label={label}
        multiline
      />
    </p>
  );

  return (
    <>
      <div className="flex items-center gap-3 sm:gap-4 lg:hidden">
        <Logo size="lg" href="/" className="shrink-0" />
        {tagline}
      </div>
      <div className="hidden lg:flex lg:max-w-xs lg:flex-col lg:items-center lg:gap-4">
        <Logo size="footer" href="/" className="shrink-0" />
        {tagline}
      </div>
    </>
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
    "text-sm text-zinc-500 transition-colors hover:text-jackals-red-light";

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

function FooterContactLink({
  href,
  label,
  value,
  icon,
  external = false,
}: {
  href: string;
  label: string;
  value: string;
  icon: ReactNode;
  external?: boolean;
}) {
  return (
    <li>
      <a
        href={href}
        {...(external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
        className="group flex items-start gap-3 rounded-sm border border-white/10 bg-white/[0.03] px-3 py-2.5 transition-colors hover:border-jackals-red/40 hover:bg-jackals-red/10"
      >
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center bg-jackals-red/15 text-jackals-red-light transition-colors group-hover:bg-jackals-red/25">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-400 transition-colors group-hover:text-jackals-red-light">
            {label}
            <ArrowUpRight className="h-3 w-3 shrink-0 opacity-60 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
          </span>
          <span className="mt-0.5 block text-sm text-white transition-colors group-hover:text-jackals-red-light">
            {value}
          </span>
        </span>
      </a>
    </li>
  );
}

function FooterContactLinks() {
  return (
    <>
      <FooterContactLink
        href={`mailto:${CONTACT_EMAIL}`}
        label="Email us"
        value={CONTACT_EMAIL}
        icon={<Mail className="h-4 w-4" aria-hidden />}
      />
      <FooterContactLink
        href={INSTAGRAM_PROFILE_URL}
        label="Instagram"
        value="@jackalsvolleyball"
        icon={<InstagramIcon />}
        external
      />
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
    <div className="border-b border-white/10 sm:border-b-0">
      <button
        type="button"
        className="flex w-full items-center justify-between py-4 text-left sm:pointer-events-none sm:cursor-default sm:py-0"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <h3 className="font-display text-xs font-semibold tracking-[0.2em] text-jackals-red-light sm:mb-4">
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
          "space-y-3 overflow-hidden pb-4 sm:block sm:pb-0",
          open ? "block" : "hidden",
        )}
      >
        {children}
      </ul>
    </div>
  );
}

function GuestFooter() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        <div className="sm:col-span-2 lg:col-span-1">
          <FooterBrand
            contentKey="footer.guest.tagline"
            fallback={`${CLUB_SLOGAN} Your home for volleyball in the community.`}
            label="Footer tagline (guests)"
          />
        </div>

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
            <FooterLink href="/membership">Membership</FooterLink>
          </li>
          <li>
            <FooterLink href="/sponsors">For sponsors</FooterLink>
          </li>
          <li>
            <FooterLink href="/contact">Contact us</FooterLink>
          </li>
        </FooterColumn>

        <FooterColumn title="Get in touch">
          <FooterContactLinks />
        </FooterColumn>
      </div>
    </div>
  );
}

function MemberFooter() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        <div className="sm:col-span-2 lg:col-span-1">
          <FooterBrand
            contentKey="footer.member.tagline"
            fallback={`${CLUB_SLOGAN} See what's on, manage your membership, and stay match-ready.`}
            label="Footer tagline (members)"
          />
        </div>

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
      </div>
    </div>
  );
}

export function Footer({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <footer className="relative mt-auto border-t border-white/10 bg-jackals-inset/65">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-jackals-red/50 to-transparent" />

      {isLoggedIn ? <MemberFooter /> : <GuestFooter />}

      <div className="border-t border-white/10 bg-jackals-inset/90">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-center text-xs text-zinc-600 sm:text-left">
            © {new Date().getFullYear()} Jackals Volleyball Club
          </p>
          <p className="text-center text-xs text-zinc-700 sm:text-right">
            All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
