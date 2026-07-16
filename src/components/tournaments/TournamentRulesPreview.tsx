import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { buildTournamentRulesHtml } from "@/lib/tournament-rules-html";

async function logoDataUri() {
  try {
    const bytes = await readFile(
      path.join(process.cwd(), "public/brand/logo-transparent.png"),
    );
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    return "";
  }
}

export async function TournamentRulesPreview({
  title,
  rulesPdfUrl,
  backHref,
}: {
  title: string;
  rulesPdfUrl: string;
  backHref: string;
}) {
  const html = buildTournamentRulesHtml(await logoDataUri());

  return (
    <div className="flex min-h-[calc(100dvh-4.25rem)] flex-col bg-black">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-zinc-950 px-4 py-3 sm:px-6">
        <Link
          href={backHref}
          className="inline-flex min-h-11 min-w-0 items-center gap-2 rounded-md px-1 text-sm font-medium text-white transition-colors hover:text-jackals-red-light"
        >
          <ArrowLeft className="h-5 w-5 shrink-0" />
          Back to schedule
        </Link>
        <a
          href={rulesPdfUrl}
          download="jvc-mixed-beach-2v2-tournament-rules.pdf"
          className="shrink-0"
        >
          <Button type="button" size="sm" variant="outline" className="min-h-11">
            <Download className="h-4 w-4" />
            <span className="sm:inline">Download</span>
          </Button>
        </a>
      </div>
      <iframe
        title={`${title} rules`}
        srcDoc={html}
        className="min-h-0 w-full flex-1 border-0 bg-[#202121]"
      />
    </div>
  );
}
