"use client";

import { Logo } from "@/components/layout/Logo";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 ambient-bg">
      <AnimateIn immediate className="w-full max-w-md">
        <Card className="border-jackals-red/20">
          <div className="mb-6 flex justify-center">
            <Logo size="lg" href={null} glow />
          </div>
          <CardTitle className="text-center text-2xl">{title}</CardTitle>
          <CardDescription className="mt-2 text-center">{description}</CardDescription>
          {children}
          {footer}
        </Card>
      </AnimateIn>
    </div>
  );
}
