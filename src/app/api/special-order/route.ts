import {
  jsonServerError,
  parseJsonBody,
  requireSession,
} from "@/lib/api";
import { specialOrderPaymentPath } from "@/lib/special-order-payment-access";
import { SpecialOrderAlreadyExistsError } from "@/lib/special-order-member";
import { serializeSpecialOrder } from "@/lib/special-order-response-config";
import { submitSpecialOrder } from "@/lib/submit-special-order";
import { specialOrderSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { session, response: authResponse } = await requireSession();
  if (authResponse || !session?.user?.id) return authResponse!;

  const { data, response } = await parseJsonBody(request, specialOrderSchema);
  if (response || !data) return response!;

  // Always bind the order to the signed-in account email.
  const payload = {
    ...data,
    email: (session.user.email ?? data.email).toLowerCase(),
  };

  try {
    const order = await submitSpecialOrder(payload, {
      userId: session.user.id,
    });
    return NextResponse.json({
      success: true,
      message: "Special order received.",
      paymentUrl: specialOrderPaymentPath(order.paymentToken),
      order: serializeSpecialOrder(order),
    });
  } catch (error) {
    if (error instanceof SpecialOrderAlreadyExistsError) {
      return NextResponse.json(
        {
          error: error.message,
          paymentUrl: error.paymentUrl,
          order: error.existing,
        },
        { status: 409 },
      );
    }
    return jsonServerError(
      "We couldn't save your special order right now. Please try again.",
      { route: "POST /api/special-order", cause: error },
    );
  }
}
