import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireSession } from "@/lib/api";
import {
  isSubscribedToEventNewsletter,
  subscribeToEventNewsletter,
  unsubscribeFromEventNewsletter,
} from "@/lib/event-newsletter-subscription";
import { eventNewsletterPreferenceSchema } from "@/lib/validations";

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;

  const subscribed = await isSubscribedToEventNewsletter(session!.user.email!);
  return NextResponse.json({ subscribed });
}

export async function PATCH(request: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    eventNewsletterPreferenceSchema,
    "Invalid newsletter preference.",
  );
  if (parseError || !data) return parseError!;

  try {
    const email = session!.user.email!;
    const userId = session!.user.id;

    if (data.subscribed) {
      const subscription = await subscribeToEventNewsletter({
        email,
        userId,
        source: "profile",
      });
      return NextResponse.json({ subscribed: subscription.active });
    }

    const subscription = await unsubscribeFromEventNewsletter(email);
    return NextResponse.json({ subscribed: subscription.active });
  } catch (error) {
    console.error("Failed to update newsletter preference:", error);
    return jsonError("Failed to update newsletter preference", 500);
  }
}
