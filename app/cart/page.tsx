"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CartItem = {
  productId: string;
  variantId: string;
  productName: string;
  colorName: string;
  power: string;
  quantity: number;
  unitPrice: number;
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("kitty_cart") || "[]");
    setItems(Array.isArray(cart) ? cart : []);
  }, []);

  function updateQuantity(index: number, raw: string) {
    const digits = raw.replace(/[^\d]/g, "");
    const next = [...items];
    next[index] = {
      ...next[index],
      quantity: digits === "" ? 0 : Number(digits),
    };
    setItems(next);
    localStorage.setItem("kitty_cart", JSON.stringify(next));
  }

  function removeItem(index: number) {
    const next = items.filter((_, itemIndex) => itemIndex !== index);
    setItems(next);
    localStorage.setItem("kitty_cart", JSON.stringify(next));
  }

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
        0,
      ),
    [items],
  );

  const invalid = items.some(
    (item) =>
      !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1,
  );

  return (
    <main className="min-h-screen bg-[#fff5f9] px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-5">
          <p className="text-sm text-[#8a8a9e]">ตรวจสอบก่อนสั่งซื้อ</p>
          <h1 className="text-3xl font-bold">ตะกร้าสินค้า</h1>
        </header>

        <section className="space-y-2">
          {items.map((item, index) => (
            <article
              key={`${item.variantId}-${index}`}
              className="rounded-[18px] border border-[#f4d4e1] bg-white px-4 py-3 shadow-sm"
            >
              <div className="grid grid-cols-[1fr_88px_76px_32px] items-center gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold">
                    {item.productName}
                  </h2>
                  <p className="mt-1 truncate text-xs text-[#8a8a9e]">
                    {item.colorName} · {item.power}
                  </p>
                </div>

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={item.quantity || ""}
                  onFocus={(event) => event.currentTarget.select()}
                  onChange={(event) => updateQuantity(index, event.target.value)}
                  className="h-10 rounded-xl border border-[#f3bfd4] px-2 text-center text-sm font-semibold"
                />

                <p className="text-right text-sm font-bold text-[#f76da8]">
                  ฿
                  {(
                    Number(item.unitPrice) * Number(item.quantity || 0)
                  ).toLocaleString("th-TH")}
                </p>

                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-sm font-semibold text-red-500"
                >
                  ลบ
                </button>
              </div>
            </article>
          ))}
        </section>

        {items.length === 0 && (
          <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-6 text-center">
            ยังไม่มีสินค้าในตะกร้า
          </section>
        )}

        <section className="mt-5 rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
          <div className="flex justify-between gap-4">
            <span className="font-semibold">ยอดสินค้า</span>
            <span className="text-xl font-bold text-[#f76da8]">
              ฿{subtotal.toLocaleString("th-TH")}
            </span>
          </div>

          {invalid && (
            <p className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-600">
              กรุณากรอกจำนวนของทุกรายการอย่างน้อย 1 คู่
            </p>
          )}

          {message && <p className="mt-3 text-sm text-red-600">{message}</p>}

          <Link
            href={invalid || items.length === 0 ? "#" : "/checkout"}
            onClick={(event) => {
              if (invalid || items.length === 0) {
                event.preventDefault();
                setMessage("กรุณาตรวจสอบจำนวนสินค้าก่อน");
              }
            }}
            className="mt-5 flex h-14 w-full items-center justify-center rounded-full bg-[#f76da8] font-semibold text-white"
          >
            ยืนยันรายการและไปหน้าสั่งซื้อ
          </Link>
        </section>
      </div>
    </main>
  );
}
