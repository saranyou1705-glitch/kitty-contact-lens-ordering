"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function PaymentReviewForm({
  paymentId,
  currentStatus,
  currentReason,
}: {
  paymentId: string;
  currentStatus: string;
  currentReason: string | null;
}) {
  const router = useRouter();
  const [reason, setReason] = useState(currentReason ?? "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function review(action: "approve" | "reject") {
    setMessage("");

    if (!reason.trim()) {
      setMessage("กรุณาระบุเหตุผล");
      return;
    }

    setSaving(true);

    const response = await fetch(
      `/api/admin/payments/${paymentId}/review`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      },
    );

    const result = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(result.error ?? "บันทึกผลไม่สำเร็จ");
      return;
    }

    setMessage(
      action === "approve"
        ? "อนุมัติการชำระเงินเรียบร้อยแล้ว"
        : "ปฏิเสธสลิปเรียบร้อยแล้ว",
    );

    router.refresh();
  }

  if (currentStatus !== "pending") {
    return (
      <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
        <h2 className="font-bold">ผลการตรวจสอบ</h2>
        <p className="mt-3 text-sm text-[#6f6872]">
          สถานะ: {currentStatus === "approved" ? "อนุมัติแล้ว" : "ปฏิเสธแล้ว"}
        </p>
        {currentReason && (
          <p className="mt-2 text-sm text-[#8a8a9e]">
            เหตุผล: {currentReason}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
      <h2 className="font-bold">ยืนยันผลตรวจสอบ</h2>

      <div className="mt-4">
        <label htmlFor="reason" className="mb-2 block text-sm font-medium">
          เหตุผล
        </label>
        <textarea
          id="reason"
          rows={4}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="เช่น ตรวจสอบยอดและชื่อบัญชีผู้รับเรียบร้อยแล้ว"
          className="w-full rounded-2xl border border-[#f3bfd4] px-4 py-3 outline-none focus:border-[#f76da8]"
        />
      </div>

      {message && (
        <p className="mt-4 rounded-2xl bg-[#fff0f6] px-4 py-3 text-sm text-[#f76da8]">
          {message}
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => review("reject")}
          className="h-12 rounded-full border border-red-300 bg-white font-semibold text-red-500 disabled:opacity-60"
        >
          ปฏิเสธสลิป
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={() => review("approve")}
          className="h-12 rounded-full bg-[#f76da8] font-semibold text-white disabled:opacity-60"
        >
          อนุมัติสลิป
        </button>
      </div>
    </section>
  );
}
