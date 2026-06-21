"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { Input, Label } from "@/components/ui/Input";

export function MemberSignInForm({
  callbackUrl,
  onSuccess,
  onRegister,
}: {
  callbackUrl: string;
  onSuccess?: () => void;
  onRegister: () => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    onSuccess?.();
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="member-signin-email">Email</Label>
          <Input
            id="member-signin-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <Label htmlFor="member-signin-password">Password</Label>
          <Input
            id="member-signin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <FormError message={error} />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-zinc-400">
        Don&apos;t have an account yet?{" "}
        <button
          type="button"
          onClick={onRegister}
          className="font-medium text-jackals-red-light hover:text-jackals-red"
        >
          Member register
        </button>
      </p>
    </>
  );
}
