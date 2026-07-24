import type { LucideIcon } from "lucide-react";
import {
  Award,
  BookOpen,
  CalendarDays,
  Camera,
  ClipboardList,
  Dumbbell,
  Handshake,
  Home,
  LayoutDashboard,
  Mail,
  Settings,
  ShoppingBag,
  Trophy,
  Users,
  Volleyball,
  Wallet,
} from "lucide-react";
import { SHOP_ENABLED } from "@/lib/features";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  requiresAuth?: boolean;
  /** Shown for roster coaches only (not admins). */
  coachOnly?: boolean;
  /** Shown for paid roster coaches only. */
  paidCoachOnly?: boolean;
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
    href: "/coach/training",
    label: "Training times",
    icon: Dumbbell,
    description: "Update weekly training schedule for your squad.",
    requiresAuth: true,
    coachOnly: true,
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
    href: "/payments",
    label: "Payments",
    icon: Wallet,
    description: "Monthly club salary and payment confirmations.",
    requiresAuth: true,
    coachOnly: true,
    paidCoachOnly: true,
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

const COACH_PAID_PRIMARY_NAV_HREFS = [
  "/",
  "/events",
  "/training",
  "/matches",
  "/payments",
] as const;

const COACH_VOLUNTEER_PRIMARY_NAV_HREFS = [
  "/",
  "/events",
  "/training",
  "/matches",
] as const;

const COACH_PAID_MOBILE_QUICK_NAV_HREFS = [
  "/training",
  "/matches",
  "/payments",
] as const;

const COACH_VOLUNTEER_MOBILE_QUICK_NAV_HREFS = [
  "/training",
  "/matches",
  "/events",
] as const;

const ADMIN_MOBILE_QUICK_NAV_HREFS = [
  "/training",
  "/matches",
  "/admin",
] as const;

export const ADMIN_MOBILE_QUICK_NAV_ITEMS: NavItem[] = [
  {
    href: "/training",
    label: "Training",
    icon: Dumbbell,
    description:
      "Sign up for your squad's weekly training sessions throughout the month.",
  },
  {
    href: "/matches",
    label: "Matches",
    icon: Trophy,
    description:
      "Your squad's league and friendly matches — warm-up and kick-off times.",
  },
  {
    href: "/admin",
    label: "Admin",
    icon: Settings,
    description: "Club admin dashboard and settings.",
  },
];

const ADMIN_MOBILE_MENU_HIDE_HREFS = new Set(["/training", "/matches"]);

const ADMIN_MORE_HIDE_HREFS = new Set(["/", "/training", "/matches"]);

const COACH_MORE_HIDE_HREFS = new Set(["/coach/training"]);

export { ADMIN_MOBILE_MENU_HIDE_HREFS, ADMIN_MORE_HIDE_HREFS, COACH_MORE_HIDE_HREFS };

const ADMIN_PRIMARY_NAV_HREFS = [
  "/",
  "/events",
  "/training",
  "/matches",
  "/gallery",
] as const;

const GUEST_PRIMARY_NAV_HREFS = [
  "/",
  "/events",
  "/sponsors",
  "/gallery",
  "/trials",
] as const;

function primaryNavHrefs(
  isLoggedIn: boolean,
  isAdmin = false,
  isCoach = false,
  isPaidCoach = false,
) {
  if (isAdmin) return ADMIN_PRIMARY_NAV_HREFS;
  if (isLoggedIn && isCoach) {
    return isPaidCoach
      ? COACH_PAID_PRIMARY_NAV_HREFS
      : COACH_VOLUNTEER_PRIMARY_NAV_HREFS;
  }
  if (isLoggedIn) return MEMBER_PRIMARY_NAV_HREFS;
  return GUEST_PRIMARY_NAV_HREFS;
}

function mobileQuickNavHrefs(
  isLoggedIn: boolean,
  isAdmin = false,
  isCoach = false,
  isPaidCoach = false,
) {
  if (!isLoggedIn) return [];
  if (isAdmin) return ADMIN_MOBILE_QUICK_NAV_HREFS;
  if (isCoach) {
    return isPaidCoach
      ? COACH_PAID_MOBILE_QUICK_NAV_HREFS
      : COACH_VOLUNTEER_MOBILE_QUICK_NAV_HREFS;
  }
  return MEMBER_MOBILE_QUICK_NAV_HREFS;
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
    href: "/tournaments",
    label: "Our Tournaments",
    icon: Trophy,
    description:
      "Tournaments hosted by Jackals — champions, standings, and play-off results.",
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
  },
  {
    href: "/coaching",
    label: "Coach With Us",
    icon: ClipboardList,
    description:
      "Join our coaching staff — paid roles, National League squads, and applications opening soon.",
  },
  {
    href: "/trials",
    label: "Trials",
    icon: Volleyball,
    description:
      "August 2026 trials for Men's Division 2 and Women's Division 3 — apply now.",
  },
];

function allNavItems(
  isLoggedIn: boolean,
  isAdmin = false,
  isCoach = false,
  isPaidCoach = false,
) {
  const items = visibleNavItems(isLoggedIn, isAdmin, isCoach, isPaidCoach);
  if (isLoggedIn || isAdmin) return items;

  const primaryHrefs = new Set<string>(
    primaryNavHrefs(false, isAdmin, isCoach, isPaidCoach),
  );
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
  options?: { mobileMemberMenu?: boolean; isCoach?: boolean; isPaidCoach?: boolean },
) {
  return visibleMoreNavItems(isLoggedIn, isAdmin, options).some((item) =>
    isNavItemActive(pathname, item.href),
  );
}

export function visibleNavItems(
  isLoggedIn: boolean,
  isAdmin = false,
  isCoach = false,
  isPaidCoach = false,
) {
  return NAV_ITEMS.filter(
    (item) =>
      (!item.coachOnly || (isLoggedIn && isCoach && !isAdmin)) &&
      (!item.paidCoachOnly || (isLoggedIn && isCoach && isPaidCoach && !isAdmin)) &&
      (!item.requiresAuth || isLoggedIn || isAdmin) &&
      (SHOP_ENABLED || item.href !== "/shop"),
  );
}

export function visiblePrimaryNavItems(
  isLoggedIn: boolean,
  isAdmin = false,
  isCoach = false,
  isPaidCoach = false,
) {
  const hrefs = primaryNavHrefs(isLoggedIn, isAdmin, isCoach, isPaidCoach);
  const byHref = new Map(
    allNavItems(isLoggedIn, isAdmin, isCoach, isPaidCoach).map((item) => [
      item.href,
      item,
    ]),
  );
  return hrefs
    .map((href) => byHref.get(href))
    .filter((item): item is NavItem => Boolean(item));
}

export function visibleMemberMobileQuickNavItems(
  isLoggedIn: boolean,
  isAdmin = false,
  isCoach = false,
  isPaidCoach = false,
) {
  if (isAdmin) return ADMIN_MOBILE_QUICK_NAV_ITEMS;

  const hrefs = mobileQuickNavHrefs(isLoggedIn, isAdmin, isCoach, isPaidCoach);
  if (hrefs.length === 0) return [];

  const byHref = new Map(
    allNavItems(isLoggedIn, isAdmin, isCoach, isPaidCoach).map((item) => [
      item.href,
      item,
    ]),
  );
  return hrefs
    .map((href) => byHref.get(href))
    .filter((item): item is NavItem => Boolean(item));
}

export function isAdminQuickNavActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function visibleMemberMobileMenuNavItems(
  isLoggedIn: boolean,
  isAdmin = false,
  isCoach = false,
  isPaidCoach = false,
) {
  const quickNavHrefs = new Set<string>(
    mobileQuickNavHrefs(isLoggedIn, isAdmin, isCoach, isPaidCoach),
  );
  const primary = visiblePrimaryNavItems(
    isLoggedIn,
    isAdmin,
    isCoach,
    isPaidCoach,
  ).filter((item) => !quickNavHrefs.has(item.href));

  const byHref = new Map(
    [...allNavItems(isLoggedIn, isAdmin, isCoach, isPaidCoach), ...INFO_NAV_ITEMS].map(
      (item) => [item.href, item],
    ),
  );
  const extras = MEMBER_MOBILE_MENU_EXTRA_HREFS.map((href) =>
    byHref.get(href),
  ).filter((item): item is NavItem => Boolean(item));

  return [...primary, ...extras];
}

export function visibleMoreNavItems(
  isLoggedIn: boolean,
  isAdmin = false,
  options?: { mobileMemberMenu?: boolean; isCoach?: boolean; isPaidCoach?: boolean },
) {
  const isCoach = options?.isCoach ?? false;
  const isPaidCoach = options?.isPaidCoach ?? false;
  const primaryHrefs = new Set(
    visiblePrimaryNavItems(isLoggedIn, isAdmin, isCoach, isPaidCoach).map(
      (item) => item.href,
    ),
  );
  const secondaryNav = visibleNavItems(
    isLoggedIn,
    isAdmin,
    isCoach,
    isPaidCoach,
  ).filter((item) => !primaryHrefs.has(item.href) && item.href !== "/dashboard");
  const infoNav = INFO_NAV_ITEMS.filter(
    (item) => !primaryHrefs.has(item.href),
  );
  let items = [...secondaryNav, ...infoNav];

  if (isCoach && !isAdmin) {
    items = items.filter(
      (item) => item.href !== "/" && item.href !== "/membership" && !COACH_MORE_HIDE_HREFS.has(item.href),
    );
  }

  if (options?.mobileMemberMenu && isLoggedIn && !isAdmin) {
    const promotedHrefs = new Set<string>(MEMBER_MOBILE_MENU_EXTRA_HREFS);
    items = items.filter((item) => !promotedHrefs.has(item.href));
  }

  if (isAdmin) {
    items = items.filter((item) => !ADMIN_MORE_HIDE_HREFS.has(item.href));
  }

  return items;
}

export function getMobileQuickNavHrefs(
  isLoggedIn: boolean,
  isAdmin = false,
  isCoach = false,
  isPaidCoach = false,
): string[] {
  return [...mobileQuickNavHrefs(isLoggedIn, isAdmin, isCoach, isPaidCoach)];
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
