"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Product = {
  id: string;
  model_name: string;
  description: string | null;
  image_url: string | null;
  variant_count: number;
  in_stock_count: number;
  min_price: number | null;
  variants: Array<{ sku: string | null; power: string; color_name: string; warehouse_qty: number }>;
};

export default function ProductsLiveGrid() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    const profileId = localStorage.getItem("kitty_profile_id") ?? "";
    const response = await fetch(`/api/customer/products?profileId=${encodeURIComponent(profileId)}&t=${Date.now()}`, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) setError(result.error ?? "โหลดสินค้าไม่สำเร็จ");
    else {
      if (result.redirect) { window.location.href = result.redirect; return; }
      setItems(result.items ?? []);
      setError("");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 5000);
    return () => window.clearInterval(timer);
  }, []);

  if (loading) return <p className="text-sm text-[#8a8a9e]">กำลังอัปเดตสินค้า...</p>;
  if (error) return <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-600">{error}</div>;
  if (items.length === 0) return <div className="rounded-[24px] border border-[#f4d4e1] bg-white p-6 text-center shadow-sm">ยังไม่มีสินค้าที่เปิดขาย</div>;

  return (
    <section className="grid grid-cols-2 gap-4">
      {items.map((product) => (
        <Link key={product.id} href={`/products/${product.id}`} className="overflow-hidden rounded-[24px] border border-[#f4d4e1] bg-white shadow-sm active:scale-[0.98]">
          <div className="flex aspect-square items-center justify-center bg-[#fff0f6]">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image_url} alt={product.model_name} className="h-full w-full object-cover" />
            ) : <span className="text-5xl">◉</span>}
          </div>
          <div className="p-4">
            <h2 className="line-clamp-2 font-semibold">{product.model_name}</h2>
            <p className="mt-1 text-xs text-[#8a8a9e]">
              {product.variant_count} SKU · มีสต๊อค {product.in_stock_count} SKU
            </p>
            <p className="mt-2 text-sm font-semibold text-[#f76da8]">
              {product.min_price === null ? "รอระบุราคา" : `เริ่มต้น ฿${product.min_price.toLocaleString("th-TH")}`}
            </p>
          </div>
        </Link>
      ))}
    </section>
  );
}
