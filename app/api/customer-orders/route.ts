import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const profileId = new URL(request.url).searchParams.get("profileId");

  if (!profileId) {
    return NextResponse.json({ orders: [] });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_no,
      status,
      fulfillment_status,
      payment_status,
      subtotal,
      final_subtotal,
      shipping_fee,
      total_amount,
      final_total,
      paid_amount,
      outstanding_amount,
      submitted_at,
      carrier,
      tracking_no
    `)
    .eq("customer_id", profileId)
    .order("submitted_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "โหลดออเดอร์ไม่สำเร็จ" }, { status: 500 });
  }

  return NextResponse.json({ orders: data ?? [] });
}
