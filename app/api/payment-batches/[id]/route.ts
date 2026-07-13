import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: batch, error: batchError } = await supabase
    .from("payment_batches")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (batchError || !batch) {
    return NextResponse.json({ error: batchError?.message ?? "ไม่พบรายการชำระเงิน" }, { status: 404 });
  }

  const { data: links, error: linkError } = await supabase
    .from("payment_batch_orders")
    .select("payment_batch_id, order_id, amount_applied")
    .eq("payment_batch_id", id);

  if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });

  const orderIds = (links ?? []).map((link) => link.order_id);
  let orders: any[] = [];

  if (orderIds.length > 0) {
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_no, final_total, total_amount, outstanding_amount")
      .in("id", orderIds);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    orders = data ?? [];
  }

  const orderMap = new Map(orders.map((order) => [order.id, order]));
  return NextResponse.json({
    batch,
    items: (links ?? []).map((link) => ({ ...link, order: orderMap.get(link.order_id) ?? null })),
  });
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: batch } = await supabase.from("payment_batches").select("*").eq("id", id).maybeSingle();
  if (!batch) return NextResponse.json({ error: "ไม่พบรายการชำระเงิน" }, { status: 404 });

  const status = batch.verification_status ?? batch.status ?? "not_submitted";
  if (["approved", "paid"].includes(status)) {
    return NextResponse.json({ error: "รายการนี้ยืนยันการชำระแล้ว จึงลบไม่ได้" }, { status: 400 });
  }

  const { data: links } = await supabase.from("payment_batch_orders").select("order_id").eq("payment_batch_id", id);
  const orderIds = (links ?? []).map((item) => item.order_id);

  const { error: deleteError } = await supabase.from("payment_batches").delete().eq("id", id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  if (orderIds.length > 0) {
    await supabase.from("orders").update({ payment_status: "unpaid", updated_at: new Date().toISOString() }).in("id", orderIds).neq("payment_status", "paid");
  }

  return NextResponse.json({ success: true });
}
