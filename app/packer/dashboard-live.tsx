"use client";
import Link from "next/link";
import { useEffect,useState } from "react";

type Data={counts:{waiting:number;packing:number;packed:number;shipped:number};urgent:Array<{id:string;order_no:string;status:string;fulfillment_status:string|null;created_at:string;submitted_at:string|null}>};

export default function DashboardLive({initialData}:{initialData:Data}){
  const [data,setData]=useState(initialData);
  async function refresh(){const r=await fetch("/api/packer/dashboard",{cache:"no-store"});const d=await r.json();if(r.ok)setData(d);}
  useEffect(()=>{const t=setInterval(refresh,3000);return()=>clearInterval(t);},[]);
  return <>
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Stat label="รอจัดสินค้า" value={data.counts.waiting}/><Stat label="กำลังแพ็ก" value={data.counts.packing}/><Stat label="รอจัดส่ง" value={data.counts.packed}/><Stat label="จัดส่งแล้ว" value={data.counts.shipped}/>
    </section>
    <section className="mt-6 rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
      <div className="flex justify-between"><h2 className="font-bold">งานที่ต้องทำตอนนี้</h2><Link href="/packer/orders" className="text-sm font-semibold text-[#f76da8]">ดูทั้งหมด</Link></div>
      <div className="mt-4 space-y-3">{data.urgent.map(o=><Link key={o.id} href={`/packer/orders/${o.id}`} className="flex items-center justify-between rounded-2xl border border-[#f4d4e1] p-4">
        <div><p className="font-semibold">{o.order_no}</p><p className="mt-1 text-xs text-[#8a8a9e]">{new Date(o.submitted_at??o.created_at).toLocaleString("th-TH")}</p></div>
        <span className="rounded-full bg-[#fff0f6] px-3 py-2 text-xs font-semibold text-[#f76da8]">{label(o.fulfillment_status??o.status)}</span>
      </Link>)}
      {!data.urgent.length&&<p className="py-6 text-center text-sm text-[#8a8a9e]">ไม่มีงานค้าง</p>}</div>
    </section>
  </>;
}
function Stat({label,value}:{label:string;value:number}){return <div className="rounded-[22px] border border-[#f4d4e1] bg-white p-4 shadow-sm"><p className="text-sm text-[#8a8a9e]">{label}</p><p className="mt-2 text-3xl font-bold text-[#f76da8]">{value}</p></div>;}
function label(s:string){return({submitted:"รอจัดสินค้า",shipping_quoted:"รอจัดสินค้า",packing:"กำลังแพ็ก",packed:"รอจัดส่ง",shipped:"จัดส่งแล้ว"} as Record<string,string>)[s]??s;}
