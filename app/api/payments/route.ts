import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const orderId = String(body.orderId ?? "");
    const slipImageUrl = String(body.slipImageUrl ?? "");
    const amount = Number(body.amount);

    if (!orderId || !slipImageUrl || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "ข้อมูลการชำระเงินไม่ครบถ้วน" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, total_amount")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "ไม่พบคำสั่งซื้อ" },
        { status: 404 },
      );
    }

    if (order.status !== "shipping_quoted") {
      return NextResponse.json(
        { error: "ออเดอร์นี้ยังไม่พร้อมรับชำระเงิน" },
        { status: 400 },
      );
    }

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        order_id: orderId,
        slip_image_url: slipImageUrl,
        amount,
        verification_status: "pending",
        verification_message:
          Number(order.total_amount) === amount
            ? "ยอดเงินตรงกับยอดออเดอร์ รอแอดมินตรวจสอบ"
            : "ยอดเงินไม่ตรงกับยอดออเดอร์ กรุณาตรวจสอบ",
      })
      .select("id")
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: "บันทึกสลิปไม่สำเร็จ" },
        { status: 500 },
      );
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "payment_uploaded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      return NextResponse.json(
        { error: "อัปเดตสถานะออเดอร์ไม่สำเร็จ" },
        { status: 500 },
      );
    }

    await supabase.from("audit_logs").insert({
      action: "UPLOAD_PAYMENT_SLIP",
      entity_type: "orders",
      entity_id: orderId,
      new_value_json: {
        payment_id: payment.id,
        slip_image_url: slipImageUrl,
        amount,
      },
      reason: "ลูกค้าอัปโหลดสลิปชำระเงิน",
    });

    return NextResponse.json({ success: true, paymentId: payment.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" },
      { status: 500 },
    );
  }
}
