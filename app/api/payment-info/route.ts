import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "ไม่พบเลขออเดอร์" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, order_no, status, subtotal, shipping_fee, total_amount")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
  }

  const { data: settings } = await supabase
    .from("store_settings")
    .select("store_name, bank_name, bank_account_name, bank_account_no, promptpay_no, payment_qr_url")
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ order, settings });
}
