import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

type InputItem = {
  orderItemId: string;
  packedQuantity: number;
  willShip: boolean;
  isChecked: boolean;
};

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const items = (body.items ?? []) as InputItem[];
    const supabase = createAdminClient();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, fulfillment_status")
      .eq("id", id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });
    }

    const currentStatus = order.fulfillment_status ?? order.status;

    if (currentStatus !== "packing") {
      return NextResponse.json(
        { error: "แก้จำนวนได้เฉพาะออเดอร์สถานะกำลังแพ็ก" },
        { status: 400 },
      );
    }

    for (const item of items) {
      const { data: orderItem, error: orderItemError } = await supabase
        .from("order_items")
        .select("id, quantity")
        .eq("id", item.orderItemId)
        .eq("order_id", id)
        .single();

      if (orderItemError || !orderItem) {
        return NextResponse.json(
          { error: "ไม่พบรายการสินค้าในออเดอร์" },
          { status: 404 },
        );
      }

      const orderedQty = Number(orderItem.quantity);
      const packedQty = item.willShip ? Number(item.packedQuantity) : 0;

      if (
        !Number.isInteger(packedQty) ||
        packedQty < 0 ||
        packedQty > orderedQty
      ) {
        return NextResponse.json(
          { error: `จำนวนที่ส่งต้องอยู่ระหว่าง 0 ถึง ${orderedQty}` },
          { status: 400 },
        );
      }

      if (item.willShip && packedQty < 1) {
        return NextResponse.json(
          { error: "รายการที่เลือกส่งต้องมีอย่างน้อย 1 คู่" },
          { status: 400 },
        );
      }

      const { error: upsertError } = await supabase
        .from("packing_items")
        .upsert(
          {
            order_id: id,
            order_item_id: item.orderItemId,
            ordered_quantity: orderedQty,
            packed_quantity: packedQty,
            will_ship: Boolean(item.willShip),
            is_checked: Boolean(item.isChecked),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "order_item_id" },
        );

      if (upsertError) {
        return NextResponse.json(
          { error: upsertError.message },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดระหว่างบันทึกจำนวน" },
      { status: 500 },
    );
  }
}
