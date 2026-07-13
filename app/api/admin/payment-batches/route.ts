import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();

  const { data: batches, error } = await supabase
    .from("payment_batches")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const customerIds = [
    ...new Set((batches ?? []).map((batch) => batch.customer_id).filter(Boolean)),
  ];
  const checkerIds = [
    ...new Set((batches ?? []).map((batch) => batch.checked_by).filter(Boolean)),
  ];
  const profileIds = [...new Set([...customerIds, ...checkerIds])];
  const batchIds = (batches ?? []).map((batch) => batch.id);

  let profiles: any[] = [];
  let links: any[] = [];
  let orders: any[] = [];

  if (profileIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, phone")
      .in("id", profileIds);
    profiles = data ?? [];
  }

  if (batchIds.length > 0) {
    const { data } = await supabase
      .from("payment_batch_orders")
      .select("payment_batch_id, order_id, amount_applied")
      .in("payment_batch_id", batchIds);
    links = data ?? [];
  }

  const orderIds = [...new Set(links.map((link) => link.order_id))];

  if (orderIds.length > 0) {
    const { data } = await supabase
      .from("orders")
      .select("id, order_no, final_total, total_amount, payment_status")
      .in("id", orderIds);
    orders = data ?? [];
  }

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const orderMap = new Map(orders.map((order) => [order.id, order]));

  return NextResponse.json({
    batches: (batches ?? []).map((batch) => ({
      ...batch,
      customer: profileMap.get(batch.customer_id) ?? null,
      checker: profileMap.get(batch.checked_by) ?? null,
      orders: links
        .filter((link) => link.payment_batch_id === batch.id)
        .map((link) => ({
          ...link,
          order: orderMap.get(link.order_id) ?? null,
        })),
    })),
  });
}
