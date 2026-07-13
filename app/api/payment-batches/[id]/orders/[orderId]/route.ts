import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string; orderId: string }> };

export async function DELETE(_: Request, { params }: Params) {
  const { id, orderId } = await params;
  const supabase = createAdminClient();

  const { data: batch } = await supabase.from("payment_batches").select("*").eq("id", id).maybeSingle();
  if (!batch) return NextResponse.json({ error: "ไม่พบรายการชำระเงิน" }, { status: 404 });

  const status = batch.verification_status ?? batch.status ?? "not_submitted";
  if (["approved", "paid"].includes(status)) {
    return NextResponse.json({ error: "รายการนี้ยืนยันการชำระแล้ว จึงแก้ไขไม่ได้" }, { status: 400 });
  }

  const { error } = await supabase.from("payment_batch_orders").delete().eq("payment_batch_id", id).eq("order_id", orderId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("orders").update({ payment_status: "unpaid", updated_at: new Date().toISOString() }).eq("id", orderId).neq("payment_status", "paid");

  const { data: remaining } = await supabase.from("payment_batch_orders").select("amount_applied").eq("payment_batch_id", id);
  const total = (remaining ?? []).reduce((sum, item) => sum + Number(item.amount_applied ?? 0), 0);

  if ((remaining ?? []).length === 0) {
    await supabase.from("payment_batches").delete().eq("id", id);
  } else {
    await supabase.from("payment_batches").update({ total_amount: total, updated_at: new Date().toISOString() }).eq("id", id);
  }

  return NextResponse.json({ success: true, remainingCount: remaining?.length ?? 0, total });
}
