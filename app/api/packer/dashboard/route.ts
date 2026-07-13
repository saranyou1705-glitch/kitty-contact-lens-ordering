import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(){
  const supabase=createAdminClient();
  const {data:orders,error}=await supabase.from("orders").select("id,order_no,status,fulfillment_status,created_at,submitted_at").not("fulfillment_status","eq","rejected").not("status","eq","cancelled").order("created_at",{ascending:false});
  if(error)return NextResponse.json({error:error.message},{status:500});
  const rows=orders??[];
  const status=(o:any)=>o.fulfillment_status??o.status;
  return NextResponse.json({counts:{
    waiting:rows.filter(o=>["submitted","shipping_quoted"].includes(status(o))).length,
    packing:rows.filter(o=>status(o)==="packing").length,
    packed:rows.filter(o=>status(o)==="packed").length,
    shipped:rows.filter(o=>status(o)==="shipped").length
  },urgent:rows.filter(o=>["submitted","shipping_quoted","packing","packed"].includes(status(o))).slice(0,10)});
}
