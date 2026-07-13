import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get("profileId");

  if (!profileId) {
    return NextResponse.json({ orders: [] });
  }

  const supabase = createAdminClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_no,
      status,
      fulfillment_status,
      payment_status,
      paid_amount,
      final_total,
      total_amount,
      outstanding_amount,
      created_at,
      submitted_at,
      carrier,
      tracking_no,
      rejection_reason,
      customer_received_at,
      customer_received_note
    `)
    .eq("customer_id", profileId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orderIds = (orders ?? []).map((order) => order.id);
  let links: any[] = [];
  let batches: any[] = [];

  if (orderIds.length > 0) {
    const { data: linkData } = await supabase
      .from("payment_batch_orders")
      .select("payment_batch_id, order_id, amount_applied")
      .in("order_id", orderIds);

    links = linkData ?? [];
  }

  const batchIds = [...new Set(links.map((link) => link.payment_batch_id))];

  if (batchIds.length > 0) {
    const { data: batchData } = await supabase
      .from("payment_batches")
      .select(`
        id,
        status,
        verification_status,
        slip_image_url,
        checked_at,
        updated_at
      `)
      .in("id", batchIds);

    batches = batchData ?? [];
  }

  const batchMap = new Map(batches.map((batch) => [batch.id, batch]));

  const enriched = (orders ?? []).map((order) => {
    const related = links
      .filter((link) => link.order_id === order.id)
      .map((link) => ({
        ...link,
        batch: batchMap.get(link.payment_batch_id),
      }))
      .filter((item) => item.batch);

    const approved = related.filter((item) =>
      ["approved", "paid"].includes(
        item.batch.verification_status ?? item.batch.status ?? "",
      ),
    );

    const pending = related.filter((item) =>
      [
        "pending",
        "payment_pending",
        "pending_review",
        "under_review",
      ].includes(item.batch.verification_status ?? item.batch.status ?? ""),
    );

    const approvedAmount = approved.reduce(
      (sum, item) => sum + Number(item.amount_applied ?? 0),
      0,
    );

    const finalTotal = Number(order.final_total ?? order.total_amount ?? 0);
    const paidAmount = Math.max(Number(order.paid_amount ?? 0), approvedAmount);
    const outstanding = Math.max(0, finalTotal - paidAmount);

    let paymentStatus = order.payment_status ?? "unpaid";

    if (outstanding === 0 && finalTotal > 0) {
      paymentStatus = "paid";
    } else if (paidAmount > 0) {
      paymentStatus = "partially_paid";
    } else if (pending.length > 0) {
      paymentStatus = "payment_pending";
    }

    return {
      ...order,
      payment_status: paymentStatus,
      paid_amount: paidAmount,
      outstanding_amount: outstanding,
    };
  });

  return NextResponse.json({ orders: enriched });
}
