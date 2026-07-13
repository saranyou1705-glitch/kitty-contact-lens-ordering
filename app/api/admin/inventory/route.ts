import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data: variants, error } = await supabase
    .from("product_variants")
    .select("id, sku, power, retail_price, member_price, product_id, color_id, is_orderable")
    .order("sku");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const variantIds=(variants??[]).map(v=>v.id);
  const productIds=[...new Set((variants??[]).map(v=>v.product_id))];
  const colorIds=[...new Set((variants??[]).map(v=>v.color_id))];
  const [{data:balances},{data:products},{data:colors}]=await Promise.all([
    variantIds.length?supabase.from("inventory_balances").select("*").in("variant_id",variantIds):Promise.resolve({data:[]}),
    productIds.length?supabase.from("products").select("id, model_name, category").in("id",productIds):Promise.resolve({data:[]}),
    colorIds.length?supabase.from("product_colors").select("id, color_name").in("id",colorIds):Promise.resolve({data:[]}),
  ] as any);
  const b = new Map<string, any>((balances ?? []).map((x: any) => [x.variant_id, x]));
  const pm = new Map<string, any>((products ?? []).map((x: any) => [x.id, x]));
  const cm = new Map<string, any>((colors ?? []).map((x: any) => [x.id, x]));
  return NextResponse.json({items:(variants??[]).map(v=>({
    ...v, product:pm.get(v.product_id)??null, color:cm.get(v.color_id)??null,
    warehouse_qty:Number(b.get(v.id)?.warehouse_qty??0), packed_qty:Number(b.get(v.id)?.packed_qty??0),
    shipped_qty:Number(b.get(v.id)?.shipped_qty??0), delivered_qty:Number(b.get(v.id)?.delivered_qty??0),
    last_counted_at:b.get(v.id)?.last_counted_at??null, updated_at:b.get(v.id)?.updated_at??null,
  }))});
}
