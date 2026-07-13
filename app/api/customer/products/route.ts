import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const profileId = new URL(request.url).searchParams.get("profileId");
  if (!profileId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบผ่าน LINE LIFF" }, { status: 401 });

  const s = createAdminClient();
  const { data: profile } = await s.from("profiles")
    .select("approval_status, customer_tier, is_active")
    .eq("id", profileId).maybeSingle();

  if (!profile || profile.approval_status !== "approved" || !profile.is_active) {
    return NextResponse.json({ error: "บัญชียังไม่ได้รับอนุมัติ", redirect: "/account-status" }, { status: 403 });
  }

  const { data: settings } = await s.from("customer_stock_visibility_settings").select("*").eq("id",1).single();
  const tier = profile.customer_tier ?? "normal";
  const percent = Number(
    tier === "vvip" ? settings?.vvip_percent :
    tier === "vip" ? settings?.vip_percent :
    settings?.normal_percent ?? 25
  );

  const [{data: products,error},{data:variants},{data:colors},{data:balances}] = await Promise.all([
    s.from("products").select("id, model_name, description, image_url, is_active, sort_order").eq("is_active",true).order("sort_order"),
    s.from("product_variants").select("id, product_id, color_id, sku, power, retail_price, member_price, is_orderable").eq("is_orderable",true),
    s.from("product_colors").select("id, product_id, color_name, is_active").eq("is_active",true),
    s.from("inventory_balances").select("variant_id, warehouse_qty"),
  ]);

  if (error) return NextResponse.json({ error:error.message },{status:500});
  const cm = new Map((colors??[]).map(x=>[x.id,x]));
  const sm = new Map((balances??[]).map(x=>[x.variant_id,Number(x.warehouse_qty??0)]));

  const items=(products??[]).map(product=>{
    const pv=(variants??[]).filter(v=>v.product_id===product.id&&cm.has(v.color_id)).map(v=>{
      const actual=sm.get(v.id)??0;
      return {...v,color_name:cm.get(v.color_id)?.color_name??"",visible_qty:Math.floor(actual*percent/100)};
    });
    return {...product,variants:pv,variant_count:pv.length,in_stock_count:pv.filter(v=>v.visible_qty>0).length,min_price:pv.length?Math.min(...pv.map(v=>Number(v.retail_price??0))):null};
  }).filter(p=>p.variant_count>0);

  return NextResponse.json({items,tier,percent},{headers:{"Cache-Control":"no-store"}});
}
