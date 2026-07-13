import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("profileId");
  if (!id) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 400 });
  const s = createAdminClient();
  const { data, error } = await s.from("profiles")
    .select("id, customer_code, approval_status, customer_tier, role, is_active")
    .eq("id", id).maybeSingle();
  if (error || !data) return NextResponse.json({ error: error?.message ?? "ไม่พบผู้ใช้" }, { status: 404 });
  return NextResponse.json(data);
}
