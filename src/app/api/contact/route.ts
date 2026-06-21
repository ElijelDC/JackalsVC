import { jsonError, parseJsonBody } from "@/lib/api";
import { sendContactEmail } from "@/lib/send-contact-email";
import { contactSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { data, response } = await parseJsonBody(request, contactSchema);
  if (response || !data) {
    return response!;
  }

  try {
    await sendContactEmail(data);
    return NextResponse.json({ success: true });
  } catch {
    return jsonError(
      "We couldn't send your message right now. Please email us directly.",
      503,
    );
  }
}
