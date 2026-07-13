import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const profileId = url.searchParams.get("profileId");

  if (!profileId) {
    return NextResponse.json({ error: "ไม่พบรหัสลูกค้า" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("profile_id", profileId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "โหลดที่อยู่ไม่สำเร็จ" }, { status: 500 });
  }

  return NextResponse.json({ addresses: data ?? [] });
}
