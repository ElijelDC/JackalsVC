import { jsonError, parseJsonBody } from "@/lib/api";
import { reportClientErrorToAdmins } from "@/lib/client-error-report.server";
import { clientErrorReportSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { data, response } = await parseJsonBody(
    request,
    clientErrorReportSchema,
    "Invalid error report",
  );
  if (response || !data) return response!;

  await reportClientErrorToAdmins(data);

  return NextResponse.json({ received: true });
}
