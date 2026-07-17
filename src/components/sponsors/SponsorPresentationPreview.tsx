import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PUBLIC_PATHS } from "@/lib/public-paths";
import {
  loadSponsorPackageExampleImages,
  loadSponsorPresentationLogo,
} from "@/lib/sponsor-presentation-assets";
import { buildSponsorPresentationHtml } from "@/lib/sponsor-presentation-html";

export async function SponsorPresentationPreview() {
  const [logo, packageExamples] = await Promise.all([
    loadSponsorPresentationLogo(),
    loadSponsorPackageExampleImages(),
  ]);
  const html = buildSponsorPresentationHtml(logo, packageExamples);

  return (
    <div className="flex min-h-[calc(100dvh-4.25rem)] flex-col bg-black">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-zinc-950 px-4 py-3 sm:px-6">
        <Link
          href="/sponsors"
          className="inline-flex min-h-11 min-w-0 items-center gap-2 rounded-md px-1 text-sm font-medium text-white transition-colors hover:text-jackals-red-light"
        >
          <ArrowLeft className="h-5 w-5 shrink-0" />
          Back to sponsors
        </Link>
        <a
          href={PUBLIC_PATHS.downloads.sponsorPresentation}
          download="jackals-vc-sponsor-presentation.pdf"
          className="shrink-0"
        >
          <Button type="button" size="sm" variant="outline" className="min-h-11">
            <Download className="h-4 w-4" />
            <span className="sm:inline">Download</span>
          </Button>
        </a>
      </div>
      <iframe
        title="Jackals VC sponsor presentation preview"
        srcDoc={html}
        className="min-h-0 w-full flex-1 border-0 bg-[#151515]"
      />
    </div>
  );
}
