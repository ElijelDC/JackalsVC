import { DefaultSession } from "next-auth";
import type { CoachPaymentType } from "@/lib/coach-payment-type";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      mustChangePassword: boolean;
      profileImageUrl: string | null;
      isCoach: boolean;
      isPaidCoach: boolean;
      isPaygPlayer: boolean;
      coachPaymentType: CoachPaymentType | null;
      coachTeamKey: string | null;
      coachTeamKeys: string[];
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    mustChangePassword?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    mustChangePassword?: boolean;
    profileImageUrl?: string | null;
    isCoach?: boolean;
    isPaidCoach?: boolean;
    isPaygPlayer?: boolean;
    coachPaymentType?: CoachPaymentType | null;
    coachTeamKey?: string | null;
    coachTeamKeys?: string[];
  }
}
