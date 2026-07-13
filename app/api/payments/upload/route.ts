import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const orderId = String(formData.get("orderId") ?? "");

    if (!(file instanceof File) || !orderId) {
      return NextResponse.json(
        { error: "ไม่พบไฟล์สลิปหรือเลขออเดอร์" },
        { status: 400 },
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "รองรับเฉพาะไฟล์รูปภาพ" },
        { status: 400 },
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "ไฟล์ต้องมีขนาดไม่เกิน 5 MB" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const extension = file.name.split(".").pop() || "jpg";
    const path = `${orderId}/${Date.now()}.${extension}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("payment-slips")
      .upload(path, bytes, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error(uploadError);
      return NextResponse.json(
        { error: "อัปโหลดไฟล์ไม่สำเร็จ" },
        { status: 500 },
      );
    }

    const { data } = supabase.storage
      .from("payment-slips")
      .getPublicUrl(path);

    return NextResponse.json({
      success: true,
      publicUrl: data.publicUrl,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดขณะอัปโหลด" },
      { status: 500 },
    );
  }
}
