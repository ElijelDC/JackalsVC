import { Suspense } from "react";
import { auth } from "@/auth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/motion/PageTransition";
import { AuthModalProvider } from "@/components/providers/AuthModalProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <SessionProvider session={session}>
      <Suspense>
        <AuthModalProvider>
          <Header session={session} />
          <main className="flex-1">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer isLoggedIn={Boolean(session?.user)} />
        </AuthModalProvider>
      </Suspense>
    </SessionProvider>
  );
}
