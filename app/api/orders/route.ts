import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type CartItem = {
  productId: string;
  colorId: string;
  variantId: string;
  productName: string;
  colorName: string;
  power: string;
  unitPrice: number;
  quantity: number;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const customerId = String(body.customerId ?? "");
    const addressId = String(body.addressId ?? "");
    const customerNote = String(body.customerNote ?? "").trim();
    const items = (body.items ?? []) as CartItem[];

    if (!customerId || !addressId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "ข้อมูลคำสั่งซื้อไม่ครบถ้วน" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    const { data: customer } = await supabase
      .from("profiles")
      .select("approval_status, customer_tier, is_active")
      .eq("id", customerId)
      .maybeSingle();

    if (!customer || customer.approval_status !== "approved" || !customer.is_active) {
      return NextResponse.json({ error: "บัญชียังไม่ได้รับอนุมัติ" }, { status: 403 });
    }

    const { data: visibility } = await supabase
      .from("customer_stock_visibility_settings")
      .select("*")
      .eq("id", 1)
      .single();

    const visibilityPercent = Number(
      customer.customer_tier === "vvip"
        ? visibility?.vvip_percent
        : customer.customer_tier === "vip"
          ? visibility?.vip_percent
          : visibility?.normal_percent ?? 25,
    );

    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return NextResponse.json({ error: "จำนวนสินค้าไม่ถูกต้อง" }, { status: 400 });
      }

      const { data: variant } = await supabase
        .from("product_variants")
        .select("id, product_id, is_orderable, retail_price")
        .eq("id", item.variantId)
        .maybeSingle();

      if (!variant || !variant.is_orderable) {
        return NextResponse.json(
          { error: `${item.productName} ${item.power} ปิดการขายแล้ว` },
          { status: 400 },
        );
      }

      const { data: product } = await supabase
        .from("products")
        .select("is_active")
        .eq("id", variant.product_id)
        .maybeSingle();

      if (!product?.is_active) {
        return NextResponse.json(
          { error: `${item.productName} ปิดการขายแล้ว` },
          { status: 400 },
        );
      }

      const { data: balance } = await supabase
        .from("inventory_balances")
        .select("warehouse_qty")
        .eq("variant_id", item.variantId)
        .maybeSingle();

      const actualAvailable = Number(balance?.warehouse_qty ?? 0);
      const available = Math.floor(actualAvailable * visibilityPercent / 100);
      if (available < quantity) {
        return NextResponse.json(
          { error: `${item.productName} ${item.power} สต๊อคไม่พอ มี ${available} คู่` },
          { status: 400 },
        );
      }

      item.unitPrice = Number(variant.retail_price);
    }

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
      0,
    );

    const { data: orderNoData, error: orderNoError } = await supabase.rpc(
      "generate_order_no",
    );

    if (orderNoError || !orderNoData) {
      return NextResponse.json(
        { error: "ไม่สามารถสร้างเลขออเดอร์ได้" },
        { status: 500 },
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_no: orderNoData,
        customer_id: customerId,
        address_id: addressId,
        status: "submitted",
        subtotal,
        shipping_fee: null,
        total_amount: null,
        customer_note: customerNote || null,
      })
      .select("id, order_no")
      .single();

    if (orderError || !order) {
      console.error(orderError);
      return NextResponse.json(
        { error: "ไม่สามารถสร้างคำสั่งซื้อได้" },
        { status: 500 },
      );
    }

    const rows = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      color_id: item.colorId,
      variant_id: item.variantId,
      model_name_snapshot: item.productName,
      color_name_snapshot: item.colorName,
      power_snapshot: item.power,
      unit_price: Number(item.unitPrice),
      quantity: Number(item.quantity),
      line_total: Number(item.unitPrice) * Number(item.quantity),
    }));

    const { error: itemError } = await supabase.from("order_items").insert(rows);

    if (itemError) {
      console.error(itemError);
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "ไม่สามารถบันทึกรายการสินค้าได้" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNo: order.order_no,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" },
      { status: 500 },
    );
  }
}
