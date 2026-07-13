import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
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
  const rows = (variants??[]).map(v=>{
    const p:any = pm.get(v.product_id)??{};
    const c:any = cm.get(v.color_id)??{};
    return {
      "Updated At": v.variant_updated_at ? new Date(v.variant_updated_at) : p.product_updated_at ? new Date(p.product_updated_at) : "",
      SKU: v.sku ?? "",
      Category: p.category ?? "",
      "Model Name": p.model_name ?? "",
      Color: c.color_name ?? "",
      Power: v.power ?? "",
      "Product Type": v.product_type ?? "",
      "Retail Price": Number(v.retail_price ?? 0),
      "Member Price": Number(v.member_price ?? 0),
      Active: p.is_active && v.is_orderable ? "Active" : "Inactive",
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    {wch:22},{wch:20},{wch:18},{wch:24},{wch:16},{wch:12},
    {wch:16},{wch:14},{wch:14},{wch:12}
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Product Master");
  const buffer = XLSX.write(wb,{type:"buffer",bookType:"xlsx"});
  return new NextResponse(buffer,{
    headers:{
      "Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":`attachment; filename="product-master-${new Date().toISOString().slice(0,10)}.xlsx"`,
    },
  });
}
