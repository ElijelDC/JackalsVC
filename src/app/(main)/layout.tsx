import { Suspense } from "react";
import { auth } from "@/auth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/motion/PageTransition";
import { AuthModalProvider } from "@/components/providers/AuthModalProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { SiteEditProvider } from "@/components/providers/SiteEditProvider";
import { getSiteContentMap } from "@/lib/site-content";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const siteContent = await getSiteContentMap();

  return (
    <SessionProvider session={session}>
      <SiteEditProvider isAdmin={isAdmin} initialContent={siteContent}>
        <Suspense>
          <AuthModalProvider>
            <Header session={session} />
            <main className="flex-1">
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer isLoggedIn={Boolean(session?.user)} />
          </AuthModalProvider>
        </Suspense>
      </SiteEditProvider>
    </SessionProvider>
  );
}
