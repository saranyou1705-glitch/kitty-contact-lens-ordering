import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json();
  const customerId = String(body.customerId ?? "");
  const orderIds = Array.isArray(body.orderIds) ? body.orderIds.map(String) : [];

  if (!customerId || orderIds.length === 0) {
    return NextResponse.json({ error: "กรุณาเลือกออเดอร์อย่างน้อย 1 รายการ" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, customer_id, final_total, total_amount, paid_amount, outstanding_amount, payment_status")
    .in("id", orderIds)
    .eq("customer_id", customerId);

  if (error || !orders || orders.length !== orderIds.length) {
    return NextResponse.json({ error: "ข้อมูลออเดอร์ไม่ถูกต้อง" }, { status: 400 });
  }

  const invalid = orders.find((order) =>
    ["paid", "payment_pending"].includes(order.payment_status)
  );

  if (invalid) {
    return NextResponse.json({ error: "มีออเดอร์ที่ชำระแล้วหรือกำลังรอตรวจสอบ" }, { status: 400 });
  }

  const totalAmount = orders.reduce((sum, order) => {
    const outstanding = Number(
      order.outstanding_amount ??
      (Number(order.final_total ?? order.total_amount ?? 0) - Number(order.paid_amount ?? 0))
    );
    return sum + Math.max(0, outstanding);
  }, 0);

  if (totalAmount <= 0) {
    return NextResponse.json({ error: "ไม่มียอดคงค้างให้ชำระ" }, { status: 400 });
  }

  const { data: batchNo } = await supabase.rpc("generate_payment_batch_no");

  const { data: batch, error: batchError } = await supabase
    .from("payment_batches")
    .insert({
      batch_no: batchNo,
      customer_id: customerId,
      status: "draft",
      total_amount: totalAmount,
      verification_status: "not_submitted",
    })
    .select("id, batch_no")
    .single();

  if (batchError || !batch) {
    return NextResponse.json({ error: "สร้างชุดชำระเงินไม่สำเร็จ" }, { status: 500 });
  }

  const rows = orders.map((order) => ({
    payment_batch_id: batch.id,
    order_id: order.id,
    amount_applied: Math.max(
      0,
      Number(
        order.outstanding_amount ??
        (Number(order.final_total ?? order.total_amount ?? 0) - Number(order.paid_amount ?? 0))
      )
    ),
  }));

  await supabase.from("payment_batch_orders").insert(rows);

  await supabase
    .from("orders")
    .update({ payment_status: "payment_pending", updated_at: new Date().toISOString() })
    .in("id", orderIds);

  return NextResponse.json({ success: true, batchId: batch.id });
}
