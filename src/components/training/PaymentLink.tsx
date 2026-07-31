import { CreditCard } from "lucide-react";

const buttonClass =
  "inline-flex w-full items-center justify-center gap-2 border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/10";

export function PaymentLink({
  href,
  label = "Pay for session",
  onClick,
}: {
  href: string;
  label?: string;
  onClick?: () => void;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClass}
      onClick={onClick}
    >
      <CreditCard className="h-4 w-4" />
      {label}
    </a>
  );
}
