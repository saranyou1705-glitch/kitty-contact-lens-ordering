import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get("profileId");

  if (!profileId) {
    return NextResponse.json({ orders: [], batches: [] });
  }

  const supabase = createAdminClient();

  const [{ data: orders, error: orderError }, { data: batches, error: batchError }] =
    await Promise.all([
      supabase
        .from("orders")
        .select(`
          id,
          order_no,
          status,
          fulfillment_status,
          payment_status,
          final_total,
          total_amount,
          paid_amount,
          outstanding_amount,
          created_at
        `)
        .eq("customer_id", profileId)
        .order("created_at", { ascending: false }),
      supabase
        .from("payment_batches")
        .select("*")
        .eq("customer_id", profileId)
        .order("created_at", { ascending: false }),
    ]);

  if (orderError || batchError) {
    return NextResponse.json(
      { error: orderError?.message ?? batchError?.message },
      { status: 500 },
    );
  }

  const batchIds = (batches ?? []).map((batch) => batch.id);
  let links: Array<{
    payment_batch_id: string;
    order_id: string;
    amount_applied: number;
  }> = [];

  if (batchIds.length > 0) {
    const { data, error } = await supabase
      .from("payment_batch_orders")
      .select("payment_batch_id, order_id, amount_applied")
      .in("payment_batch_id", batchIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    links = data ?? [];
  }

  const orderMap = new Map((orders ?? []).map((order) => [order.id, order]));

  return NextResponse.json({
    orders: orders ?? [],
    batches: (batches ?? []).map((batch) => {
      const batchLinks = links.filter(
        (link) => link.payment_batch_id === batch.id,
      );

      return {
        ...batch,
        orders: batchLinks.map((link) => ({
          orderId: link.order_id,
          orderNo: orderMap.get(link.order_id)?.order_no ?? link.order_id,
          amountApplied: Number(link.amount_applied ?? 0),
        })),
        orderIds: batchLinks.map((link) => link.order_id),
        calculatedTotal: batchLinks.reduce(
          (sum, link) => sum + Number(link.amount_applied ?? 0),
          0,
        ),
      };
    }),
  });
}
