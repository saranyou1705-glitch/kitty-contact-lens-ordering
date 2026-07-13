"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CARRIERS = [
  "Flash Express",
  "Kerry Express",
  "J&T Express",
  "Thailand Post",
  "Ninja Van",
  "BEST Express",
  "DHL",
  "Grab",
  "Lalamove",
  "รับเอง",
  "อื่นๆ",
];

export default function ShippingQuoteForm({
  orderId,
  initialShippingFee,
  initialCarrier,
  initialAdminNote,
}: {
  orderId: string;
  initialShippingFee: number | null;
  initialCarrier: string | null;
  initialAdminNote: string | null;
}) {
  const router = useRouter();
  const initialPreset = CARRIERS.includes(initialCarrier ?? "")
    ? initialCarrier ?? ""
    : initialCarrier
      ? "อื่นๆ"
      : "";

  const [shippingFee, setShippingFee] = useState(
    initialShippingFee?.toString() ?? "",
  );
  const [carrierChoice, setCarrierChoice] = useState(initialPreset);
  const [customCarrier, setCustomCarrier] = useState(
    initialPreset === "อื่นๆ" ? initialCarrier ?? "" : "",
  );
  const [adminNote, setAdminNote] = useState(initialAdminNote ?? "");
  const [message, setMessage] = useState("");

  async function save() {
    const carrier =
      carrierChoice === "อื่นๆ" ? customCarrier.trim() : carrierChoice;

    if (!carrier) {
      setMessage("กรุณาเลือกช่องทางจัดส่ง");
      return;
    }

    const response = await fetch(
      `/api/admin/orders/${orderId}/shipping-quote`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingFee: Number(shippingFee),
          carrier,
          adminNote,
        }),
      },
    );

    const result = await response.json();
    setMessage(response.ok ? "บันทึกค่าจัดส่งแล้ว" : result.error);

    if (response.ok) router.refresh();
  }

  return (
    <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
      <h2 className="font-bold">ค่าจัดส่ง</h2>

      <label className="mt-4 block text-sm font-medium">ค่าจัดส่ง</label>
      <input
        type="number"
        min="0"
        value={shippingFee}
        onChange={(event) => setShippingFee(event.target.value)}
        className="mt-2 h-12 w-full rounded-2xl border border-[#f3bfd4] px-4"
      />

      <label className="mt-4 block text-sm font-medium">ช่องทางจัดส่ง</label>
      <select
        value={carrierChoice}
        onChange={(event) => setCarrierChoice(event.target.value)}
        className="mt-2 h-12 w-full rounded-2xl border border-[#f3bfd4] px-4"
      >
        <option value="">เลือกช่องทางจัดส่ง</option>
        {CARRIERS.map((carrier) => (
          <option key={carrier} value={carrier}>
            {carrier}
          </option>
        ))}
      </select>

      {carrierChoice === "อื่นๆ" && (
        <input
          value={customCarrier}
          onChange={(event) => setCustomCarrier(event.target.value)}
          placeholder="ระบุช่องทางจัดส่ง"
          className="mt-3 h-12 w-full rounded-2xl border border-[#f3bfd4] px-4"
        />
      )}

      <label className="mt-4 block text-sm font-medium">หมายเหตุ</label>
      <textarea
        rows={3}
        value={adminNote}
        onChange={(event) => setAdminNote(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-[#f3bfd4] px-4 py-3"
      />

      {message && <p className="mt-3 text-sm text-[#f76da8]">{message}</p>}

      <button
        type="button"
        onClick={save}
        className="mt-5 h-12 w-full rounded-full bg-[#f76da8] font-semibold text-white"
      >
        บันทึกค่าจัดส่ง
      </button>
    </section>
  );
}
