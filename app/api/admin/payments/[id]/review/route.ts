import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    const action = String(body.action ?? "");
    const reason = String(body.reason ?? "").trim();

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "คำสั่งไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: "กรุณาระบุเหตุผล" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*, orders(id, status, total_amount)")
      .eq("id", id)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลสลิป" },
        { status: 404 },
      );
    }

    const order = Array.isArray(payment.orders)
      ? payment.orders[0]
      : payment.orders;

    if (!order) {
      return NextResponse.json(
        { error: "ไม่พบคำสั่งซื้อที่เกี่ยวข้อง" },
        { status: 404 },
      );
    }

    if (payment.verification_status !== "pending") {
      return NextResponse.json(
        { error: "สลิปนี้ถูกตรวจสอบแล้ว" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    const paymentUpdate =
      action === "approve"
        ? {
            verification_status: "approved",
            verification_message: "แอดมินยืนยันการชำระเงินแล้ว",
            review_reason: reason,
            checked_at: now,
          }
        : {
            verification_status: "rejected",
            verification_message: "สลิปไม่ผ่านการตรวจสอบ กรุณาอัปโหลดใหม่",
            review_reason: reason,
            checked_at: now,
          };

    const { data: updatedPayment, error: updatePaymentError } = await supabase
      .from("payments")
      .update(paymentUpdate)
      .eq("id", id)
      .select("*")
      .single();

    if (updatePaymentError || !updatedPayment) {
      return NextResponse.json(
        { error: "อัปเดตผลตรวจสลิปไม่สำเร็จ" },
        { status: 500 },
      );
    }

    const orderUpdate =
      action === "approve"
        ? {
            status: "payment_confirmed",
            payment_confirmed_at: now,
            updated_at: now,
          }
        : {
            status: "shipping_quoted",
            updated_at: now,
          };

    const { data: updatedOrder, error: updateOrderError } = await supabase
      .from("orders")
      .update(orderUpdate)
      .eq("id", order.id)
      .select("*")
      .single();

    if (updateOrderError || !updatedOrder) {
      return NextResponse.json(
        { error: "อัปเดตสถานะออเดอร์ไม่สำเร็จ" },
        { status: 500 },
      );
    }

    await supabase.from("audit_logs").insert({
      action:
        action === "approve"
          ? "APPROVE_PAYMENT_SLIP"
          : "REJECT_PAYMENT_SLIP",
      entity_type: "payments",
      entity_id: id,
      old_value_json: payment,
      new_value_json: {
        payment: updatedPayment,
        order: updatedOrder,
      },
      reason,
    });

    return NextResponse.json({
      success: true,
      status: updatedPayment.verification_status,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" },
      { status: 500 },
    );
  }
}
