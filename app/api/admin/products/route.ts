import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const s = createAdminClient();
  const { data: variants, error } = await s
    .from("product_variants")
    .select("id, sku, power, product_type, retail_price, member_price, is_orderable, product_id, color_id, variant_updated_at")
    .order("sku");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const productIds = [...new Set((variants ?? []).map(v => v.product_id))];
  const colorIds = [...new Set((variants ?? []).map(v => v.color_id))];
  const [{data: products},{data: colors}] = await Promise.all([
    productIds.length ? s.from("products").select("id, model_name, category, is_active, product_updated_at").in("id", productIds) : Promise.resolve({data:[]}),
    colorIds.length ? s.from("product_colors").select("id, color_name").in("id", colorIds) : Promise.resolve({data:[]}),
  ] as any);
  const pm = new Map((products??[]).map((x:any)=>[x.id,x]));
  const cm = new Map((colors??[]).map((x:any)=>[x.id,x]));
  return NextResponse.json({ items:(variants??[]).map(v=>({
    ...v,
    product: pm.get(v.product_id)??null,
    color: cm.get(v.color_id)??null,
  }))});
}
