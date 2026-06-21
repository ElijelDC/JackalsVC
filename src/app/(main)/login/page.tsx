import { Suspense } from "react";
import { AuthRedirect } from "@/components/auth/AuthRedirect";

export const metadata = {
  title: "Members only | Jackals VC",
};

export default function LoginPage() {
  return (
    <Suspense>
      <AuthRedirect mode="signin" />
    </Suspense>
  );
}
