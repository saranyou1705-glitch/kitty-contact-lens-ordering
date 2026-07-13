import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
type Params={params:Promise<{id:string}>};

export async function GET(_:Request,{params}:Params){
  try{
    const {id}=await params;
    if(!id||id==="undefined"||id==="null") return NextResponse.json({error:"รหัสออเดอร์ไม่ถูกต้อง"},{status:400});
    const supabase=createAdminClient();
    const {data:order,error:oe}=await supabase.from("orders").select("id,address_id").eq("id",id).maybeSingle();
    if(oe||!order) return NextResponse.json({error:oe?.message??"ไม่พบออเดอร์ต้นฉบับ"},{status:404});
    const {data:items,error:ie}=await supabase.from("order_items").select("*").eq("order_id",id).order("created_at");
    if(ie||!items?.length) return NextResponse.json({error:ie?.message??"ไม่พบสินค้าในออเดอร์ต้นฉบับ"},{status:400});
    return NextResponse.json({addressId:order.address_id,items:items.map(i=>({productId:i.product_id,variantId:i.variant_id,productName:i.model_name_snapshot,colorName:i.color_name_snapshot,power:i.power_snapshot,quantity:Number(i.original_quantity??i.quantity??1),unitPrice:Number(i.unit_price??0)}))});
  }catch(e){console.error(e);return NextResponse.json({error:"ไม่สามารถสร้างคำสั่งซื้อซ้ำได้"},{status:500});}
}
