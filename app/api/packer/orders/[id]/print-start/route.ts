import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: Params) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });
  }

  if (!["submitted", "shipping_quoted", "packing"].includes(order.fulfillment_status)) {
    return NextResponse.json(
      { error: "ออเดอร์นี้ไม่อยู่ในสถานะที่เริ่มแพ็กได้" },
      { status: 400 },
    );
  }

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("id, quantity")
    .eq("order_id", id);

  const rows = (orderItems ?? []).map((item) => ({
    order_id: id,
    order_item_id: item.id,
    ordered_quantity: item.quantity,
    packed_quantity: item.quantity,
    will_ship: true,
    is_checked: false,
  }));

  if (rows.length) {
    await supabase
      .from("packing_items")
      .upsert(rows, { onConflict: "order_item_id", ignoreDuplicates: true });
  }

  const now = new Date().toISOString();

  const { data: updated } = await supabase
    .from("orders")
    .update({
      fulfillment_status: "packing",
      status: "packing",
      packing_started_at: order.packing_started_at ?? now,
      updated_at: now,
    })
    .eq("id", id)
    .select("*")
    .single();

  await supabase.from("audit_logs").insert({
    action: "PRINT_PACKING_LIST_AND_START_PACKING",
    entity_type: "orders",
    entity_id: id,
    old_value_json: order,
    new_value_json: updated,
    reason: "ระบบเริ่มแพ็กอัตโนมัติเมื่อพิมพ์ใบแพ็ก",
  });

  return NextResponse.json({ success: true });
}
