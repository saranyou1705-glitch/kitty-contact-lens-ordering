"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Order = {
  id: string;
  order_no: string;
  status: string;
  fulfillment_status: string | null;
  payment_status: string | null;
  paid_amount: number | null;
  final_total: number | null;
  total_amount: number | null;
  outstanding_amount: number | null;
  customer_received_at?: string | null;
  created_at: string;
  submitted_at: string | null;
  carrier: string | null;
  tracking_no: string | null;
  rejection_reason: string | null;
};

type Filter =
  | "all"
  | "active"
  | "unpaid"
  | "payment_pending"
  | "shipped"
  | "completed";

export default function CustomerOrderDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  async function refresh() {
    const profileId = localStorage.getItem("kitty_profile_id");
    if (!profileId) {
      setLoading(false);
      return;
    }

    const response = await fetch(
      `/api/customer-dashboard?profileId=${encodeURIComponent(profileId)}`,
      { cache: "no-store" },
    );
    const result = await response.json();

    if (response.ok) setOrders(result.orders ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const counts = useMemo(
    () => ({
      active: orders.filter(isActive).length,
      unpaid: orders.filter(isUnpaid).length,
      paymentPending: orders.filter(isPaymentPending).length,
      shipped: orders.filter(isShippedOnly).length,
      completed: orders.filter(isCompleted).length,
    }),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    if (filter === "active") return orders.filter(isActive);
    if (filter === "unpaid") return orders.filter(isUnpaid);
    if (filter === "payment_pending") return orders.filter(isPaymentPending);
    if (filter === "shipped") return orders.filter(isShippedOnly);
    if (filter === "completed") return orders.filter(isCompleted);
    return orders;
  }, [orders, filter]);

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">ออเดอร์ของฉัน</h2>
        {filter !== "all" && (
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="rounded-full border border-[#f3bfd4] bg-white px-3 py-2 text-xs font-semibold text-[#f76da8]"
          >
            ดูทั้งหมด
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Summary
          label="กำลังดำเนินการ"
          value={counts.active}
          active={filter === "active"}
          onClick={() => setFilter(filter === "active" ? "all" : "active")}
        />
        <Summary
          label="รอชำระเงิน"
          value={counts.unpaid}
          active={filter === "unpaid"}
          onClick={() => setFilter(filter === "unpaid" ? "all" : "unpaid")}
        />
        <Summary
          label="รอตรวจยอด"
          value={counts.paymentPending}
          active={filter === "payment_pending"}
          onClick={() =>
            setFilter(filter === "payment_pending" ? "all" : "payment_pending")
          }
        />
        <Summary
          label="จัดส่งแล้ว"
          value={counts.shipped}
          active={filter === "shipped"}
          onClick={() => setFilter(filter === "shipped" ? "all" : "shipped")}
        />
        <Summary
          label="สำเร็จแล้ว"
          value={counts.completed}
          active={filter === "completed"}
          onClick={() =>
            setFilter(filter === "completed" ? "all" : "completed")
          }
        />
      </div>

      <p className="mt-4 text-sm font-semibold text-[#6f6872]">
        {filterTitle(filter)} · {filteredOrders.length} ออเดอร์
      </p>

      <div className="mt-3 space-y-3">
        {filteredOrders.map((order) => {
          const fulfillment = order.fulfillment_status ?? order.status;

          return (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-[22px] border border-[#f4d4e1] bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold">{order.order_no}</p>
                  <p className="mt-1 text-sm text-[#8a8a9e]">
                    {displayStatus(order)}
                  </p>
                  <p className="mt-1 text-xs text-[#8a8a9e]">
                    {paymentLabel(order.payment_status)}
                  </p>
                </div>

                <span className="shrink-0 text-lg font-bold text-[#f76da8]">
                  ฿
                  {Number(
                    order.final_total ?? order.total_amount ?? 0,
                  ).toLocaleString("th-TH")}
                </span>
              </div>
            </Link>
          );
        })}

        {!loading && filteredOrders.length === 0 && (
          <div className="rounded-[22px] border border-[#f4d4e1] bg-white p-5 text-center text-sm text-[#8a8a9e]">
            ไม่มีออเดอร์ในสถานะนี้
          </div>
        )}
      </div>
    </section>
  );
}

function isRejected(order: Order) {
  const fulfillment = order.fulfillment_status ?? order.status;
  return fulfillment === "rejected" || fulfillment === "cancelled";
}

function isPaid(order: Order) {
  return (
    order.payment_status === "paid" ||
    Number(order.outstanding_amount ?? 0) === 0
  );
}

function isActive(order: Order) {
  const fulfillment = order.fulfillment_status ?? order.status;
  return ["submitted", "shipping_quoted", "packing", "packed"].includes(
    fulfillment,
  );
}

function isUnpaid(order: Order) {
  return !isRejected(order) && !isPaid(order) && !isPaymentPending(order);
}

function isPaymentPending(order: Order) {
  return [
    "payment_pending",
    "pending",
    "pending_review",
    "under_review",
  ].includes(order.payment_status ?? "");
}

function isShippedOnly(order: Order) {
  const fulfillment = order.fulfillment_status ?? order.status;
  return fulfillment === "shipped" && !order.customer_received_at;
}

function isCompleted(order: Order) {
  return isRejected(order) || Boolean(order.customer_received_at && isPaid(order));
}

function displayStatus(order: Order) {
  if (isCompleted(order)) return "สำเร็จแล้ว";
  const fulfillment = order.fulfillment_status ?? order.status;
  return fulfillmentLabel(fulfillment);
}

function Summary({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-[20px] border p-3 text-center shadow-sm transition active:scale-[0.98] ${
        active
          ? "border-[#f76da8] bg-[#f76da8] text-white"
          : "border-[#f4d4e1] bg-white"
      }`}
    >
      <p className={`text-2xl font-bold ${active ? "text-white" : "text-[#f76da8]"}`}>
        {value}
      </p>
      <p className={`mt-1 text-[11px] ${active ? "text-white" : "text-[#8a8a9e]"}`}>
        {label}
      </p>
      <p className={`mt-1 text-[10px] ${active ? "text-white/90" : "text-[#b0a8b2]"}`}>
        กดเพื่อดู
      </p>
    </button>
  );
}

function filterTitle(filter: Filter) {
  const map: Record<Filter, string> = {
    all: "ออเดอร์ทั้งหมด",
    active: "ออเดอร์ที่กำลังดำเนินการ",
    unpaid: "ออเดอร์ที่รอชำระเงิน",
    payment_pending: "ออเดอร์ที่รอตรวจยอด",
    shipped: "ออเดอร์ที่จัดส่งแล้ว",
    completed: "ออเดอร์ที่สำเร็จแล้ว",
  };
  return map[filter];
}

function fulfillmentLabel(status: string) {
  const map: Record<string, string> = {
    submitted: "รอแอดมินยืนยันออเดอร์",
    shipping_quoted: "รอแพ็ก",
    packing: "กำลังจัดสินค้า",
    packed: "รอส่ง",
    shipped: "จัดส่งแล้ว",
    completed: "สำเร็จแล้ว",
    rejected: "ปฏิเสธแล้ว",
    cancelled: "ยกเลิกแล้ว",
  };
  return map[status] ?? status;
}

function paymentLabel(status?: string | null) {
  const map: Record<string, string> = {
    unpaid: "ยังไม่ชำระ",
    awaiting_payment: "รอชำระเงิน",
    payment_pending: "รอตรวจสอบการชำระ",
    pending: "รอตรวจสอบการชำระ",
    pending_review: "รอตรวจสอบการชำระ",
    under_review: "กำลังตรวจสอบการชำระ",
    partially_paid: "ชำระบางส่วน",
    paid: "ชำระแล้ว",
  };
  return map[status ?? ""] ?? status ?? "-";
}
