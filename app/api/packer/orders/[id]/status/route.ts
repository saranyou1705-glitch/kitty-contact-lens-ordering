import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    const action = String(body.action ?? "");
    const reason = String(body.reason ?? "").trim();

    if (!["start_packing", "mark_packed"].includes(action)) {
      return NextResponse.json({ error: "คำสั่งไม่ถูกต้อง" }, { status: 400 });
    }

    if (!reason) {
      return NextResponse.json({ error: "กรุณาระบุเหตุผล" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: current, error: currentError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (currentError || !current) {
      return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });
    }

    const now = new Date().toISOString();

    let updateData: Record<string, unknown>;

    if (action === "start_packing") {
      if (current.status !== "payment_confirmed") {
        return NextResponse.json(
          { error: "เริ่มแพ็กได้เฉพาะออเดอร์ที่ยืนยันการชำระเงินแล้ว" },
          { status: 400 },
        );
      }

      updateData = {
        status: "packing",
        packing_started_at: now,
        updated_at: now,
      };
    } else {
      if (current.status !== "packing") {
        return NextResponse.json(
          { error: "ทำเครื่องหมายแพ็กเสร็จได้เฉพาะออเดอร์ที่กำลังแพ็ก" },
          { status: 400 },
        );
      }

      updateData = {
        status: "packed",
        packed_at: now,
        updated_at: now,
      };
    }

    const { data: updated, error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updated) {
      return NextResponse.json({ error: "อัปเดตสถานะไม่สำเร็จ" }, { status: 500 });
    }

    await supabase.from("audit_logs").insert({
      action: action === "start_packing" ? "START_PACKING" : "MARK_PACKED",
      entity_type: "orders",
      entity_id: id,
      old_value_json: current,
      new_value_json: updated,
      reason,
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่" }, { status: 500 });
  }
}
