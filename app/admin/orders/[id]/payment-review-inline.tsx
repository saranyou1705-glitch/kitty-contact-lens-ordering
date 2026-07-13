"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PaymentReviewInline({
  orderId,
  paymentId,
  currentStatus,
}: {
  orderId: string;
  paymentId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  async function review(action: "approve" | "reject") {
    if (!reason.trim()) {
      setMessage("กรุณาระบุเหตุผล");
      return;
    }

    const response = await fetch(
      `/api/admin/orders/${orderId}/payment-review`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          action,
          reason,
        }),
      },
    );

    const result = await response.json();
    setMessage(response.ok ? "บันทึกผลแล้ว" : result.error);

    if (response.ok) {
      router.refresh();
    }
  }

  if (currentStatus !== "pending") {
    return (
      <p className="mt-4 text-sm text-[#8a8a9e]">
        สถานะ: {currentStatus}
      </p>
    );
  }

  return (
    <div className="mt-5">
      <textarea
        rows={3}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="เหตุผลในการอนุมัติหรือปฏิเสธ"
        className="w-full rounded-2xl border border-[#f3bfd4] px-4 py-3"
      />

      {message && (
        <p className="mt-3 text-sm text-[#f76da8]">{message}</p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => review("reject")}
          className="h-11 rounded-full border border-red-300 font-semibold text-red-500"
        >
          ปฏิเสธ
        </button>
        <button
          type="button"
          onClick={() => review("approve")}
          className="h-11 rounded-full bg-[#f76da8] font-semibold text-white"
        >
          อนุมัติ
        </button>
      </div>
    </div>
  );
}
