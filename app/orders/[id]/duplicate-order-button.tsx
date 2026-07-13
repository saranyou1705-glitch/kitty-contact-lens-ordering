"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DuplicateOrderButton({orderId}:{orderId:string}){
  const router=useRouter();
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);

  async function run(){
    if(!orderId){setMessage("ไม่พบรหัสออเดอร์");return;}
    setLoading(true);setMessage("");
    try{
      const res=await fetch(`/api/orders/${encodeURIComponent(orderId)}/duplicate-to-cart`,{cache:"no-store"});
      const result=await res.json();
      if(!res.ok) throw new Error(result.error??"คัดลอกออเดอร์ไม่สำเร็จ");
      localStorage.setItem("kitty_cart",JSON.stringify(Array.isArray(result.items)?result.items:[]));
      if(result.addressId)localStorage.setItem("kitty_duplicate_address_id",String(result.addressId));
      router.push("/cart?duplicated=1");
    }catch(e){setMessage(e instanceof Error?e.message:"คัดลอกออเดอร์ไม่สำเร็จ");}
    finally{setLoading(false);}
  }

  return <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
    <h2 className="font-bold">สั่งซ้ำ</h2>
    <p className="mt-2 text-sm text-[#8a8a9e]">คัดลอกสินค้าเดิมไปตะกร้า แล้วแก้จำนวนก่อนยืนยันได้</p>
    {message&&<p className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-600">{message}</p>}
    <button type="button" onClick={run} disabled={loading} className="mt-4 h-12 w-full rounded-full bg-[#f76da8] font-semibold text-white disabled:opacity-50">{loading?"กำลังคัดลอก...":"Duplicate และแก้ไขจำนวน"}</button>
  </section>;
}
