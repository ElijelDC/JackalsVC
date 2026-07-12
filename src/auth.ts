import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { isPaidCoachMember } from "@/lib/coach-payment-type";
import { prisma } from "@/lib/prisma";

function coachFieldsFromClubMember(
  clubMember: {
    profileImageUrl: string | null;
    rosterRole: string;
    coachPaymentType: string | null;
    trainingTeamKey: string | null;
  } | null,
) {
  return {
    profileImageUrl: clubMember?.profileImageUrl ?? null,
    isCoach:
      clubMember?.rosterRole === "COACH" && Boolean(clubMember.trainingTeamKey),
    coachPaymentType:
      clubMember?.rosterRole === "COACH"
        ? ((clubMember.coachPaymentType ?? "PAID") as "PAID" | "VOLUNTEER")
        : null,
    isPaidCoach: isPaidCoachMember(
      clubMember?.rosterRole ?? "PLAYER",
      clubMember?.coachPaymentType,
    ),
    coachTeamKey: clubMember?.trainingTeamKey ?? null,
  };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "checkbox" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).trim().toLowerCase();
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session: updateSession }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "MEMBER";
        token.email = user.email;
      }

      if (trigger === "update" && updateSession?.email) {
        token.email = updateSession.email as string;
      }

      if (token.id) {
        try {
          const [user, clubMember] = await Promise.all([
            prisma.user.findUnique({
              where: { id: token.id as string },
              select: { role: true },
            }),
            prisma.clubMember.findUnique({
              where: { userId: token.id as string },
              select: {
                profileImageUrl: true,
                rosterRole: true,
                coachPaymentType: true,
                trainingTeamKey: true,
              },
            }),
          ]);

          if (user?.role) {
            token.role = user.role;
          }

          Object.assign(token, coachFieldsFromClubMember(clubMember));
        } catch (error) {
          console.error("Failed to enrich auth token from club member:", error);
          Object.assign(token, coachFieldsFromClubMember(null));
        }
      }

      return token;
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.role = (token.role as string) ?? "MEMBER";
          if (token.email) {
            session.user.email = token.email as string;
          }

          session.user.profileImageUrl =
            (token.profileImageUrl as string | null | undefined) ?? null;
          session.user.isCoach = Boolean(token.isCoach);
          session.user.coachPaymentType =
            (token.coachPaymentType as "PAID" | "VOLUNTEER" | null | undefined) ??
            null;
          session.user.isPaidCoach = Boolean(token.isPaidCoach);
          session.user.coachTeamKey =
            (token.coachTeamKey as string | null | undefined) ?? null;
        }
      } catch (error) {
        console.error("Failed to build auth session:", error);
      }
      return session;
    },
  },
});
