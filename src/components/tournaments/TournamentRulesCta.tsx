import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function TournamentRulesCta({
  rulesPdfUrl,
  rulesPreviewPath,
  downloadName = "jvc-mixed-beach-2v2-tournament-rules.pdf",
  layout = "inline",
}: {
  rulesPdfUrl: string;
  rulesPreviewPath: string;
  downloadName?: string;
  layout?: "inline" | "stacked";
}) {
  const wrap =
    layout === "stacked"
      ? "mx-auto mt-6 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center"
      : "flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center";

  return (
    <div className={wrap}>
      <a href={rulesPdfUrl} download={downloadName} className="block w-full sm:w-auto">
        <Button size="lg" className="w-full sm:w-auto">
          Download rules PDF
        </Button>
      </a>
      <Link href={rulesPreviewPath} className="block w-full sm:w-auto">
        <Button variant="outline" size="lg" className="w-full sm:w-auto">
          Preview rules
        </Button>
      </Link>
    </div>
  );
}
