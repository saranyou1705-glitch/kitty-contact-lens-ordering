import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const s = createAdminClient();
  const { data, error } = await s.from("customer_stock_visibility_settings").select("*").eq("id", 1).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const b = await request.json();
  const values = ["normalPercent","vipPercent","vvipPercent"].map(k => Number(b[k]));
  if (values.some(v => !Number.isFinite(v) || v < 0 || v > 100)) {
    return NextResponse.json({ error: "เปอร์เซ็นต์ต้องอยู่ระหว่าง 0–100" }, { status: 400 });
  }
  const s = createAdminClient();
  const { data, error } = await s.from("customer_stock_visibility_settings").upsert({
    id: 1,
    normal_percent: values[0],
    vip_percent: values[1],
    vvip_percent: values[2],
    updated_at: new Date().toISOString(),
  }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
