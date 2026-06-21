import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  Camera,
  Dumbbell,
  Home,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  requiresAuth?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  {
    href: "/whats-on",
    label: "What's On?",
    icon: Sparkles,
    description:
      "Fun sessions, tournaments, and skills clinics open to everyone.",
  },
  {
    href: "/training",
    label: "Training",
    icon: Dumbbell,
    description:
      "Weekly sessions for all skill levels, from beginners to competitive players.",
    requiresAuth: true,
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: Calendar,
    description:
      "Stay on top of tournaments, skills clinics, and club meetings — add them to your calendar or save club reminders when signed in.",
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

export function isNavItemActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/whats-on" && pathname.startsWith("/fun-sessions")) return true;
  return href !== "/" && pathname.startsWith(`${href}/`);
}

export function visibleNavItems(isLoggedIn: boolean) {
  return NAV_ITEMS.filter((item) => !item.requiresAuth || isLoggedIn);
}

export function visibleFeatureItems(isLoggedIn: boolean) {
  return visibleNavItems(isLoggedIn).filter((item) => item.href !== "/");
}
