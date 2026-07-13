"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RejectOrderForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  async function rejectOrder() {
    if (!reason.trim()) {
      setMessage("กรุณาระบุเหตุผลที่ปฏิเสธ");
      return;
    }

    const confirmed = window.confirm("ยืนยันว่าต้องการปฏิเสธออเดอร์นี้?");
    if (!confirmed) return;

    const response = await fetch(`/api/admin/orders/${orderId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });

    const result = await response.json();
    setMessage(response.ok ? "ปฏิเสธออเดอร์แล้ว" : result.error);

    if (response.ok) router.refresh();
  }

  return (
    <section className="rounded-[24px] border border-red-200 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-red-600">ปฏิเสธออเดอร์</h2>
      <textarea
        rows={3}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="ระบุเหตุผลที่ปฏิเสธ"
        className="mt-4 w-full rounded-2xl border border-red-200 px-4 py-3"
      />

      {message && <p className="mt-3 text-sm text-red-600">{message}</p>}

      <button
        type="button"
        onClick={rejectOrder}
        className="mt-4 h-12 w-full rounded-full border border-red-300 font-semibold text-red-600"
      >
        ปฏิเสธออเดอร์
      </button>
    </section>
  );
}
