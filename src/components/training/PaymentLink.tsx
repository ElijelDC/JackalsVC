import { CreditCard } from "lucide-react";

const buttonClass =
  "inline-flex w-full items-center justify-center gap-2 border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/10";

export function PaymentLink({
  href,
  label = "Pay for session",
}: {
  href: string;
  label?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClass}
    >
      <CreditCard className="h-4 w-4" />
      {label}
    </a>
  );
}
