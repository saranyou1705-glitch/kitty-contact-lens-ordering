import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { transferInventory } from "@/lib/inventory";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  const carrier = String(body.carrier ?? "").trim();
  const trackingNo = String(body.trackingNo ?? "").trim();

  if (!carrier) {
    return NextResponse.json(
      { error: "กรุณาระบุบริษัทขนส่ง" },
      { status: 400 },
    );
  }

  if (!trackingNo) {
    return NextResponse.json(
      { error: "กรุณาระบุเลขพัสดุ" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: "ไม่พบออเดอร์" },
      { status: 404 },
    );
  }

  const currentStatus = order.fulfillment_status ?? order.status;

  if (!["packed", "shipped"].includes(currentStatus)) {
    return NextResponse.json(
      { error: "บันทึกเลขพัสดุได้หลังแพ็กเสร็จแล้วเท่านั้น" },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from("orders")
    .update({
      carrier,
      tracking_no: trackingNo,
      fulfillment_status: "shipped",
      status: "shipped",
      shipped_at: order.shipped_at ?? now,
      updated_at: now,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !updated) {
    return NextResponse.json(
      { error: error?.message ?? "บันทึกการจัดส่งไม่สำเร็จ" },
      { status: 500 },
    );
  }

  const { data: shippedItems } = await supabase
    .from("order_items")
    .select("variant_id, fulfilled_quantity, quantity")
    .eq("order_id", id);

  if (currentStatus === "packed") {
    for (const item of shippedItems ?? []) {
      const qty = Number(item.fulfilled_quantity ?? item.quantity ?? 0);
      if (item.variant_id && qty > 0) {
        await transferInventory({ supabase, variantId: item.variant_id, quantity: qty, from: "packed", to: "shipped", movementType: "ship", orderId: id, actorRole: "packer", note: `จัดส่งออเดอร์ ${order.order_no}` });
      }
    }
  }

  await supabase.from("audit_logs").insert({
    action: "MARK_ORDER_SHIPPED",
    entity_type: "orders",
    entity_id: id,
    old_value_json: order,
    new_value_json: updated,
    reason: `บันทึกการจัดส่ง ${carrier} เลขพัสดุ ${trackingNo}`,
  });

  return NextResponse.json({ success: true });
}
