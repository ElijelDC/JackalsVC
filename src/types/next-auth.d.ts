import { DefaultSession } from "next-auth";
import type { CoachPaymentType } from "@/lib/coach-payment-type";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      profileImageUrl: string | null;
      isCoach: boolean;
      isPaidCoach: boolean;
      coachPaymentType: CoachPaymentType | null;
      coachTeamKey: string | null;
      coachTeamKeys: string[];
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    profileImageUrl?: string | null;
    isCoach?: boolean;
    isPaidCoach?: boolean;
    coachPaymentType?: CoachPaymentType | null;
    coachTeamKey?: string | null;
    coachTeamKeys?: string[];
  }
}
