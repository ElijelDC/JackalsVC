import { Suspense } from "react";
import { AuthRedirect } from "@/components/auth/AuthRedirect";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Member Login",
  description: "Sign in to your Jackals Volleyball Club member account.",
  path: "/login",
  noIndex: true,
});

export default function LoginPage() {
  return (
    <Suspense>
      <AuthRedirect mode="signin" />
    </Suspense>
  );
}
