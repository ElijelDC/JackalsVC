import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { isPaidCoachMember } from "@/lib/coach-payment-type";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
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
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "MEMBER";
      }

      if (token.id) {
        try {
          const clubMember = await prisma.clubMember.findUnique({
            where: { userId: token.id as string },
            select: {
              profileImageUrl: true,
              rosterRole: true,
              coachPaymentType: true,
              trainingTeamKey: true,
            },
          });
          token.profileImageUrl = clubMember?.profileImageUrl ?? null;
          token.isCoach =
            clubMember?.rosterRole === "COACH" &&
            Boolean(clubMember.trainingTeamKey);
          token.coachPaymentType =
            clubMember?.rosterRole === "COACH"
              ? (clubMember.coachPaymentType ?? "PAID")
              : null;
          token.isPaidCoach = isPaidCoachMember(
            clubMember?.rosterRole ?? "PLAYER",
            clubMember?.coachPaymentType,
          );
          token.coachTeamKey = clubMember?.trainingTeamKey ?? null;
        } catch (error) {
          console.error("Failed to enrich auth token from club member:", error);
          token.profileImageUrl = null;
          token.isCoach = false;
          token.isPaidCoach = false;
          token.coachPaymentType = null;
          token.coachTeamKey = null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.role = (token.role as string) ?? "MEMBER";

          if (token.id) {
            const clubMember = await prisma.clubMember.findUnique({
              where: { userId: token.id as string },
              select: {
                profileImageUrl: true,
                rosterRole: true,
                coachPaymentType: true,
                trainingTeamKey: true,
              },
            });

            session.user.profileImageUrl = clubMember?.profileImageUrl ?? null;
            session.user.isCoach =
              clubMember?.rosterRole === "COACH" &&
              Boolean(clubMember.trainingTeamKey);
            session.user.coachPaymentType =
              clubMember?.rosterRole === "COACH"
                ? ((clubMember.coachPaymentType ?? "PAID") as "PAID" | "VOLUNTEER")
                : null;
            session.user.isPaidCoach = isPaidCoachMember(
              clubMember?.rosterRole ?? "PLAYER",
              clubMember?.coachPaymentType,
            );
            session.user.coachTeamKey = clubMember?.trainingTeamKey ?? null;
          } else {
            session.user.profileImageUrl =
              (token.profileImageUrl as string | null | undefined) ?? null;
            session.user.isCoach = Boolean(token.isCoach);
            session.user.isPaidCoach = Boolean(token.isPaidCoach);
            session.user.coachPaymentType =
              (token.coachPaymentType as "PAID" | "VOLUNTEER" | null | undefined) ??
              null;
            session.user.coachTeamKey =
              (token.coachTeamKey as string | null | undefined) ?? null;
          }
        }
      } catch (error) {
        console.error("Failed to build auth session:", error);
      }
      return session;
    },
  },
});
