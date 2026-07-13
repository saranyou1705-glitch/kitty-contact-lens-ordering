"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Variant={id:string;color_id:string;power:string;is_active:boolean;warehouse_qty:number;sku?:string|null;retail_price?:number;member_price?:number};
type Color={id:string;name:string};

export default function ProductSelector({product,colors,variants}:{product:{id:string;name:string;retail_price:number;member_price:number|null};colors:Color[];variants:Variant[]}) {
  const router=useRouter();
  const [colorId,setColorId]=useState(colors[0]?.id??"");
  const powers=useMemo(()=>variants.filter(v=>v.color_id===colorId&&v.is_active).map(v=>v.power),[variants,colorId]);
  const [power,setPower]=useState(powers[0]??"");
  const [qty,setQty]=useState("1");
  const [message,setMessage]=useState("");

  const current=()=>Math.max(1,Number(qty.replace(/,/g,""))||1);
  const changeColor=(id:string)=>{setColorId(id);setPower(variants.find(v=>v.color_id===id&&v.is_active)?.power??"");};

  function add(){
    const quantity=Number(qty.replace(/,/g,""));
    if(!Number.isInteger(quantity)||quantity<1){setMessage("กรุณากรอกจำนวนอย่างน้อย 1 คู่");return;}
    const color=colors.find(c=>c.id===colorId);
    const variant=variants.find(v=>v.color_id===colorId&&v.power===power&&v.is_active);
    if(!color||!variant){setMessage("กรุณาเลือกสีและค่าสายตา");return;}
    if(quantity>Number(variant.warehouse_qty??0)){setMessage(`สั่งได้สูงสุด ${variant.warehouse_qty} คู่`);return;}
    let cart:any[]=[];
    try{const raw=localStorage.getItem("kitty_cart");cart=raw?JSON.parse(raw):[];if(!Array.isArray(cart))cart=[];}catch{cart=[];}
    const i=cart.findIndex((x:any)=>x.variantId===variant.id);
    if(i>=0) cart[i].quantity=Number(cart[i].quantity||0)+quantity;
    else cart.push({productId:product.id,variantId:variant.id,productName:product.name,colorName:color.name,power,quantity,unitPrice:Number(product.member_price??product.retail_price)});
    localStorage.setItem("kitty_cart",JSON.stringify(cart));
    router.push("/cart");
  }

  return <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
    <label className="block text-sm font-medium">สี</label>
    <select value={colorId} onChange={e=>changeColor(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-[#f3bfd4] px-4">
      {colors.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
    </select>

    <label className="mt-4 block text-sm font-medium">ค่าสายตา</label>
    <select value={power} onChange={e=>setPower(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-[#f3bfd4] px-4">
      {powers.map(p=>{const v=variants.find(x=>x.color_id===colorId&&x.power===p);return <option key={p} value={p}>{p} · พร้อมสั่ง {v?.warehouse_qty??0} คู่</option>})}
    </select>

    <label className="mt-4 block text-sm font-medium">จำนวน (คู่)</label>
    <div className="mt-2 grid grid-cols-[48px_1fr_48px] gap-2">
      <button type="button" onClick={()=>setQty(String(Math.max(1,current()-1)))} className="h-14 rounded-2xl border border-[#f3bfd4] text-xl font-bold text-[#f76da8]">−</button>
      <input type="text" inputMode="numeric" pattern="[0-9]*" value={qty} onFocus={e=>e.currentTarget.select()} onChange={e=>setQty(e.target.value.replace(/[^\d]/g,""))} onBlur={()=>setQty(String(current()))} placeholder="เช่น 1000" className="h-14 w-full rounded-2xl border border-[#f3bfd4] px-4 text-center text-lg font-semibold"/>
      <button type="button" onClick={()=>setQty(String(current()+1))} className="h-14 rounded-2xl border border-[#f3bfd4] text-xl font-bold text-[#f76da8]">+</button>
    </div>
    <p className="mt-2 text-xs text-[#8a8a9e]">พิมพ์จำนวนได้โดยตรง หรือใช้ปุ่ม + / −</p>
    {message&&<p className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-600">{message}</p>}
    <button type="button" onClick={add} className="mt-5 h-14 w-full rounded-full bg-[#f76da8] font-semibold text-white">เพิ่มลงตะกร้า</button>
  </section>;
}
