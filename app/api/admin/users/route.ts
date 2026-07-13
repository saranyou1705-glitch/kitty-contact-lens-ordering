import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const s = createAdminClient();
  const { data, error } = await s.from("profiles")
    .select("id, customer_code, nickname, full_name, shop_name, phone, line_user_id, role, customer_tier, approval_status, is_active, created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const ids = (data ?? []).map(x => x.id);
  const { data: addresses } = ids.length
    ? await s.from("customer_addresses").select("profile_id, address_line, subdistrict, district, province, postal_code").in("profile_id", ids).eq("is_default", true)
    : { data: [] as any[] };
  const am = new Map((addresses ?? []).map(a => [a.profile_id, a]));
  return NextResponse.json({ items: (data ?? []).map(x => ({ ...x, address: am.get(x.id) ?? null })) });
}
