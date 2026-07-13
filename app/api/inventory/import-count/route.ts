import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createAdminClient } from "@/lib/supabase/admin";

function text(row:any, names:string[]) { for(const n of names){ const v=row[n]; if(v!==undefined&&v!==null&&String(v).trim()!=="") return String(v).trim(); } return ""; }

export async function POST(request: Request) {
  try {
    const form=await request.formData();
    const file=form.get("file");
    const actorRole=String(form.get("actorRole")??"");
    const actorId=String(form.get("actorId")??"")||null;
    if(!["admin","super_admin","packer"].includes(actorRole)) return NextResponse.json({error:"ไม่มีสิทธิ์อัปเดตสต๊อค"},{status:403});
    if(!(file instanceof File)) return NextResponse.json({error:"กรุณาเลือกไฟล์ Excel"},{status:400});
    const buffer=Buffer.from(await file.arrayBuffer());
    const wb=XLSX.read(buffer,{type:"buffer",cellDates:true});
    const ws=wb.Sheets[wb.SheetNames[0]];
    const rows=XLSX.utils.sheet_to_json<any>(ws,{defval:""});
    if(!rows.length) return NextResponse.json({error:"ไม่พบข้อมูลในไฟล์"},{status:400});
    const countedAtRaw=text(rows[0],["Counted At","counted_at","วันเวลาที่นับ","วันที่และเวลาที่นับ"]);
    const countedAt=countedAtRaw?new Date(countedAtRaw):new Date();
    if(Number.isNaN(countedAt.getTime())) return NextResponse.json({error:"วันเวลาที่นับไม่ถูกต้อง"},{status:400});
    const supabase=createAdminClient();
    const {data:session,error:se}=await supabase.from("inventory_count_sessions").insert({counted_at:countedAt.toISOString(),uploaded_by:actorId,uploaded_role:actorRole,filename:file.name,total_rows:rows.length}).select("id").single();
    if(se||!session) return NextResponse.json({error:se?.message??"สร้างรอบนับสต๊อคไม่สำเร็จ"},{status:500});
    let matched=0,unmatched=0,totalDifference=0; const results=[];
    for(const row of rows){
      const sku=text(row,["SKU","sku","รหัสสินค้า"]);
      const qty=Number(text(row,["Quantity","quantity","จำนวน","ยอดนับ"]));
      if(!sku||!Number.isInteger(qty)||qty<0){ unmatched++; results.push({sku, status:"invalid"}); await supabase.from("inventory_count_items").insert({session_id:session.id,sku:sku||"-",counted_quantity:Number.isFinite(qty)?qty:0,row_status:"invalid",note:"SKU หรือจำนวนไม่ถูกต้อง"}); continue; }
      const {data:variant}=await supabase.from("product_variants").select("id").eq("sku",sku).maybeSingle();
      if(!variant){ unmatched++; results.push({sku,status:"sku_not_found"}); await supabase.from("inventory_count_items").insert({session_id:session.id,sku,counted_quantity:qty,row_status:"sku_not_found"}); continue; }
      const {data:balance}=await supabase.from("inventory_balances").select("warehouse_qty").eq("variant_id",variant.id).maybeSingle();
      const systemQty=Number(balance?.warehouse_qty??0); const diff=qty-systemQty; matched++; totalDifference+=diff;
      await supabase.from("inventory_balances").upsert({variant_id:variant.id,warehouse_qty:qty,last_counted_at:countedAt.toISOString(),updated_at:new Date().toISOString()},{onConflict:"variant_id"});
      if(diff!==0) await supabase.from("inventory_movements").insert({variant_id:variant.id,movement_type:"count_adjustment",quantity:Math.abs(diff),to_bucket:diff>0?"warehouse":null,from_bucket:diff<0?"warehouse":null,reference_id:session.id,actor_id:actorId,actor_role:actorRole,note:`นับจริง ${qty}, ระบบ ${systemQty}, ต่าง ${diff}`,occurred_at:countedAt.toISOString()});
      await supabase.from("inventory_count_items").insert({session_id:session.id,variant_id:variant.id,sku,system_quantity:systemQty,counted_quantity:qty,difference:diff,row_status:"matched"});
      results.push({sku,systemQuantity:systemQty,countedQuantity:qty,difference:diff,status:"matched"});
    }
    await supabase.from("inventory_count_sessions").update({matched_rows:matched,unmatched_rows:unmatched,total_difference:totalDifference}).eq("id",session.id);
    return NextResponse.json({success:true,sessionId:session.id,matched,unmatched,totalDifference,results});
  } catch(e){ return NextResponse.json({error:e instanceof Error?e.message:"นำเข้าไฟล์ไม่สำเร็จ"},{status:500}); }
}
