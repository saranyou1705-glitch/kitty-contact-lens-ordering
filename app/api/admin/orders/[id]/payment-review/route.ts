import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  const paymentId = String(body.paymentId ?? "");
  const action = String(body.action ?? "");
  const reason = String(body.reason ?? "").trim();

  if (!paymentId || !["approve", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "ข้อมูลไม่ถูกต้อง" },
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

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .eq("order_id", id)
    .single();

  if (!order || !payment) {
    return NextResponse.json(
      { error: "ไม่พบข้อมูลการชำระเงิน" },
      { status: 404 },
    );
  }

  const now = new Date().toISOString();

  if (action === "approve") {
    const amount = Number(payment.amount ?? 0);
    const total = Number(order.final_total ?? order.total_amount ?? 0);
    const currentPaid = Number(order.paid_amount ?? 0);
    const nextPaid = currentPaid + amount;
    const outstanding = Math.max(0, total - nextPaid);

    await supabase
      .from("payments")
      .update({
        verification_status: "approved",
        verification_message: "แอดมินยืนยันการชำระเงินแล้ว",
        review_reason: reason,
        checked_at: now,
      })
      .eq("id", paymentId);

    await supabase
      .from("orders")
      .update({
        paid_amount: nextPaid,
        outstanding_amount: outstanding,
        payment_status: outstanding === 0 ? "paid" : "partially_paid",
        updated_at: now,
      })
      .eq("id", id);
  } else {
    await supabase
      .from("payments")
      .update({
        verification_status: "rejected",
        verification_message: "สลิปไม่ผ่านการตรวจสอบ",
        review_reason: reason,
        checked_at: now,
      })
      .eq("id", paymentId);

    await supabase
      .from("orders")
      .update({
        payment_status: "unpaid",
        updated_at: now,
      })
      .eq("id", id);
  }

  return NextResponse.json({ success: true });
}
