import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const active = Boolean(body.active);
  const s = createAdminClient();

  const { data: variant, error } = await s
    .from("product_variants")
    .update({ is_orderable: active, variant_updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, product_id")
    .single();

  if (error || !variant) {
    return NextResponse.json({ error: error?.message ?? "อัปเดตสินค้าไม่สำเร็จ" }, { status: 500 });
  }

  if (active) {
    await s.from("products").update({ is_active: true, product_updated_at: new Date().toISOString() }).eq("id", variant.product_id);
  } else {
    const { count } = await s
      .from("product_variants")
      .select("id", { count: "exact", head: true })
      .eq("product_id", variant.product_id)
      .eq("is_orderable", true);
    if ((count ?? 0) === 0) {
      await s.from("products").update({ is_active: false, product_updated_at: new Date().toISOString() }).eq("id", variant.product_id);
    }
  }

  return NextResponse.json({ success: true, active });
}
