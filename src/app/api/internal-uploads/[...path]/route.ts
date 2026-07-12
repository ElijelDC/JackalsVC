import { serveUploadFile } from "@/lib/serve-upload.server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  return serveUploadFile(segments.join("/"));
}
