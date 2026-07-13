"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TrackingForm({
  orderId,
  initialCarrier,
  initialTrackingNo,
}: {
  orderId: string;
  initialCarrier: string | null;
  initialTrackingNo: string | null;
}) {
  const router = useRouter();
  const [carrier, setCarrier] = useState(initialCarrier ?? "");
  const [trackingNo, setTrackingNo] = useState(initialTrackingNo ?? "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!carrier.trim() || !trackingNo.trim()) {
      setMessage("กรุณากรอกบริษัทขนส่งและเลขพัสดุ");
      return;
    }

    setSaving(true);
    setMessage("");

    const response = await fetch(
      `/api/packer/orders/${orderId}/tracking`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carrier,
          trackingNo,
        }),
      },
    );

    const result = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(result.error ?? "บันทึกการจัดส่งไม่สำเร็จ");
      return;
    }

    setMessage("บันทึกจัดส่งแล้ว");
    router.refresh();
  }

  return (
    <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
      <h2 className="font-bold">บันทึกการจัดส่ง</h2>
      <p className="mt-2 text-sm text-[#8a8a9e]">
        หนึ่งออเดอร์มีเลขพัสดุของตัวเอง
      </p>

      <label className="mt-4 block text-sm font-medium">บริษัทขนส่ง</label>
      <input
        value={carrier}
        onChange={(event) => setCarrier(event.target.value)}
        placeholder="เช่น Flash Express"
        className="mt-2 h-12 w-full rounded-2xl border border-[#f3bfd4] px-4"
      />

      <label className="mt-4 block text-sm font-medium">เลขพัสดุ</label>
      <input
        value={trackingNo}
        onChange={(event) => setTrackingNo(event.target.value)}
        placeholder="กรอกเลข Tracking"
        className="mt-2 h-12 w-full rounded-2xl border border-[#f3bfd4] px-4"
      />

      {message && (
        <p className="mt-3 rounded-2xl bg-[#fff0f6] p-3 text-sm text-[#f76da8]">
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-5 h-12 w-full rounded-full bg-[#f76da8] font-semibold text-white disabled:opacity-50"
      >
        {saving ? "กำลังบันทึก..." : "ยืนยันว่าจัดส่งแล้ว"}
      </button>
    </section>
  );
}
