import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { listTrialsApplications } from "@/lib/trials-applications";
import {
  buildTrialsApplicationsWorkbook,
  trialsExportFilename,
} from "@/lib/trials-applications-export";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const applications = await listTrialsApplications();
  const buffer = await buildTrialsApplicationsWorkbook(applications);
  const filename = trialsExportFilename();

  return new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
