import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data: variants, error } = await supabase
    .from("product_variants")
    .select("id, sku, power, retail_price, member_price, product_id, color_id, is_orderable")
    .order("sku");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const variantIds = (variants ?? []).map((v) => v.id);
  const productIds = [...new Set((variants ?? []).map((v) => v.product_id))];
  const colorIds = [...new Set((variants ?? []).map((v) => v.color_id))];

  const [{ data: balances }, { data: products }, { data: colors }] =
    await Promise.all([
      variantIds.length
        ? supabase.from("inventory_balances").select("*").in("variant_id", variantIds)
        : Promise.resolve({ data: [] }),
      productIds.length
        ? supabase.from("products").select("id, model_name, category, is_active").in("id", productIds)
        : Promise.resolve({ data: [] }),
      colorIds.length
        ? supabase.from("product_colors").select("id, color_name").in("id", colorIds)
        : Promise.resolve({ data: [] }),
    ] as any);

  const bm = new Map((balances ?? []).map((x: any) => [x.variant_id, x]));
  const pm = new Map((products ?? []).map((x: any) => [x.id, x]));
  const cm = new Map((colors ?? []).map((x: any) => [x.id, x]));

  const rows = (variants ?? []).map((v) => {
    const b: any = bm.get(v.id) ?? {};
    const p: any = pm.get(v.product_id) ?? {};
    const c: any = cm.get(v.color_id) ?? {};
    return {
      SKU: v.sku ?? "",
      Category: p.category ?? "",
      "Model Name": p.model_name ?? "",
      Color: c.color_name ?? "",
      Power: v.power ?? "",
      Active: p.is_active && v.is_orderable ? "Active" : "Inactive",
      "Warehouse Qty": Number(b.warehouse_qty ?? 0),
      "Packed Qty": Number(b.packed_qty ?? 0),
      "Shipped Qty": Number(b.shipped_qty ?? 0),
      "Delivered Qty": Number(b.delivered_qty ?? 0),
      "Last Counted At": b.last_counted_at ? new Date(b.last_counted_at) : "",
      "Updated At": b.updated_at ? new Date(b.updated_at) : "",
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 20 }, { wch: 18 }, { wch: 24 }, { wch: 16 }, { wch: 12 },
    { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    { wch: 22 }, { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Inventory");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="inventory-export-${new Date().toISOString().slice(0,10)}.xlsx"`,
    },
  });
}
