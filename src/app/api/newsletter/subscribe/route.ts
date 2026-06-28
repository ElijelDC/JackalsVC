import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { jsonError, parseJsonBody } from "@/lib/api";
import {
  isSubscribedToEventNewsletter,
  subscribeToEventNewsletter,
} from "@/lib/event-newsletter-subscription";
import { eventNewsletterSubscribeSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const { data, response: parseError } = await parseJsonBody(
    request,
    eventNewsletterSubscribeSchema,
    "Invalid subscription request.",
  );
  if (parseError || !data) return parseError!;

  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    if (
      userId &&
      session?.user?.email &&
      data.email.trim().toLowerCase() !== session.user.email.trim().toLowerCase()
    ) {
      return jsonError(
        "Use your account email or sign out to subscribe with a different address.",
        400,
      );
    }

    const subscription = await subscribeToEventNewsletter({
      email: data.email,
      userId,
      source: data.source,
    });

    return NextResponse.json({
      subscribed: subscription.active,
      email: subscription.email,
    });
  } catch (error) {
    console.error("Failed to subscribe to event newsletter:", error);
    return jsonError("Failed to subscribe. Please try again.", 500);
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ subscribed: false });
  }

  const subscribed = await isSubscribedToEventNewsletter(session.user.email);
  return NextResponse.json({ subscribed, email: session.user.email });
}
