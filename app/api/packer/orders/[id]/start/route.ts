import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const reason = String(body.reason ?? "").trim();

    if (!reason) {
      return NextResponse.json({ error: "กรุณาระบุเหตุผล" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });
    }

    if (!["payment_confirmed", "packing"].includes(order.status)) {
      return NextResponse.json(
        { error: "เริ่มแพ็กได้เฉพาะออเดอร์ที่ชำระเงินแล้ว" },
        { status: 400 },
      );
    }

    const { data: orderItems, error: itemError } = await supabase
      .from("order_items")
      .select("id, quantity")
      .eq("order_id", id);

    if (itemError) {
      return NextResponse.json({ error: "โหลดรายการสินค้าไม่สำเร็จ" }, { status: 500 });
    }

    const rows = (orderItems ?? []).map((item) => ({
      order_id: id,
      order_item_id: item.id,
      ordered_quantity: item.quantity,
      packed_quantity: item.quantity,
      is_checked: false,
    }));

    if (rows.length > 0) {
      const { error: packingError } = await supabase
        .from("packing_items")
        .upsert(rows, { onConflict: "order_item_id", ignoreDuplicates: true });

      if (packingError) {
        return NextResponse.json({ error: "สร้างรายการแพ็กไม่สำเร็จ" }, { status: 500 });
      }
    }

    const now = new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "packing",
        packing_started_at: order.packing_started_at ?? now,
        updated_at: now,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updated) {
      return NextResponse.json({ error: "อัปเดตสถานะไม่สำเร็จ" }, { status: 500 });
    }

    await supabase.from("audit_logs").insert({
      action: "START_PACKING_AND_PRINT",
      entity_type: "orders",
      entity_id: id,
      old_value_json: order,
      new_value_json: updated,
      reason,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
