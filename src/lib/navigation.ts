import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  Camera,
  Dumbbell,
  Home,
  ShoppingBag,
  Users,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  {
    href: "/training",
    label: "Training",
    icon: Dumbbell,
    description:
      "Weekly sessions for all skill levels, from beginners to competitive players.",
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: Calendar,
    description:
      "Stay on top of tournaments, socials, and club meetings with personal reminders.",
  },
  {
    href: "/membership",
    label: "Membership",
    icon: Users,
    description:
      "Flexible plans to suit your schedule. Join the Jackals family today.",
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

export const FEATURE_ITEMS = NAV_ITEMS.filter((item) => item.href !== "/");
