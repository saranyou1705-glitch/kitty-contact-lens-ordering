import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const reason = String(body.reason ?? "").trim();

  if (!reason) {
    return NextResponse.json({ error: "กรุณาระบุเหตุผลที่ปฏิเสธ" }, { status: 400 });
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

  const now = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from("orders")
    .update({
      fulfillment_status: "rejected",
      status: "cancelled",
      rejection_reason: reason,
      rejected_at: now,
      updated_at: now,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !updated) {
    return NextResponse.json(
      { error: error?.message ?? "ปฏิเสธออเดอร์ไม่สำเร็จ" },
      { status: 500 },
    );
  }

  await supabase.from("audit_logs").insert({
    action: "REJECT_ORDER",
    entity_type: "orders",
    entity_id: id,
    old_value_json: order,
    new_value_json: updated,
    reason,
  });

  return NextResponse.json({ success: true });
}
