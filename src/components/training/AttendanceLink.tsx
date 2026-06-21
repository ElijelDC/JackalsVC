import Link from "next/link";
import { ExternalLink } from "lucide-react";

const buttonClass =
  "mt-4 inline-flex w-full items-center justify-center gap-2 border border-jackals-red/40 bg-jackals-red/10 px-4 py-2 text-sm font-semibold text-jackals-red-light transition-colors hover:border-jackals-red/60 hover:bg-jackals-red/20";

export function AttendanceLink({ sessionId }: { sessionId: string }) {
  return (
    <Link href={`/training/${sessionId}/attend`} className={buttonClass}>
      Register attendance on Reclub
      <ExternalLink className="h-4 w-4" />
    </Link>
  );
}
