import { Suspense } from "react";
import { AuthRedirect } from "@/components/auth/AuthRedirect";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Member Registration",
  description:
    "Register as a member of Jackals Volleyball Club in Dublin — create your account and join league training or open club sessions.",
  path: "/register",
});

export default function RegisterPage() {
  return (
    <Suspense>
      <AuthRedirect mode="register" />
    </Suspense>
  );
}
