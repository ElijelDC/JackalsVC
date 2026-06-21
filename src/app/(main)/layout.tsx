import { auth } from "@/auth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/motion/PageTransition";
import { SessionProvider } from "@/components/providers/SessionProvider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <SessionProvider session={session}>
      <Header session={session} />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer isLoggedIn={Boolean(session?.user)} />
    </SessionProvider>
  );
}
