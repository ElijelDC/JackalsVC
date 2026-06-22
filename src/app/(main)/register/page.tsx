import { Suspense } from "react";
import { AuthRedirect } from "@/components/auth/AuthRedirect";

export const metadata = {
  title: "Member register | Jackals VC",
};

export default function RegisterPage() {
  return (
    <Suspense>
      <AuthRedirect mode="register" />
    </Suspense>
  );
}
