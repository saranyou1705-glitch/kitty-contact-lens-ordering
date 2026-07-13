"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Row = {
  id: string;
  name: string;
  color: string;
  power: string;
  shippedQuantity: number;
};

export default function ConfirmReceivedForm({
  orderId,
  rows,
}: {
  orderId: string;
  rows: Row[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(
    rows.map((row) => ({
      ...row,
      checked: true,
      receivedQuantity: row.shippedQuantity,
    })),
  );
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    const profileId = localStorage.getItem("kitty_profile_id") ?? "";

    if (items.some((item) => !item.checked)) {
      setMessage("กรุณาติ๊กสินค้าทุกรายการที่ได้รับ");
      return;
    }

    if (!photos || photos.length === 0) {
      setMessage("กรุณาแนบรูปสินค้าที่ได้รับอย่างน้อย 1 รูป");
      return;
    }

    const form = new FormData();
    form.set("customerId", profileId);
    form.set("note", note);
    form.set(
      "items",
      JSON.stringify(
        items.map((item) => ({
          orderItemId: item.id,
          checked: item.checked,
          receivedQuantity: item.receivedQuantity,
        })),
      ),
    );

    Array.from(photos).forEach((file) => form.append("photos", file));

    setSaving(true);
    setMessage("");

    const response = await fetch(`/api/orders/${orderId}/confirm-received`, {
      method: "POST",
      body: form,
    });

    const result = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(result.error ?? "บันทึกการรับสินค้าไม่สำเร็จ");
      return;
    }

    setMessage("บันทึกการรับสินค้าแล้ว");
    router.refresh();
  }

  return (
    <section className="rounded-[24px] border border-green-200 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-green-700">ยืนยันการรับสินค้า</h2>
      <p className="mt-2 text-sm text-[#8a8a9e]">
        ติ๊กสินค้า กรอกจำนวนที่ได้รับ และแนบรูปสินค้าที่ได้รับ
      </p>

      <div className="mt-4 space-y-3">
        {items.map((item, index) => (
          <article
            key={item.id}
            className="rounded-2xl border border-[#f4d4e1] p-4"
          >
            <label className="flex gap-3">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(event) => {
                  const next = [...items];
                  next[index] = {
                    ...next[index],
                    checked: event.target.checked,
                  };
                  setItems(next);
                }}
                className="mt-1 h-5 w-5"
              />

              <div className="min-w-0 flex-1">
                <p className="font-semibold">{item.name}</p>
                <p className="mt-1 text-sm text-[#8a8a9e]">
                  {item.color} · {item.power}
                </p>

                <label className="mt-3 block text-xs text-[#8a8a9e]">
                  จำนวนที่ได้รับ
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={item.receivedQuantity}
                  onChange={(event) => {
                    const next = [...items];
                    next[index] = {
                      ...next[index],
                      receivedQuantity: Number(
                        event.target.value.replace(/[^\d]/g, "") || "0",
                      ),
                    };
                    setItems(next);
                  }}
                  className="mt-1 h-11 w-32 rounded-2xl border border-[#f3bfd4] px-3 text-center font-semibold"
                />
              </div>
            </label>
          </article>
        ))}
      </div>

      <label className="mt-4 block text-sm font-medium">
        รูปสินค้าที่ได้รับ
      </label>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => setPhotos(event.target.files)}
        className="mt-2 block w-full rounded-2xl border border-[#f3bfd4] bg-white p-3 text-sm"
      />

      <label className="mt-4 block text-sm font-medium">หมายเหตุ</label>
      <textarea
        rows={3}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-[#f3bfd4] px-4 py-3"
        placeholder="เช่น ได้รับครบ สินค้าสภาพดี"
      />

      {message && (
        <p className="mt-3 rounded-2xl bg-[#fff0f6] p-3 text-sm text-[#f76da8]">
          {message}
        </p>
      )}

      <button
        type="button"
        disabled={saving}
        onClick={submit}
        className="mt-5 h-14 w-full rounded-full bg-green-600 font-semibold text-white disabled:opacity-50"
      >
        {saving ? "กำลังบันทึก..." : "ยืนยันว่าได้รับสินค้าแล้ว"}
      </button>
    </section>
  );
}
