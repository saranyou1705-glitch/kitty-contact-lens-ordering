"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Color = { id: string; color_name: string };
type Variant = {
  id: string;
  color_id: string;
  power: string;
  retail_price: number;
  member_price: number;
  is_orderable: boolean;
  sku: string | null;
  warehouse_qty: number;
};

type ProductSelectorProps = {
  product: { id: string; model_name: string; image_url: string | null };
  colors: Color[];
  variants: Variant[];
};

export default function ProductSelector({
  product,
  colors,
  variants,
}: ProductSelectorProps) {
  const router = useRouter();
  const [colorId, setColorId] = useState(colors[0]?.id ?? "");
  const [variantId, setVariantId] = useState("");
  const [quantityText, setQuantityText] = useState("1");
  const [message, setMessage] = useState("");

  const availableVariants = useMemo(
    () => variants.filter((item) => item.color_id === colorId),
    [colorId, variants],
  );
  const selectedVariant = variants.find((item) => item.id === variantId);

  function qty() {
    const value = Number(quantityText.replace(/,/g, ""));
    return Number.isInteger(value) && value > 0 ? value : 1;
  }

  function setQty(next: number) {
    setQuantityText(String(Math.max(1, Math.min(1000000, next))));
  }

  function addToCart() {
    setMessage("");
    const quantity = qty();

    if (!colorId || !selectedVariant) {
      setMessage("กรุณาเลือกสีและค่าสายตา");
      return;
    }

    if (!selectedVariant.is_orderable) {
      setMessage("ค่าสายตานี้ยังไม่เปิดขาย");
      return;
    }

    if (selectedVariant.warehouse_qty < quantity) {
      setMessage(`สต๊อคไม่พอ ขณะนี้มี ${selectedVariant.warehouse_qty} คู่`);
      return;
    }

    let cart: any[] = [];

    try {
      const raw = localStorage.getItem("kitty_cart");
      cart = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(cart)) cart = [];
    } catch {
      cart = [];
    }

    const existingIndex = cart.findIndex(
      (item: { variantId: string }) => item.variantId === selectedVariant.id,
    );
    const color = colors.find((item) => item.id === colorId);
    const nextItem = {
      productId: product.id,
      productName: product.model_name,
      imageUrl: product.image_url,
      colorId,
      colorName: color?.color_name ?? "",
      variantId: selectedVariant.id,
      power: selectedVariant.power,
      unitPrice: Number(selectedVariant.retail_price),
      quantity,
    };

    if (existingIndex >= 0) cart[existingIndex].quantity += quantity;
    else cart.push(nextItem);

    localStorage.setItem("kitty_cart", JSON.stringify(cart));
    router.push("/cart");
  }

  return (
    <section className="mt-5 rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
      <h2 className="font-bold text-[#2b2b38]">เลือกสี</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {colors.map((color) => (
          <button
            key={color.id}
            type="button"
            onClick={() => {
              setColorId(color.id);
              setVariantId("");
            }}
            className={`rounded-full border px-4 py-2 text-sm ${
              colorId === color.id
                ? "border-[#f76da8] bg-[#fff0f6] font-semibold text-[#f76da8]"
                : "border-[#f3bfd4] bg-white text-[#5f5964]"
            }`}
          >
            {color.color_name}
          </button>
        ))}
      </div>

      <h2 className="mt-6 font-bold text-[#2b2b38]">เลือกค่าสายตา</h2>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {availableVariants.map((variant) => (
          <button
            key={variant.id}
            type="button"
            disabled={!variant.is_orderable || variant.warehouse_qty <= 0}
            onClick={() => setVariantId(variant.id)}
            className={`rounded-2xl border px-2 py-3 text-sm ${
              !variant.is_orderable || variant.warehouse_qty <= 0
                ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through"
                : variantId === variant.id
                  ? "border-[#f76da8] bg-[#fff0f6] font-semibold text-[#f76da8]"
                  : "border-[#f3bfd4] bg-white text-[#2b2b38]"
            }`}
          >
            <span className="block">{variant.power}</span>
            <span className="mt-1 block text-[10px] opacity-70">
              {variant.warehouse_qty > 0 ? `เหลือ ${variant.warehouse_qty}` : "หมด"}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-[#fff8fb] p-4">
        <label className="text-xs text-[#8a8a9e]">จำนวน (คู่)</label>

        <div className="mt-2 grid grid-cols-[42px_1fr_42px] items-center gap-2">
          <button
            type="button"
            onClick={() => setQty(qty() - 1)}
            className="h-11 rounded-full border border-[#f3bfd4] bg-white text-lg"
          >
            −
          </button>

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={quantityText}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) =>
              setQuantityText(event.target.value.replace(/[^\d]/g, ""))
            }
            onBlur={() => setQty(qty())}
            className="h-11 rounded-2xl border border-[#f3bfd4] bg-white px-3 text-center text-lg font-semibold"
            placeholder="เช่น 1000"
          />

          <button
            type="button"
            onClick={() => setQty(qty() + 1)}
            className="h-11 rounded-full border border-[#f3bfd4] bg-white text-lg"
          >
            +
          </button>
        </div>
      </div>

      {selectedVariant && (
        <div className="mt-4 rounded-2xl bg-[#fff8fb] p-3 text-xs text-[#8a8a9e]">
          SKU: {selectedVariant.sku || "-"} · สต๊อคพร้อมขาย {selectedVariant.warehouse_qty} คู่
        </div>
      )}

      {selectedVariant && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-[#8a8a9e]">รวมสินค้า</span>
          <span className="text-lg font-bold text-[#f76da8]">
            ฿
            {(Number(selectedVariant.retail_price) * qty()).toLocaleString(
              "th-TH",
            )}
          </span>
        </div>
      )}

      {message && (
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={addToCart}
        className="mt-6 h-14 w-full rounded-full bg-[#f76da8] font-semibold text-white"
      >
        เพิ่มลงตะกร้า
      </button>
    </section>
  );
}
