import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildSponsorPresentationHtml } from "@/lib/sponsor-presentation-html";

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

export async function SponsorPresentationPreview() {
  const html = buildSponsorPresentationHtml(await logoDataUri());

  return (
    <div className="bg-black">
      <iframe
        title="Jackals VC sponsor presentation preview"
        srcDoc={html}
        className="mx-auto block min-h-[calc(100vh-4.25rem)] w-full max-w-[210mm] border-0"
      />
    </div>
  );
}
