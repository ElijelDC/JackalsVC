import { jsonServerError, parseJsonBody } from "@/lib/api";
import { merchandiseOrderPaymentPath } from "@/lib/merchandise-order-payment-access";
import { submitMerchandiseOrder } from "@/lib/submit-merchandise-order";
import { merchandiseOrderSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { data, response } = await parseJsonBody(request, merchandiseOrderSchema);
  if (response || !data) return response!;
  try {
    const order = await submitMerchandiseOrder(data);
    return NextResponse.json({
      success: true,
      message: "Merchandise order received.",
      paymentUrl: merchandiseOrderPaymentPath(order.paymentToken),
    });
  } catch (error) {
    return jsonServerError(
      "We couldn't save your merchandise order right now. Please try again.",
      { route: "POST /api/merchandise-order", cause: error },
    );
  }
}
