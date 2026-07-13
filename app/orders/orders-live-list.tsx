"use client";
import Link from "next/link";
import { useEffect,useMemo,useState } from "react";

type Order={id:string;order_no:string;status:string;fulfillment_status:string|null;payment_status:string|null;final_total:number|null;total_amount:number|null;created_at:string;submitted_at:string|null;customer:{full_name:string;phone:string}|null};

export default function OrdersLiveList({initialOrders}:{initialOrders:Order[]}){
  const [orders,setOrders]=useState(initialOrders);
  const [filter,setFilter]=useState("action");
  async function refresh(){const r=await fetch("/api/admin/orders",{cache:"no-store"});const d=await r.json();if(r.ok)setOrders(d.orders??[]);}
  useEffect(()=>{const t=setInterval(refresh,3000);return()=>clearInterval(t);},[]);
  const shown=useMemo(()=>{const sorted=[...orders].sort((a,b)=>priority(a.fulfillment_status??a.status)-priority(b.fulfillment_status??b.status)||new Date(a.created_at).getTime()-new Date(b.created_at).getTime());if(filter==="all")return sorted;if(filter==="done")return sorted.filter(o=>["shipped","completed"].includes(o.fulfillment_status??o.status));if(filter==="rejected")return sorted.filter(o=>o.fulfillment_status==="rejected"||o.status==="cancelled");return sorted.filter(o=>!["rejected","shipped","completed"].includes(o.fulfillment_status??o.status)&&o.status!=="cancelled");},[orders,filter]);

  return <>
    <div className="mb-4 flex flex-wrap gap-2">
      {([["action","ต้องจัดการก่อน"],["all","ทั้งหมด"],["done","จัดส่งแล้ว"],["rejected","ปฏิเสธ"]] as const).map(([v,l])=><button key={v} onClick={()=>setFilter(v)} className={`rounded-full px-4 py-2 text-sm font-semibold ${filter===v?"bg-[#f76da8] text-white":"border border-[#f3bfd4] bg-white text-[#f76da8]"}`}>{l}</button>)}
    </div>
    <div className="overflow-x-auto rounded-[24px] border border-[#f4d4e1] bg-white shadow-sm">
      <table className="min-w-[900px] w-full border-collapse text-sm">
        <thead className="bg-[#fff0f6] text-left"><tr><th className="px-4 py-3">ลำดับงาน</th><th className="px-4 py-3">ออเดอร์</th><th className="px-4 py-3">ลูกค้า</th><th className="px-4 py-3">สถานะจัดส่ง</th><th className="px-4 py-3">สถานะชำระ</th><th className="px-4 py-3 text-right">ยอดรวม</th><th className="px-4 py-3">เวลาสั่ง</th><th></th></tr></thead>
        <tbody>{shown.map(o=>{const s=o.fulfillment_status??o.status;return <tr key={o.id} className="border-t border-[#f4d4e1]">
          <td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityClass(s)}`}>{priorityLabel(s)}</span></td>
          <td className="px-4 py-4 font-semibold">{o.order_no}</td>
          <td className="px-4 py-4"><p className="font-medium">{o.customer?.full_name||"-"}</p><p className="text-xs text-[#8a8a9e]">{o.customer?.phone||"-"}</p></td>
          <td className="px-4 py-4">{fulfillmentLabel(s)}</td><td className="px-4 py-4">{paymentLabel(o.payment_status??"unpaid")}</td>
          <td className="px-4 py-4 text-right font-semibold">฿{Number(o.final_total??o.total_amount??0).toLocaleString("th-TH")}</td>
          <td className="px-4 py-4 text-xs text-[#8a8a9e]">{new Date(o.submitted_at??o.created_at).toLocaleString("th-TH")}</td>
          <td className="px-4 py-4 text-right"><Link href={`/admin/orders/${o.id}`} className="rounded-full bg-[#f76da8] px-4 py-2 text-xs font-semibold text-white">เปิด</Link></td>
        </tr>})}</tbody>
      </table>
    </div>
  </>;
}
function priority(s:string){if(["submitted","shipping_quoted"].includes(s))return 1;if(s==="packing")return 2;if(s==="packed")return 3;return 4;}
function priorityLabel(s:string){return priority(s)===1?"เร่งด่วน":priority(s)===2?"ดำเนินการ":priority(s)===3?"ติดตาม":"เสร็จแล้ว";}
function priorityClass(s:string){return priority(s)===1?"bg-red-50 text-red-600":priority(s)===2?"bg-amber-50 text-amber-700":priority(s)===3?"bg-blue-50 text-blue-600":"bg-green-50 text-green-600";}
function fulfillmentLabel(s:string){return({submitted:"รับออเดอร์แล้ว",shipping_quoted:"แจ้งค่าจัดส่งแล้ว",packing:"กำลังแพ็ก",packed:"แพ็กเสร็จแล้ว",shipped:"จัดส่งแล้ว",completed:"เสร็จสิ้น",rejected:"ปฏิเสธแล้ว",cancelled:"ยกเลิกแล้ว"} as Record<string,string>)[s]??s;}
function paymentLabel(s:string){return({unpaid:"ยังไม่ชำระ",payment_pending:"รอตรวจสลิป",partially_paid:"ชำระบางส่วน",paid:"ชำระแล้ว"} as Record<string,string>)[s]??s;}
