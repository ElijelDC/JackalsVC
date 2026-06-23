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
  let session = null;
  let siteContent = {};

  try {
    [session, siteContent] = await Promise.all([
      auth(),
      getSiteContentMap(),
    ]);
  } catch (error) {
    console.error("Failed to load app layout session/content:", error);
  }

  const isAdmin = session?.user?.role === "ADMIN";

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
