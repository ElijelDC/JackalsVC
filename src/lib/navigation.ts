import type { LucideIcon } from "lucide-react";
import {
  Award,
  BookOpen,
  CalendarDays,
  Camera,
  Dumbbell,
  Handshake,
  Home,
  LayoutDashboard,
  Mail,
  ShoppingBag,
  Trophy,
  Users,
  Volleyball,
} from "lucide-react";
import { SHOP_ENABLED } from "@/lib/features";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  requiresAuth?: boolean;
  /** Shown in More menu for guests only (e.g. sponsors page). */
  guestOnly?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  {
    href: "/events",
    label: "Events",
    icon: CalendarDays,
    description:
      "Fun sessions, tournaments, and skills clinics — browse by category or calendar.",
  },
  {
    href: "/training",
    label: "Trainings",
    icon: Dumbbell,
    description:
      "Sign up for your squad's weekly training sessions throughout the month.",
    requiresAuth: true,
  },
  {
    href: "/matches",
    label: "Matches",
    icon: Trophy,
    description:
      "Your squad's league and friendly matches — warm-up and kick-off times.",
    requiresAuth: true,
  },
  {
    href: "/membership",
    label: "Membership",
    icon: Users,
    description:
      "Flexible plans to suit your schedule. Join the Jackals family today.",
    requiresAuth: true,
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Your membership, payments, and event sign-ups.",
    requiresAuth: true,
  },
  {
    href: "/gallery",
    label: "Gallery",
    icon: Camera,
    description:
      "Relive match highlights, training moments, and club socials.",
  },
  {
    href: "/shop",
    label: "Shop",
    icon: ShoppingBag,
    description:
      "Official jerseys, kit, and merchandise — show your club colours.",
  },
];

const MEMBER_PRIMARY_NAV_HREFS = [
  "/",
  "/events",
  "/training",
  "/matches",
  "/membership",
] as const;

export const MEMBER_MOBILE_QUICK_NAV_HREFS = [
  "/training",
  "/matches",
  "/membership",
] as const;

const MEMBER_MOBILE_MENU_EXTRA_HREFS = ["/gallery", "/teams"] as const;

const ADMIN_PRIMARY_NAV_HREFS = [
  "/",
  "/events",
  "/training",
  "/matches",
] as const;

const GUEST_PRIMARY_NAV_HREFS = [
  "/",
  "/events",
  "/sponsors",
  "/gallery",
  "/teams",
] as const;

function primaryNavHrefs(isLoggedIn: boolean, isAdmin = false) {
  if (isAdmin) return ADMIN_PRIMARY_NAV_HREFS;
  if (isLoggedIn) return MEMBER_PRIMARY_NAV_HREFS;
  return GUEST_PRIMARY_NAV_HREFS;
}

export const INFO_NAV_ITEMS: NavItem[] = [
  {
    href: "/teams",
    label: "Our Teams",
    icon: Volleyball,
    description: "Meet the squads — men's, women's, and development teams.",
  },
  {
    href: "/achievements",
    label: "Club Achievements",
    icon: Award,
    description: "Tournament results, league titles, and club milestones.",
  },
  {
    href: "/about",
    label: "About Us",
    icon: BookOpen,
    description: "Our story, values, and what makes Jackals VC home.",
  },
  {
    href: "/contact",
    label: "Contact Us",
    icon: Mail,
    description: "Get in touch — questions, membership, or training enquiries.",
  },
  {
    href: "/sponsors",
    label: "For Sponsors",
    icon: Handshake,
    description:
      "Partner with Jackals VC — visibility, partnership opportunities, and club presentation download.",
    guestOnly: true,
  },
];

function allNavItems(isLoggedIn: boolean, isAdmin = false) {
  const items = visibleNavItems(isLoggedIn, isAdmin);
  if (isLoggedIn || isAdmin) return items;

  const primaryHrefs = new Set<string>(primaryNavHrefs(false, isAdmin));
  const extraInfoItems = INFO_NAV_ITEMS.filter(
    (item) =>
      primaryHrefs.has(item.href) &&
      !items.some((navItem) => navItem.href === item.href),
  );
  return [...items, ...extraInfoItems];
}

export function isNavItemActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/events" && pathname.startsWith("/fun-sessions")) return true;
  if (href === "/events" && pathname === "/whats-on") return true;
  if (href === "/events" && pathname === "/calendar") return true;
  return href !== "/" && pathname.startsWith(`${href}/`);
}

export function isInfoNavActive(
  pathname: string,
  isLoggedIn = false,
  isAdmin = false,
  options?: { mobileMemberMenu?: boolean },
) {
  return visibleMoreNavItems(isLoggedIn, isAdmin, options).some((item) =>
    isNavItemActive(pathname, item.href),
  );
}

export function visibleNavItems(isLoggedIn: boolean, isAdmin = false) {
  return NAV_ITEMS.filter(
    (item) =>
      (!item.requiresAuth || isLoggedIn || isAdmin) &&
      (SHOP_ENABLED || item.href !== "/shop"),
  );
}

export function visiblePrimaryNavItems(isLoggedIn: boolean, isAdmin = false) {
  const hrefs = primaryNavHrefs(isLoggedIn, isAdmin);
  const byHref = new Map(allNavItems(isLoggedIn, isAdmin).map((item) => [item.href, item]));
  return hrefs
    .map((href) => byHref.get(href))
    .filter((item): item is NavItem => Boolean(item));
}

export function visibleMemberMobileQuickNavItems(
  isLoggedIn: boolean,
  isAdmin = false,
) {
  if (!isLoggedIn) return [];

  const byHref = new Map(allNavItems(isLoggedIn, isAdmin).map((item) => [item.href, item]));
  return MEMBER_MOBILE_QUICK_NAV_HREFS.map((href) => byHref.get(href)).filter(
    (item): item is NavItem => Boolean(item),
  );
}

export function visibleMemberMobileMenuNavItems(
  isLoggedIn: boolean,
  isAdmin = false,
) {
  const quickNavHrefs = new Set<string>(MEMBER_MOBILE_QUICK_NAV_HREFS);
  const primary = visiblePrimaryNavItems(isLoggedIn, isAdmin).filter(
    (item) => !quickNavHrefs.has(item.href) && item.href !== "/",
  );

  const byHref = new Map(
    [...allNavItems(isLoggedIn, isAdmin), ...INFO_NAV_ITEMS].map((item) => [
      item.href,
      item,
    ]),
  );
  const extras = MEMBER_MOBILE_MENU_EXTRA_HREFS.map((href) =>
    byHref.get(href),
  ).filter((item): item is NavItem => Boolean(item));

  return [...primary, ...extras];
}

export function visibleMoreNavItems(
  isLoggedIn: boolean,
  isAdmin = false,
  options?: { mobileMemberMenu?: boolean },
) {
  const primaryHrefs = new Set(
    visiblePrimaryNavItems(isLoggedIn, isAdmin).map((item) => item.href),
  );
  const secondaryNav = visibleNavItems(isLoggedIn, isAdmin).filter(
    (item) => !primaryHrefs.has(item.href) && item.href !== "/dashboard",
  );
  const infoNav = INFO_NAV_ITEMS.filter(
    (item) =>
      !primaryHrefs.has(item.href) &&
      (isAdmin || !item.guestOnly || !isLoggedIn),
  );
  let items = [...secondaryNav, ...infoNav];

  if (options?.mobileMemberMenu && isLoggedIn && !isAdmin) {
    const promotedHrefs = new Set<string>(MEMBER_MOBILE_MENU_EXTRA_HREFS);
    items = items.filter((item) => !promotedHrefs.has(item.href));
  }

  return items;
}

const GUEST_HOME_FEATURE_HREFS = [
  "/events",
  "/gallery",
  "/teams",
  "/contact",
] as const;

const HOME_FEATURE_LIMIT = 3;

export function visibleFeatureItems(isLoggedIn: boolean, isAdmin = false) {
  const items = visibleNavItems(isLoggedIn, isAdmin).filter(
    (item) => item.href !== "/",
  );

  if (isLoggedIn || isAdmin) {
    return items.slice(0, HOME_FEATURE_LIMIT);
  }

  const byHref = new Map(
    [...items, ...INFO_NAV_ITEMS].map((item) => [item.href, item]),
  );

  return GUEST_HOME_FEATURE_HREFS.map((href) => byHref.get(href))
    .filter((item): item is NavItem => Boolean(item))
    .slice(0, HOME_FEATURE_LIMIT);
}
