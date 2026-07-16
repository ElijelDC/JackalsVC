import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { PUBLIC_PATHS } from "@/lib/public-paths";
import {
  deleteManagedUploadFile,
  randomUploadFilename,
  saveManagedPdfFile,
} from "@/lib/save-upload.server";

const MAX_PDF_BYTES = 15 * 1024 * 1024;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    select: { id: true, type: true, rulesPdfUrl: true },
  });

  if (!event) return jsonError("Event not found", 404);
  if (event.type !== "TOURNAMENT") {
    return jsonError("Rules documents can only be uploaded for tournaments.", 400);
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return jsonError("Choose a PDF file to upload.", 400);
  }

  try {
    if (event.rulesPdfUrl) {
      await deleteManagedUploadFile(
        event.rulesPdfUrl,
        PUBLIC_PATHS.uploads.tournamentDocs,
      );
    }

    const rulesPdfUrl = await saveManagedPdfFile({
      file,
      relativeDir: ["tournament-docs", id],
      urlPrefix: `${PUBLIC_PATHS.uploads.tournamentDocs}/${id}`,
      buildFilename: () => randomUploadFilename("pdf"),
      maxBytes: MAX_PDF_BYTES,
      sizeError: "must be smaller than 15 MB.",
    });

    const updated = await prisma.event.update({
      where: { id },
      data: { rulesPdfUrl },
      select: { id: true, rulesPdfUrl: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "PDF upload failed.",
      400,
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    select: { id: true, rulesPdfUrl: true },
  });

  if (!event) return jsonError("Event not found", 404);

  if (event.rulesPdfUrl) {
    await deleteManagedUploadFile(
      event.rulesPdfUrl,
      PUBLIC_PATHS.uploads.tournamentDocs,
    );
  }

  await prisma.event.update({
    where: { id },
    data: { rulesPdfUrl: null },
  });

  return NextResponse.json({ success: true });
}
