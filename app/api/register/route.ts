import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const b = await request.json();
    const required = ["lineUserId","nickname","fullName","shopName","phone","address","subdistrict","district","province","postalCode"];
    for (const key of required) {
      if (!String(b[key] ?? "").trim()) {
        return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบทุกช่อง" }, { status: 400 });
      }
    }

    const s = createAdminClient();
    const lineUserId = String(b.lineUserId).trim();

    const { data: existing } = await s
      .from("profiles")
      .select("id, approval_status")
      .eq("line_user_id", lineUserId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, profileId: existing.id, approvalStatus: existing.approval_status });
    }

    const { data: code } = await s.rpc("generate_customer_code");
    const { data: profile, error } = await s
      .from("profiles")
      .insert({
        line_user_id: lineUserId,
        nickname: String(b.nickname).trim(),
        full_name: String(b.fullName).trim(),
        shop_name: String(b.shopName).trim(),
        phone: String(b.phone).trim(),
        role: "customer",
        customer_tier: "normal",
        customer_code: code,
        approval_status: "pending",
        is_active: false,
      })
      .select("id")
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: error?.message ?? "สร้างบัญชีไม่สำเร็จ" }, { status: 500 });
    }

    const { error: addressError } = await s.from("customer_addresses").insert({
      profile_id: profile.id,
      receiver_name: String(b.fullName).trim(),
      phone: String(b.phone).trim(),
      address_line: String(b.address).trim(),
      subdistrict: String(b.subdistrict).trim(),
      district: String(b.district).trim(),
      province: String(b.province).trim(),
      postal_code: String(b.postalCode).trim(),
      is_default: true,
    });

    if (addressError) {
      await s.from("profiles").delete().eq("id", profile.id);
      return NextResponse.json({ error: addressError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profileId: profile.id, approvalStatus: "pending" });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "ลงทะเบียนไม่สำเร็จ" }, { status: 500 });
  }
}
