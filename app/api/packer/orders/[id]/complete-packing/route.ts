import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { transferInventory } from "@/lib/inventory";

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
      .select("*")
      .eq("id", id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });
    }

    const currentStatus = order.fulfillment_status ?? order.status;

    if (currentStatus !== "packing") {
      return NextResponse.json(
        { error: "ยืนยันแพ็กเสร็จได้เฉพาะสถานะกำลังแพ็ก" },
        { status: 400 },
      );
    }

    if (!items.length) {
      return NextResponse.json(
        { error: "ไม่พบรายการสินค้าที่ต้องแพ็ก" },
        { status: 400 },
      );
    }

    for (const item of items) {
      if (!item.isChecked) {
        return NextResponse.json(
          { error: "กรุณาติ๊กตรวจสอบสินค้าทุกรายการ" },
          { status: 400 },
        );
      }

      const { data: orderItem, error: orderItemError } = await supabase
        .from("order_items")
        .select("*")
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
          { error: "จำนวนที่ส่งไม่ถูกต้อง" },
          { status: 400 },
        );
      }

      const unitPrice = Number(orderItem.unit_price ?? 0);
      const adjustedLineTotal = unitPrice * packedQty;

      const { error: packingError } = await supabase
        .from("packing_items")
        .upsert(
          {
            order_id: id,
            order_item_id: item.orderItemId,
            ordered_quantity: orderedQty,
            packed_quantity: packedQty,
            will_ship: Boolean(item.willShip),
            is_checked: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "order_item_id" },
        );

      if (packingError) {
        return NextResponse.json(
          { error: packingError.message },
          { status: 500 },
        );
      }

      const { error: updateItemError } = await supabase
        .from("order_items")
        .update({
          original_quantity: orderItem.original_quantity ?? orderedQty,
          fulfilled_quantity: packedQty,
          original_line_total:
            orderItem.original_line_total ?? unitPrice * orderedQty,
          adjusted_line_total: adjustedLineTotal,
          fulfillment_changed: packedQty !== orderedQty,
        })
        .eq("id", item.orderItemId);

      if (updateItemError) {
        return NextResponse.json(
          { error: updateItemError.message },
          { status: 500 },
        );
      }

      if (packedQty > 0 && orderItem.variant_id) {
        await transferInventory({
          supabase, variantId: orderItem.variant_id, quantity: packedQty,
          from: "warehouse", to: "packed", movementType: "pack",
          orderId: id, actorRole: "packer", note: `แพ็กออเดอร์ ${order.order_no}`,
        });
      }
    }

    const { data: revisedItems, error: revisedError } = await supabase
      .from("order_items")
      .select("adjusted_line_total, line_total")
      .eq("order_id", id);

    if (revisedError) {
      return NextResponse.json(
        { error: revisedError.message },
        { status: 500 },
      );
    }

    const finalSubtotal = (revisedItems ?? []).reduce(
      (sum, item) =>
        sum + Number(item.adjusted_line_total ?? item.line_total ?? 0),
      0,
    );

    const shippingFee = Number(order.shipping_fee ?? 0);
    const finalTotal = finalSubtotal + shippingFee;
    const paidAmount = Number(order.paid_amount ?? 0);
    const outstandingAmount = Math.max(0, finalTotal - paidAmount);
    const now = new Date().toISOString();

    const { data: updated, error: updateOrderError } = await supabase
      .from("orders")
      .update({
        fulfillment_status: "packed",
        status: "packed",
        final_subtotal: finalSubtotal,
        final_total: finalTotal,
        subtotal: finalSubtotal,
        total_amount: finalTotal,
        outstanding_amount: outstandingAmount,
        payment_status:
          outstandingAmount === 0
            ? "paid"
            : paidAmount > 0
              ? "partially_paid"
              : "unpaid",
        packed_at: now,
        updated_at: now,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateOrderError || !updated) {
      return NextResponse.json(
        { error: updateOrderError?.message ?? "บันทึกแพ็กเสร็จไม่สำเร็จ" },
        { status: 500 },
      );
    }

    await supabase.from("audit_logs").insert({
      action: "COMPLETE_PACKING_WITH_FINAL_QUANTITY",
      entity_type: "orders",
      entity_id: id,
      old_value_json: order,
      new_value_json: updated,
      reason: "บันทึกจำนวนสินค้าที่จัดส่งจริง",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดระหว่างยืนยันแพ็กเสร็จ" },
      { status: 500 },
    );
  }
}
