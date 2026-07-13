import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "กรุณาเลือกไฟล์สลิป" }, { status: 400 });
  }

  if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "ไฟล์ต้องเป็นรูปภาพขนาดไม่เกิน 5 MB" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `batches/${id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("payment-slips")
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: "อัปโหลดสลิปไม่สำเร็จ" }, { status: 500 });
  }

  const { data: publicData } = supabase.storage
    .from("payment-slips")
    .getPublicUrl(path);

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("payment_batches")
    .update({
      status: "submitted",
      verification_status: "pending",
      slip_image_url: publicData.publicUrl,
      submitted_at: now,
      updated_at: now,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "บันทึกสลิปไม่สำเร็จ" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
