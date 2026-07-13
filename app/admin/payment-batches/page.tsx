"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Batch = {
  id: string;
  batch_no?: string | null;
  created_at: string;
  updated_at?: string | null;
  status?: string | null;
  verification_status?: string | null;
  slip_image_url?: string | null;
  slip_url?: string | null;
  total_amount?: number | null;
  amount?: number | null;
  customer: { full_name: string; phone: string } | null;
  orders: Array<{
    amount_applied: number;
    order: { id: string; order_no: string } | null;
  }>;
};

export default function AdminPaymentBatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/admin/payment-batches", {
      cache: "no-store",
    });
    const result = await response.json();

    if (!response.ok) {
      setError(result.error ?? "โหลดรายการชำระเงินไม่สำเร็จ");
      return;
    }

    setError("");
    setBatches(result.batches ?? []);
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 5000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-[#fff5f9] px-3 py-5 sm:px-5 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex items-center gap-3 sm:mb-8">
          <Link
            href="/admin"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#f4cadb] bg-white text-xl font-bold text-[#f76da8] shadow-sm"
            aria-label="กลับหน้าแอดมิน"
          >
            ←
          </Link>
          <div>
            <p className="text-sm text-[#8a8a9e]">ระบบหลังบ้าน</p>
            <h1 className="text-2xl font-bold sm:text-3xl">ตรวจการชำระเงิน</h1>
          </div>
        </header>

        {error && (
          <div className="mb-5 rounded-2xl bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-[22px] border border-[#f4d4e1] bg-white shadow-sm">
          <table className="w-full table-fixed text-sm">
            <thead className="bg-[#fff0f6] text-left">
              <tr>
                <th className="w-[24%] px-3 py-3 sm:w-[18%] sm:px-4">ลูกค้า</th>
                <th className="w-[28%] px-3 py-3 sm:w-[28%] sm:px-4">ออเดอร์</th>
                <th className="w-[18%] px-2 py-3 sm:w-[16%] sm:px-4">สถานะ</th>
                <th className="hidden w-[12%] px-3 py-3 text-right sm:table-cell sm:px-4">ยอด</th>
                <th className="hidden w-[18%] px-3 py-3 md:table-cell md:px-4">วันที่อัปเดต</th>
                <th className="w-[30%] px-2 py-3 text-right sm:w-[20%] sm:px-4" />
              </tr>
            </thead>

            <tbody>
              {batches.map((batch) => {
                const status = batch.verification_status ?? batch.status;
                const hasSlip = Boolean(batch.slip_image_url ?? batch.slip_url);
                const updatedAt = batch.updated_at ?? batch.created_at;
                const orderNos = batch.orders
                  .map((item) => item.order?.order_no)
                  .filter(Boolean) as string[];

                return (
                  <tr key={batch.id} className="border-t border-[#f4d4e1] align-top">
                    <td className="px-3 py-4 sm:px-4">
                      <p className="break-words font-semibold">
                        {batch.customer?.full_name ?? "-"}
                      </p>
                      <p className="mt-1 break-all text-xs text-[#8a8a9e]">
                        {batch.customer?.phone ?? "-"}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-[#f76da8] sm:hidden">
                        ฿{Number(batch.total_amount ?? batch.amount ?? 0).toLocaleString("th-TH")}
                      </p>
                    </td>

                    <td className="px-3 py-4 sm:px-4">
                      <div className="space-y-1">
                        {orderNos.length > 0 ? (
                          orderNos.map((orderNo) => (
                            <p key={orderNo} className="break-words font-medium leading-5">
                              {orderNo}
                            </p>
                          ))
                        ) : (
                          <p>-</p>
                        )}
                      </div>
                      <p className="mt-2 text-[11px] leading-4 text-[#8a8a9e] md:hidden">
                        อัปเดต {new Date(updatedAt).toLocaleString("th-TH")}
                      </p>
                    </td>

                    <td className="px-2 py-4 sm:px-4">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-center text-[11px] font-semibold leading-4 sm:px-3 sm:text-xs ${statusClass(
                          status,
                          hasSlip,
                        )}`}
                      >
                        {statusLabel(status, hasSlip)}
                      </span>
                    </td>

                    <td className="hidden px-3 py-4 text-right font-semibold sm:table-cell sm:px-4">
                      ฿{Number(batch.total_amount ?? batch.amount ?? 0).toLocaleString("th-TH")}
                    </td>

                    <td className="hidden px-3 py-4 text-xs leading-5 text-[#8a8a9e] md:table-cell md:px-4">
                      {new Date(updatedAt).toLocaleString("th-TH")}
                    </td>

                    <td className="px-2 py-4 text-right sm:px-4">
                      <Link
                        href={`/admin/payment-batches/${batch.id}`}
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#f76da8] px-2 text-center text-xs font-semibold text-white sm:w-auto sm:min-w-24 sm:rounded-full sm:px-4"
                      >
                        ตรวจสอบ
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {batches.length === 0 && !error && (
            <p className="p-8 text-center text-sm text-[#8a8a9e]">
              ยังไม่มีรายการชำระเงิน
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function statusLabel(status?: string | null, hasSlip = false) {
  const map: Record<string, string> = {
    awaiting_payment: "รอหลักฐานการโอน",
    awaiting_slip: "รอหลักฐานการโอน",
    unpaid: "รอหลักฐานการโอน",
    pending: "รอตรวจสอบ",
    payment_pending: "รอตรวจสอบ",
    pending_review: "รอตรวจสอบ",
    under_review: "กำลังตรวจสอบ",
    approved: "ยืนยันการชำระแล้ว",
    paid: "ยืนยันการชำระแล้ว",
    partially_paid: "ชำระบางส่วน",
    rejected: "ปฏิเสธการชำระ",
    cancelled: "ยกเลิก",
  };

  if (status && map[status]) return map[status];
  return hasSlip ? "รอตรวจสอบ" : "รอหลักฐานการโอน";
}

function statusClass(status?: string | null, hasSlip = false) {
  if (["approved", "paid"].includes(status ?? "")) {
    return "bg-green-50 text-green-700";
  }
  if (["rejected", "cancelled"].includes(status ?? "")) {
    return "bg-red-50 text-red-600";
  }
  if (
    hasSlip ||
    ["pending", "payment_pending", "pending_review", "under_review"].includes(
      status ?? "",
    )
  ) {
    return "bg-amber-50 text-amber-700";
  }
  return "bg-blue-50 text-blue-700";
}
