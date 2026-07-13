import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const profileId=new URL(request.url).searchParams.get("profileId");
  const s=createAdminClient();
  const {data:profile}=await s.from("profiles").select("approval_status,customer_tier,is_active").eq("id",profileId).maybeSingle();
  if(!profile||profile.approval_status!=="approved"||!profile.is_active)return NextResponse.json({error:"บัญชียังไม่ได้รับอนุมัติ",redirect:"/account-status"},{status:403});
  const {data:settings}=await s.from("customer_stock_visibility_settings").select("*").eq("id",1).single();
  const tier=profile.customer_tier??"normal";
  const percent=Number(tier==="vvip"?settings?.vvip_percent:tier==="vip"?settings?.vip_percent:settings?.normal_percent??25);

  const {data:product}=await s.from("products").select("id,model_name,description,image_url").eq("id",id).eq("is_active",true).maybeSingle();
  if(!product)return NextResponse.json({error:"ไม่พบสินค้า"},{status:404});
  const [{data:colors},{data:variants}]=await Promise.all([
    s.from("product_colors").select("id,color_name").eq("product_id",id).eq("is_active",true).order("sort_order"),
    s.from("product_variants").select("id,color_id,sku,power,retail_price,member_price,is_orderable").eq("product_id",id).eq("is_orderable",true).order("sort_order"),
  ]);
  const ids=(variants??[]).map(v=>v.id);
  const {data:balances}=ids.length?await s.from("inventory_balances").select("variant_id,warehouse_qty").in("variant_id",ids):{data:[] as any[]};
  const sm=new Map((balances??[]).map(x=>[x.variant_id,Number(x.warehouse_qty??0)]));
  const mapped=(variants??[]).map(v=>({...v,visible_qty:Math.floor((sm.get(v.id)??0)*percent/100)}));
  const activeColorIds=new Set(mapped.map(v=>v.color_id));
  return NextResponse.json({
    product,
    colors:(colors??[]).filter(c=>activeColorIds.has(c.id)).map(c=>({id:c.id,name:c.color_name})),
    variants:mapped.map(v=>({id:v.id,color_id:v.color_id,sku:v.sku,power:v.power,is_active:v.is_orderable&&v.visible_qty>0,warehouse_qty:v.visible_qty,retail_price:Number(v.retail_price),member_price:Number(v.member_price)})),
    tier,percent,
  });
}
