import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import {
  deleteAchievementImageFile,
  saveAchievementImageFile,
  validateAchievementImageFile,
} from "@/lib/achievement-image";
import { z } from "zod";

const deleteImageSchema = z.object({
  imageUrl: z.string().min(1),
});

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const formData = await request.formData();
  const file = formData.get("file");
  const previousUrl = formData.get("previousUrl");

  if (!(file instanceof File) || file.size === 0) {
    return jsonError("Choose an image to upload.", 400);
  }

  const fileError = validateAchievementImageFile(file);
  if (fileError) return jsonError(fileError, 400);

  try {
    if (typeof previousUrl === "string" && previousUrl.trim()) {
      await deleteAchievementImageFile(previousUrl.trim());
    }

    const imageUrl = await saveAchievementImageFile(file);
    return NextResponse.json({ imageUrl });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Image upload failed.",
      400,
    );
  }
}

export async function DELETE(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("imageUrl")?.trim();

  if (!imageUrl) {
    const { data, response: parseError } = await parseJsonBody(
      request,
      deleteImageSchema,
    );
    if (parseError || !data) return parseError!;
    await deleteAchievementImageFile(data.imageUrl);
    return NextResponse.json({ success: true });
  }

  await deleteAchievementImageFile(imageUrl);
  return NextResponse.json({ success: true });
}
