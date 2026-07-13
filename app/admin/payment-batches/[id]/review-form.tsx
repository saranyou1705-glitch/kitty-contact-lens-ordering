"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewForm({
  batchId,
  status,
  currentReason,
  disabled,
}: {
  batchId: string;
  status?: string | null;
  currentReason: string | null;
  disabled: boolean;
}) {
  const router = useRouter();
  const [reason, setReason] = useState(currentReason ?? "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function review(action: "approve" | "reject") {
    if (!batchId) {
      setMessage("ไม่พบรหัสรายการชำระเงิน");
      return;
    }

    if (!reason.trim()) {
      setMessage("กรุณาระบุเหตุผล");
      return;
    }

    const confirmation =
      action === "approve"
        ? "ยืนยันว่าร้านค้าได้รับยอดเงินรายการนี้แล้ว?"
        : "ยืนยันว่าต้องการปฏิเสธหลักฐานการโอนนี้?";

    if (!window.confirm(confirmation)) return;

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/payment-batches/${encodeURIComponent(batchId)}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, reason: reason.trim() }),
        },
      );

      const contentType = response.headers.get("content-type") ?? "";
      const result = contentType.includes("application/json")
        ? await response.json()
        : { error: await response.text() };

      if (!response.ok) {
        throw new Error(
          result.error || `บันทึกผลไม่สำเร็จ (${response.status})`,
        );
      }

      setMessage(
        action === "approve"
          ? "ยืนยันการชำระเงินแล้ว"
          : "ปฏิเสธหลักฐานการโอนแล้ว",
      );

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "บันทึกผลการตรวจสอบไม่สำเร็จ",
      );
    } finally {
      setSaving(false);
    }
  }

  const normalizedStatus = status ?? "not_submitted";
  const canReview = [
    "pending",
    "payment_pending",
    "pending_review",
    "under_review",
  ].includes(normalizedStatus);

  if (!canReview) {
    return (
      <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
        <h2 className="font-bold">ผลการตรวจสอบ</h2>
        <p className="mt-3 text-sm">{statusLabel(normalizedStatus)}</p>
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
      <h2 className="font-bold">ตรวจสอบหลักฐานการโอน</h2>

      <textarea
        rows={4}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="กรอกเหตุผลหรือหมายเหตุ เช่น ตรวจสอบยอดและชื่อบัญชีแล้ว"
        className="mt-4 w-full rounded-2xl border border-[#f3bfd4] px-4 py-3"
      />

      {message && (
        <p className="mt-3 rounded-2xl bg-[#fff0f6] p-3 text-sm text-[#f76da8]">
          {message}
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={saving || disabled}
          onClick={() => review("reject")}
          className="h-12 rounded-full border border-red-300 font-semibold text-red-500 disabled:opacity-40"
        >
          {saving ? "กำลังบันทึก..." : "ปฏิเสธหลักฐาน"}
        </button>

        <button
          type="button"
          disabled={saving || disabled}
          onClick={() => review("approve")}
          className="h-12 rounded-full bg-[#f76da8] font-semibold text-white disabled:opacity-40"
        >
          {saving ? "กำลังบันทึก..." : "ยืนยันว่าได้รับยอดแล้ว"}
        </button>
      </div>

      {disabled && (
        <p className="mt-3 text-center text-xs text-[#8a8a9e]">
          ยังไม่มีหลักฐานการโอน จึงยังตรวจสอบไม่ได้
        </p>
      )}
    </section>
  );
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    not_submitted: "รอหลักฐานการโอน",
    awaiting_payment: "รอหลักฐานการโอน",
    awaiting_slip: "รอหลักฐานการโอน",
    unpaid: "รอหลักฐานการโอน",
    pending: "รอตรวจสอบ",
    payment_pending: "รอตรวจสอบ",
    pending_review: "รอตรวจสอบ",
    under_review: "กำลังตรวจสอบ",
    approved: "ยืนยันการชำระเงินแล้ว",
    paid: "ยืนยันการชำระเงินแล้ว",
    partially_paid: "ชำระบางส่วน",
    rejected: "ปฏิเสธการชำระแล้ว",
    cancelled: "ยกเลิกแล้ว",
  };

  return map[status] ?? "รอหลักฐานการโอน";
}
