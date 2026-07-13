import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 400 });

  const supabase = createAdminClient();

  const { data: batch } = await supabase
    .from("payment_batches")
    .select("*")
    .eq("id", id)
    .single();

  const { data: orders } = await supabase
    .from("payment_batch_orders")
    .select("id, amount_applied, orders(order_no)")
    .eq("payment_batch_id", id);

  return NextResponse.json({ batch, orders: orders ?? [] });
}
