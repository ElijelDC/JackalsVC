import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import type { AdminDocumentDefinition } from "@/lib/admin-documents";
import {
  adminDocumentExists,
  adminDocumentUrl,
} from "@/lib/admin-documents";

export function AdminDocumentPreview({
  document,
  backHref = "/admin",
}: {
  document: AdminDocumentDefinition;
  backHref?: string;
}) {
  const documentUrl = adminDocumentUrl(document);
  const exists = adminDocumentExists(document);
  const isPdf = document.filename.toLowerCase().endsWith(".pdf");

  return (
    <PageContainer className="max-w-6xl">
      <div className="mb-4">
        <Link
          href={backHref}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to admin
        </Link>
      </div>

      <PageHeader title={document.title} description={document.description} />

      {!exists ? (
        <Card className="mt-6 border-amber-500/30 bg-amber-500/5">
          <CardTitle className="text-lg">Document not uploaded yet</CardTitle>
          <CardDescription className="mt-2 space-y-2 text-sm leading-relaxed">
            <p>
              Upload{" "}
              <code className="rounded bg-black/30 px-1.5 py-0.5 text-amber-100">
                {document.filename}
              </code>{" "}
              to{" "}
              <code className="rounded bg-black/30 px-1.5 py-0.5 text-amber-100">
                public/uploads/admin-docs/
              </code>{" "}
              on the server. Only admins can view files in that folder.
            </p>
          </CardDescription>
        </Card>
      ) : (
        <div className="mt-6 overflow-hidden border border-white/10 bg-black">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-zinc-950 px-4 py-3 sm:px-6">
            <p className="text-sm text-zinc-400">Admin only — not visible to members.</p>
            <a href={documentUrl} download={document.filename} className="shrink-0">
              <Button type="button" size="sm" variant="outline" className="min-h-11">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </a>
          </div>
          {isPdf ? (
            <iframe
              title={document.title}
              src={documentUrl}
              className="h-[min(80dvh,960px)] w-full border-0 bg-white"
            />
          ) : (
            <div className="px-4 py-6 sm:px-6">
              <p className="text-sm text-zinc-300">
                Preview is not available for this file type. Use download instead.
              </p>
              <a href={documentUrl} download={document.filename} className="mt-4 inline-block">
                <Button type="button" variant="primary">
                  <Download className="h-4 w-4" />
                  Download {document.filename}
                </Button>
              </a>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
