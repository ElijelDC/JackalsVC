import { jsonServerError, parseJsonBody } from "@/lib/api";
import { kitOrderPaymentPath } from "@/lib/kit-order-payment-access";
import { submitKitOrder } from "@/lib/submit-kit-order";
import { kitOrderSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { data, response } = await parseJsonBody(request, kitOrderSchema);
  if (response || !data) return response!;

  try {
    const order = await submitKitOrder(data);
    return NextResponse.json({
      success: true,
      message:
        "Kit order received — thanks. Use the link below to pay and upload your receipt.",
      paymentUrl: kitOrderPaymentPath(order.paymentToken),
    });
  } catch (error) {
    return jsonServerError(
      "We couldn't save your kit order right now. Please try again in a few minutes.",
      { route: "POST /api/kit-order", cause: error },
    );
  }
}
