import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, customer_id, address_id")
    .eq("id", id)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "ไม่พบออเดอร์ต้นฉบับ" }, { status: 404 });
  }

  const { data: items, error: itemError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id)
    .order("created_at");

  if (itemError || !items?.length) {
    return NextResponse.json({ error: "ไม่พบสินค้าในออเดอร์ต้นฉบับ" }, { status: 400 });
  }

  return NextResponse.json({
    customerId: order.customer_id,
    addressId: order.address_id,
    items: items.map((item) => ({
      productId: item.product_id,
      variantId: item.variant_id,
      productName: item.model_name_snapshot,
      colorName: item.color_name_snapshot,
      power: item.power_snapshot,
      quantity: Number(item.original_quantity ?? item.quantity ?? 1),
      unitPrice: Number(item.unit_price ?? 0),
    })),
  });
}
