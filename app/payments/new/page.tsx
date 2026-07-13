"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Order = {
  id: string;
  order_no: string;
  status: string;
  fulfillment_status: string | null;
  payment_status: string | null;
  final_total: number | null;
  total_amount: number | null;
  paid_amount: number | null;
  outstanding_amount: number | null;
};

type BatchOrder = {
  orderId: string;
  orderNo: string;
  amountApplied: number;
};

type Batch = {
  id: string;
  batch_no?: string | null;
  status?: string | null;
  verification_status?: string | null;
  slip_image_url?: string | null;
  created_at: string;
  orders: BatchOrder[];
  orderIds: string[];
  calculatedTotal: number;
};

export default function PaymentPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const profileId = localStorage.getItem("kitty_profile_id");
    if (!profileId) return;

    const response = await fetch(
      `/api/customer-payment-overview?profileId=${encodeURIComponent(profileId)}`,
      { cache: "no-store" },
    );
    const result = await response.json();

    if (response.ok) {
      setOrders(result.orders ?? []);
      setBatches(result.batches ?? []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const activeOrderIds = new Set(
    batches
      .filter((batch) => {
        const status =
          batch.verification_status ?? batch.status ?? "not_submitted";
        return !["approved", "paid", "rejected", "cancelled"].includes(status);
      })
      .flatMap((batch) => batch.orderIds ?? []),
  );

  const selectable = orders.filter((order) => {
    const fulfillment = order.fulfillment_status ?? order.status;
    const closed = ["rejected", "cancelled"].includes(fulfillment);
    const paid = order.payment_status === "paid";
    return !closed && !paid && !activeOrderIds.has(order.id);
  });

  const pendingBatches = batches.filter((batch) => {
    const status =
      batch.verification_status ?? batch.status ?? "not_submitted";
    return !["approved", "paid", "rejected", "cancelled"].includes(status);
  });

  const total = useMemo(
    () =>
      selectable
        .filter((order) => selected.includes(order.id))
        .reduce(
          (sum, order) =>
            sum +
            Math.max(
              0,
              Number(
                order.outstanding_amount ??
                  (order.final_total ?? order.total_amount ?? 0) -
                    Number(order.paid_amount ?? 0),
              ),
            ),
          0,
        ),
    [selectable, selected],
  );

  async function createBatch() {
    const customerId = localStorage.getItem("kitty_profile_id");

    if (!customerId || selected.length === 0) {
      setMessage("กรุณาเลือกออเดอร์อย่างน้อย 1 รายการ");
      return;
    }

    const response = await fetch("/api/payment-batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, orderIds: selected }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "สร้างรายการชำระเงินไม่สำเร็จ");
      return;
    }

    router.push(`/payments/${result.batchId}`);
  }

  return (
    <main className="min-h-screen bg-[#fff5f9] px-4 py-6">
      <div className="mx-auto max-w-md pt-10">
        <header>
          <p className="text-sm text-[#8a8a9e]">ชำระเงิน</p>
          <h1 className="text-2xl font-bold">เลือกออเดอร์ที่ต้องการชำระ</h1>
        </header>

        {pendingBatches.length > 0 && (
          <section className="mt-6">
            <h2 className="font-bold">รายการชำระที่กำลังดำเนินการ</h2>
            <div className="mt-3 space-y-3">
              {pendingBatches.map((batch) => {
                const hasSlip = Boolean(batch.slip_image_url);
                const totalAmount = Number(
                  batch.calculatedTotal ?? batch.orders?.reduce(
                    (sum, item) => sum + Number(item.amountApplied ?? 0),
                    0,
                  ) ?? 0,
                );

                return (
                  <Link
                    key={batch.id}
                    href={`/payments/${batch.id}`}
                    className="block rounded-[22px] border border-[#f1d7df] bg-white p-4 shadow-sm active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-[#8a8a9e]">
                          {batch.batch_no ?? "รายการชำระ"}
                        </p>
                        <p className={`mt-1 font-bold ${hasSlip ? "text-green-700" : "text-amber-700"}`}>
                          {hasSlip
                            ? "ส่งสลิปแล้ว — รอร้านค้าตรวจสอบ"
                            : "ยังไม่ได้ส่งสลิป — กดเพื่อชำระต่อ"}
                        </p>
                      </div>

                      <span className="shrink-0 text-lg font-bold text-[#f76da8]">
                        ฿{totalAmount.toLocaleString("th-TH")}
                      </span>
                    </div>

                    <div className="mt-3 rounded-2xl bg-[#fff7fa] p-3">
                      <p className="text-xs font-semibold text-[#6f6872]">
                        ออเดอร์ที่เลือก {batch.orders?.length ?? 0} รายการ
                      </p>
                      <div className="mt-2 space-y-1">
                        {(batch.orders ?? []).map((item) => (
                          <div
                            key={item.orderId}
                            className="flex items-center justify-between gap-3 text-sm"
                          >
                            <span className="font-medium text-[#383541]">
                              {item.orderNo}
                            </span>
                            <span className="font-semibold text-[#6f6872]">
                              ฿{Number(item.amountApplied).toLocaleString("th-TH")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-6 space-y-3">
          <h2 className="font-bold">ออเดอร์ที่เลือกชำระได้</h2>

          {selectable.map((order) => {
            const due = Math.max(
              0,
              Number(
                order.outstanding_amount ??
                  (order.final_total ?? order.total_amount ?? 0) -
                    Number(order.paid_amount ?? 0),
              ),
            );

            return (
              <label
                key={order.id}
                className="block rounded-[22px] border border-[#f4d4e1] bg-white p-4 shadow-sm"
              >
                <div className="flex gap-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(order.id)}
                    onChange={(event) =>
                      setSelected((current) =>
                        event.target.checked
                          ? [...current, order.id]
                          : current.filter((id) => id !== order.id),
                      )
                    }
                    className="mt-1 h-5 w-5"
                  />

                  <div className="flex-1">
                    <p className="font-semibold">{order.order_no}</p>
                    <p className="mt-2 font-bold text-[#f76da8]">
                      ค้างชำระ ฿{due.toLocaleString("th-TH")}
                    </p>
                  </div>
                </div>
              </label>
            );
          })}

          {selectable.length === 0 && (
            <div className="rounded-[22px] border border-[#f4d4e1] bg-white p-5 text-center text-sm text-[#8a8a9e]">
              ไม่มีออเดอร์ใหม่ที่เลือกชำระได้
            </div>
          )}
        </section>

        <section className="mt-6 rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
          <div className="flex justify-between">
            <span className="font-semibold">ยอดที่เลือก</span>
            <span className="text-xl font-bold text-[#f76da8]">
              ฿{total.toLocaleString("th-TH")}
            </span>
          </div>

          {message && (
            <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-600">
              {message}
            </p>
          )}

          <button
            type="button"
            onClick={createBatch}
            disabled={selected.length === 0}
            className="mt-5 h-14 w-full rounded-full bg-[#f76da8] font-semibold text-white disabled:opacity-40"
          >
            ดำเนินการชำระเงิน
          </button>
        </section>
      </div>
    </main>
  );
}
