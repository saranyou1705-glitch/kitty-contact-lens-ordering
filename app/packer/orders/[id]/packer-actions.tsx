"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PackerActions({
  orderId,
  status,
  initialCarrier,
  initialTrackingNo,
}: {
  orderId: string;
  status: string;
  initialCarrier: string | null;
  initialTrackingNo: string | null;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [carrier, setCarrier] = useState(initialCarrier ?? "");
  const [trackingNo, setTrackingNo] = useState(initialTrackingNo ?? "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function updateStatus(action: "start_packing" | "mark_packed") {
    if (!reason.trim()) {
      setMessage("กรุณาระบุเหตุผล");
      return;
    }

    setSaving(true);
    setMessage("");

    const response = await fetch(`/api/packer/orders/${orderId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });

    const result = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(result.error ?? "อัปเดตไม่สำเร็จ");
      return;
    }

    setReason("");
    setMessage("อัปเดตสถานะเรียบร้อยแล้ว");
    router.refresh();
  }

  async function markShipped() {
    if (!reason.trim() || !carrier.trim() || !trackingNo.trim()) {
      setMessage("กรุณากรอกบริษัทขนส่ง เลขพัสดุ และเหตุผลให้ครบ");
      return;
    }

    setSaving(true);
    setMessage("");

    const response = await fetch(`/api/packer/orders/${orderId}/tracking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingNo, carrier, reason }),
    });

    const result = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(result.error ?? "บันทึกเลขพัสดุไม่สำเร็จ");
      return;
    }

    setMessage("บันทึกการจัดส่งเรียบร้อยแล้ว");
    router.refresh();
  }

  return (
    <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
      <h2 className="font-bold">ดำเนินการ</h2>

      <p className="mt-2 text-sm text-[#8a8a9e]">
        สถานะปัจจุบัน: {status}
      </p>

      <textarea
        rows={3}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="ระบุเหตุผล เช่น ตรวจสอบรายการครบแล้ว"
        className="mt-4 w-full rounded-2xl border border-[#f3bfd4] px-4 py-3 outline-none"
      />

      {status === "payment_confirmed" && (
        <button
          type="button"
          disabled={saving}
          onClick={() => updateStatus("start_packing")}
          className="mt-4 h-12 w-full rounded-full bg-[#f76da8] font-semibold text-white disabled:opacity-60"
        >
          เริ่มแพ็ก
        </button>
      )}

      {status === "packing" && (
        <button
          type="button"
          disabled={saving}
          onClick={() => updateStatus("mark_packed")}
          className="mt-4 h-12 w-full rounded-full bg-[#f76da8] font-semibold text-white disabled:opacity-60"
        >
          แพ็กเสร็จแล้ว
        </button>
      )}

      {status === "packed" && (
        <div className="mt-4 space-y-3">
          <select
            value={carrier}
            onChange={(event) => setCarrier(event.target.value)}
            className="h-12 w-full rounded-2xl border border-[#f3bfd4] bg-white px-4"
          >
            <option value="">เลือกบริษัทขนส่ง</option>
            <option value="Flash Express">Flash Express</option>
            <option value="Kerry Express">Kerry Express</option>
            <option value="J&T Express">J&T Express</option>
            <option value="Thailand Post">ไปรษณีย์ไทย</option>
            <option value="Other">อื่น ๆ</option>
          </select>

          <input
            value={trackingNo}
            onChange={(event) => setTrackingNo(event.target.value)}
            placeholder="เลขพัสดุ"
            className="h-12 w-full rounded-2xl border border-[#f3bfd4] px-4"
          />

          <button
            type="button"
            disabled={saving}
            onClick={markShipped}
            className="h-12 w-full rounded-full bg-[#f76da8] font-semibold text-white disabled:opacity-60"
          >
            บันทึกและทำเครื่องหมายว่าจัดส่งแล้ว
          </button>
        </div>
      )}

      {message && (
        <p className="mt-4 rounded-2xl bg-[#fff0f6] px-4 py-3 text-sm text-[#f76da8]">
          {message}
        </p>
      )}
    </section>
  );
}
