"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CartItem = {
  productId: string;
  productName: string;
  imageUrl: string | null;
  colorId: string;
  colorName: string;
  variantId: string;
  power: string;
  unitPrice: number;
  quantity: number;
};

type Address = {
  id: string;
  receiver_name: string;
  phone: string;
  address_line: string;
  subdistrict: string;
  district: string;
  province: string;
  postal_code: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("kitty_cart") ?? "[]");
    const profileId = localStorage.getItem("kitty_profile_id") ?? "";

    setItems(cart);
    setCustomerId(profileId);

    async function loadAddresses() {
      if (!profileId) {
        setMessage("ไม่พบข้อมูลลูกค้า กรุณาลงทะเบียนใหม่");
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/profile-addresses?profileId=${profileId}`);
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "โหลดที่อยู่ไม่สำเร็จ");
        setLoading(false);
        return;
      }

      setAddresses(result.addresses ?? []);
      const defaultAddress = (result.addresses ?? []).find(
        (address: Address & { is_default?: boolean }) => address.is_default,
      );
      setAddressId(defaultAddress?.id ?? result.addresses?.[0]?.id ?? "");
      setLoading(false);
    }

    loadAddresses();
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items],
  );

  async function submitOrder(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    if (!customerId || !addressId || items.length === 0) {
      setMessage("ข้อมูลคำสั่งซื้อไม่ครบ");
      return;
    }

    setSubmitting(true);

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId,
        addressId,
        customerNote: note,
        items,
      }),
    });

    const result = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setMessage(result.error ?? "ส่งคำสั่งซื้อไม่สำเร็จ");
      return;
    }

    localStorage.removeItem("kitty_cart");
    router.push(`/orders/${result.orderId}`);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fff5f9] p-6 text-center">
        กำลังโหลดข้อมูล...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fff5f9] px-5 pb-10 pt-7">
      <div className="mx-auto max-w-md">
        <header className="mb-6 flex items-center gap-4">
          <Link
            href="/cart"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f4cadb] bg-white text-[#f76da8]"
          >
            ←
          </Link>
          <div>
            <p className="text-sm text-[#8a8a9e]">ขั้นตอนสุดท้าย</p>
            <h1 className="text-2xl font-bold">ยืนยันคำสั่งซื้อ</h1>
          </div>
        </header>

        <form onSubmit={submitOrder} className="space-y-5">
          <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
            <h2 className="font-bold">ที่อยู่จัดส่ง</h2>

            <div className="mt-4 space-y-3">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={`block cursor-pointer rounded-2xl border p-4 ${
                    addressId === address.id
                      ? "border-[#f76da8] bg-[#fff8fb]"
                      : "border-[#f4d4e1]"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    value={address.id}
                    checked={addressId === address.id}
                    onChange={() => setAddressId(address.id)}
                    className="mr-2"
                  />
                  <span className="font-semibold">{address.receiver_name}</span>
                  <p className="mt-2 text-sm leading-6 text-[#6f6872]">
                    {address.address_line} {address.subdistrict} {address.district}{" "}
                    {address.province} {address.postal_code}
                  </p>
                  <p className="mt-1 text-sm text-[#8a8a9e]">{address.phone}</p>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
            <h2 className="font-bold">สรุปรายการสินค้า</h2>

            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <div key={item.variantId} className="flex justify-between gap-4 text-sm">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-[#8a8a9e]">
                      {item.colorName} · {item.power} · {item.quantity} คู่
                    </p>
                  </div>
                  <p className="font-semibold">
                    ฿{(item.unitPrice * item.quantity).toLocaleString("th-TH")}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-[#f4d4e1] pt-4">
              <div className="flex justify-between">
                <span className="text-[#8a8a9e]">ยอดสินค้า</span>
                <span className="font-bold text-[#f76da8]">
                  ฿{subtotal.toLocaleString("th-TH")}
                </span>
              </div>
              <p className="mt-2 text-xs text-[#8a8a9e]">
                ค่าขนส่งจะได้รับการยืนยันจากแอดมินภายหลัง
              </p>
            </div>
          </section>

          <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
            <label htmlFor="note" className="font-bold">
              หมายเหตุถึงร้าน
            </label>
            <textarea
              id="note"
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="ระบุเพิ่มเติมได้ (ไม่บังคับ)"
              className="mt-3 w-full rounded-2xl border border-[#f3bfd4] px-4 py-3 outline-none focus:border-[#f76da8]"
            />
          </section>

          {message && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="h-14 w-full rounded-full bg-[#f76da8] font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "กำลังส่งออเดอร์..." : "ยืนยันและส่งคำสั่งซื้อ"}
          </button>
        </form>
      </div>
    </main>
  );
}
