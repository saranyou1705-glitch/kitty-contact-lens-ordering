import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  const shippingFee = Number(body.shippingFee);
  const carrier = String(body.carrier ?? "").trim();
  const adminNote = String(body.adminNote ?? "").trim();

  if (!Number.isFinite(shippingFee) || shippingFee < 0) {
    return NextResponse.json({ error: "ค่าจัดส่งไม่ถูกต้อง" }, { status: 400 });
  }

  if (!carrier) {
    return NextResponse.json({ error: "กรุณาเลือกช่องทางจัดส่ง" }, { status: 400 });
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

  const finalSubtotal = Number(order.final_subtotal ?? order.subtotal ?? 0);
  const finalTotal = finalSubtotal + shippingFee;
  const paidAmount = Number(order.paid_amount ?? 0);
  const outstandingAmount = Math.max(0, finalTotal - paidAmount);
  const now = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from("orders")
    .update({
      shipping_fee: shippingFee,
      carrier,
      admin_note: adminNote || null,
      final_total: finalTotal,
      total_amount: finalTotal,
      outstanding_amount: outstandingAmount,
      updated_at: now,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !updated) {
    return NextResponse.json(
      { error: error?.message ?? "บันทึกค่าจัดส่งไม่สำเร็จ" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
