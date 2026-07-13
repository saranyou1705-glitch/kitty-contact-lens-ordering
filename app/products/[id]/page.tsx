"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProductSelector from "./product-selector";

export default function Page() {
  const params = useParams<{id:string}>();
  const router = useRouter();
  const [data,setData]=useState<any>(null);
  const [error,setError]=useState("");

  useEffect(()=>{
    const profileId=localStorage.getItem("kitty_profile_id")??"";
    fetch(`/api/customer/products/${params.id}?profileId=${encodeURIComponent(profileId)}&t=${Date.now()}`,{cache:"no-store"})
      .then(async r=>({ok:r.ok,d:await r.json()}))
      .then(({ok,d})=>{
        if(d.redirect){router.push(d.redirect);return;}
        if(!ok)setError(d.error??"โหลดสินค้าไม่สำเร็จ");else setData(d);
      });
  },[params.id,router]);

  if(error)return <main className="min-h-screen bg-[#fff5f9] p-8 text-red-600">{error}</main>;
  if(!data)return <main className="min-h-screen bg-[#fff5f9] p-8">กำลังโหลดสินค้า...</main>;

  return <main className="min-h-screen bg-[#fff5f9] px-5 pb-28 pt-7">
    <div className="mx-auto max-w-md">
      <section className="overflow-hidden rounded-[28px] border border-[#f4d4e1] bg-white shadow-sm">
        <div className="flex aspect-square items-center justify-center bg-[#fff0f6]">
          {data.product.image_url?<img src={data.product.image_url} alt={data.product.model_name} className="h-full w-full object-cover"/>:<span className="text-7xl">◉</span>}
        </div>
        <div className="p-5">
          <h1 className="text-2xl font-bold">{data.product.model_name}</h1>
          <p className="mt-2 text-sm text-[#8a8a9e]">{data.product.description||"เลือกสีและค่าสายตา"}</p>
          <p className="mt-2 text-xs text-[#8a8a9e]">ระดับ {String(data.tier).toUpperCase()} · มองเห็น {data.percent}% ของสต๊อค</p>
        </div>
      </section>
      <ProductSelector product={data.product} colors={data.colors} variants={data.variants}/>
    </div>
  </main>;
}
