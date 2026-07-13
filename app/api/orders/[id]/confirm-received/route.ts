import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { transferInventory } from "@/lib/inventory";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const formData = await request.formData();

    const itemsRaw = String(formData.get("items") ?? "[]");
    const note = String(formData.get("note") ?? "").trim();
    const customerId = String(formData.get("customerId") ?? "").trim() || null;
    const files = formData.getAll("photos").filter(
      (item): item is File => item instanceof File && item.size > 0,
    );

    const items = JSON.parse(itemsRaw) as Array<{
      orderItemId: string;
      checked: boolean;
      receivedQuantity: number;
    }>;

    if (!items.length) {
      return NextResponse.json(
        { error: "กรุณาติ๊กสินค้าและจำนวนที่ได้รับ" },
        { status: 400 },
      );
    }

    if (items.some((item) => !item.checked || Number(item.receivedQuantity) < 0)) {
      return NextResponse.json(
        { error: "กรุณาติ๊กสินค้าและกรอกจำนวนที่ได้รับให้ครบ" },
        { status: 400 },
      );
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "กรุณาแนบรูปสินค้าที่ได้รับอย่างน้อย 1 รูป" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, customer_id, fulfillment_status, status, payment_status, outstanding_amount, final_total, total_amount, paid_amount")
      .eq("id", id)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { error: orderError?.message ?? "ไม่พบออเดอร์" },
        { status: 404 },
      );
    }

    const imageUrls: string[] = [];
    const now = new Date().toISOString();

    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeExt = ext.replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${id}/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;

      const { error: uploadError } = await supabase.storage
        .from("delivery-receipts")
        .upload(path, file, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          { error: uploadError.message },
          { status: 500 },
        );
      }

      const { data } = supabase.storage
        .from("delivery-receipts")
        .getPublicUrl(path);

      imageUrls.push(data.publicUrl);
    }

    const { data: receipt, error: receiptError } = await supabase
      .from("customer_receipts")
      .insert({
        order_id: id,
        customer_id: customerId ?? order.customer_id,
        note,
        image_urls: imageUrls,
      })
      .select("id")
      .single();

    if (receiptError || !receipt) {
      return NextResponse.json(
        { error: receiptError?.message ?? "บันทึกการรับสินค้าไม่สำเร็จ" },
        { status: 500 },
      );
    }

    const { error: itemError } = await supabase
      .from("customer_receipt_items")
      .insert(
        items.map((item) => ({
          receipt_id: receipt.id,
          order_item_id: item.orderItemId,
          checked: Boolean(item.checked),
          received_quantity: Number(item.receivedQuantity ?? 0),
        })),
      );

    if (itemError) {
      return NextResponse.json({ error: itemError.message }, { status: 500 });
    }

    const finalTotal = Number(order.final_total ?? order.total_amount ?? 0);
    const paidAmount = Number(order.paid_amount ?? 0);
    const outstanding = Math.max(
      0,
      Number(order.outstanding_amount ?? finalTotal - paidAmount),
    );
    const paymentStatus =
      order.payment_status === "paid" || outstanding === 0 ? "paid" : order.payment_status;

    const isPaid = paymentStatus === "paid";
    const nextFulfillmentStatus = isPaid ? "completed" : "shipped";
    const nextStatus = isPaid ? "completed" : "shipped";

    const { data: receivedOrderItems } = await supabase
      .from("order_items")
      .select("id, variant_id")
      .eq("order_id", id);
    const variantByItem = new Map((receivedOrderItems ?? []).map((x) => [x.id, x.variant_id]));
    for (const item of items) {
      const variantId = variantByItem.get(item.orderItemId);
      const qty = Number(item.receivedQuantity ?? 0);
      if (variantId && qty > 0) {
        await transferInventory({ supabase, variantId, quantity: qty, from: "shipped", to: "delivered", movementType: "receive", orderId: id, actorId: customerId, actorRole: "customer", note: "ลูกค้ายืนยันรับสินค้า" });
      }
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        customer_received_at: now,
        customer_received_note: note || null,
        customer_receipt_image_urls: imageUrls,
        fulfillment_status: nextFulfillmentStatus,
        status: nextStatus,
        payment_status: paymentStatus,
        updated_at: now,
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      completed: isPaid,
      message: "บันทึกการรับสินค้าแล้ว",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "บันทึกการรับสินค้าไม่สำเร็จ",
      },
      { status: 500 },
    );
  }
}
