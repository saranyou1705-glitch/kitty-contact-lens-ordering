"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Row = {
  orderItemId: string;
  packingId: string;
  name: string;
  color: string;
  power: string;
  orderedQuantity: number;
  packedQuantity: number;
  willShip: boolean;
  isChecked: boolean;
};

export default function PackingWorkspace({
  orderId,
  status,
  rows: initialRows,
  carrier,
  trackingNo,
}: {
  orderId: string;
  status: string;
  rows: Row[];
  carrier: string | null;
  trackingNo: string | null;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const payload = rows.map((row) => ({
    orderItemId: row.orderItemId,
    packedQuantity: row.packedQuantity,
    willShip: row.willShip,
    isChecked: row.isChecked,
  }));

  async function save() {
    setSaving(true);
    setMessage("");

    const response = await fetch(
      `/api/packer/orders/${orderId}/save-packing`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      },
    );

    const result = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(result.error ?? "บันทึกจำนวนไม่สำเร็จ");
      return false;
    }

    setMessage("บันทึกจำนวนที่จัดส่งแล้ว");
    return true;
  }

  async function complete() {
    if (rows.some((row) => !row.isChecked)) {
      setMessage("กรุณาติ๊กตรวจสอบสินค้าทุกรายการก่อน");
      return;
    }

    const saved = await save();
    if (!saved) return;

    setSaving(true);

    const response = await fetch(
      `/api/packer/orders/${orderId}/complete-packing`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      },
    );

    const result = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(result.error ?? "ยืนยันแพ็กเสร็จไม่สำเร็จ");
      return;
    }

    setMessage("ยืนยันว่าแพ็กเสร็จแล้ว");
    router.refresh();
  }

  if (status === "shipped") {
    return (
      <section className="rounded-[24px] border border-green-200 bg-green-50 p-6">
        <h2 className="text-xl font-bold text-green-700">จัดส่งแล้ว</h2>
        <p className="mt-3 text-green-700">
          {carrier || "บริษัทขนส่ง"} · {trackingNo || "ไม่มีเลขพัสดุ"}
        </p>
      </section>
    );
  }

  if (status === "packed") {
    return (
      <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
        <h2 className="font-bold">แพ็กเสร็จแล้ว</h2>
        <p className="mt-2 text-sm text-[#8a8a9e]">
          พร้อมบันทึกบริษัทขนส่งและเลขพัสดุ
        </p>
      </section>
    );
  }

  if (status !== "packing") {
    return null;
  }

  return (
    <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
      <h2 className="font-bold">ยืนยันสินค้าที่จะจัดส่งจริง</h2>

      <div className="mt-4 space-y-4">
        {rows.map((row, index) => (
          <article
            key={row.orderItemId}
            className="rounded-2xl border border-[#f4d4e1] p-4"
          >
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={row.willShip}
                onChange={(event) => {
                  const next = [...rows];
                  next[index] = {
                    ...next[index],
                    willShip: event.target.checked,
                    packedQuantity: event.target.checked
                      ? Math.max(1, next[index].packedQuantity)
                      : 0,
                  };
                  setRows(next);
                }}
                className="mt-1 h-5 w-5"
              />

              <div>
                <p className="font-semibold">จัดส่งรายการนี้</p>
                <p className="mt-1 text-sm text-[#8a8a9e]">
                  {row.name} · {row.color} · {row.power}
                </p>
                <p className="mt-1 text-sm">
                  ลูกค้าสั่ง {row.orderedQuantity} คู่
                </p>
              </div>
            </label>

            {row.willShip && (
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#fff8fb] p-3">
                <span className="text-sm">จำนวนที่จะส่งจริง</span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...rows];
                      next[index] = {
                        ...next[index],
                        packedQuantity: Math.max(
                          1,
                          next[index].packedQuantity - 1,
                        ),
                      };
                      setRows(next);
                    }}
                    className="h-9 w-9 rounded-full border border-[#f3bfd4] bg-white"
                  >
                    −
                  </button>

                  <span className="w-8 text-center font-semibold">
                    {row.packedQuantity}
                  </span>

                  <button
                    type="button"
                    disabled={row.packedQuantity >= row.orderedQuantity}
                    onClick={() => {
                      const next = [...rows];
                      next[index] = {
                        ...next[index],
                        packedQuantity: Math.min(
                          next[index].orderedQuantity,
                          next[index].packedQuantity + 1,
                        ),
                      };
                      setRows(next);
                    }}
                    className="h-9 w-9 rounded-full border border-[#f3bfd4] bg-white disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <label className="mt-4 flex items-center gap-3 rounded-2xl border border-[#f4d4e1] p-3">
              <input
                type="checkbox"
                checked={row.isChecked}
                onChange={(event) => {
                  const next = [...rows];
                  next[index] = {
                    ...next[index],
                    isChecked: event.target.checked,
                  };
                  setRows(next);
                }}
                className="h-5 w-5"
              />
              <span className="text-sm font-medium">
                ตรวจสอบรายการและจำนวนแล้ว
              </span>
            </label>
          </article>
        ))}
      </div>

      {message && (
        <p className="mt-4 rounded-2xl bg-[#fff0f6] p-3 text-sm text-[#f76da8]">
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-5 h-12 w-full rounded-full border border-[#f76da8] bg-white font-semibold text-[#f76da8] disabled:opacity-50"
      >
        {saving ? "กำลังบันทึก..." : "บันทึกจำนวนที่จัดส่ง"}
      </button>

      <button
        type="button"
        onClick={complete}
        disabled={saving}
        className="mt-3 h-12 w-full rounded-full bg-[#f76da8] font-semibold text-white disabled:opacity-50"
      >
        {saving ? "กำลังบันทึก..." : "ยืนยันว่าแพ็กเสร็จแล้ว"}
      </button>
    </section>
  );
}
