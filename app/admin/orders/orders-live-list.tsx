"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Order = {
  id: string;
  order_no: string;
  status: string;
  fulfillment_status: string | null;
  payment_status: string | null;
  final_total: number | null;
  total_amount: number | null;
  created_at: string;
  submitted_at: string | null;
  customer: { full_name: string; phone: string } | null;
};

export default function OrdersLiveList({
  initialOrders,
  initialFilter,
}: {
  initialOrders: Order[];
  initialFilter: string;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState(initialFilter || "action");

  async function refresh() {
    const response = await fetch("/api/admin/orders", { cache: "no-store" });
    const result = await response.json();
    if (response.ok) setOrders(result.orders ?? []);
  }

  useEffect(() => {
    const timer = window.setInterval(refresh, 3000);
    return () => window.clearInterval(timer);
  }, []);

  const shown = useMemo(() => {
    const sorted = [...orders].sort(
      (a, b) =>
        priority(a.fulfillment_status ?? a.status) -
          priority(b.fulfillment_status ?? b.status) ||
        new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime(),
    );

    return sorted.filter((order) => matchesFilter(order, filter));
  }, [orders, filter]);

  return (
    <>
      <div className="mb-4 rounded-[20px] border border-[#f4d4e1] bg-white p-4 shadow-sm">
        <label className="block text-sm font-semibold text-[#6f6872]">
          กรองตามสถานะ
        </label>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="mt-2 h-12 w-full rounded-2xl border border-[#f3bfd4] bg-white px-4 font-medium"
        >
          <option value="action">ต้องจัดการก่อน</option>
          <option value="all">ทั้งหมด</option>
          <option value="submitted">ออเดอร์ใหม่</option>
          <option value="packing">กำลังแพ็ก</option>
          <option value="packed">แพ็กเสร็จแล้ว</option>
          <option value="shipped">จัดส่งแล้ว</option>
          <option value="unpaid">ยังไม่ชำระ</option>
          <option value="rejected">ปฏิเสธ</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-[24px] border border-[#f4d4e1] bg-white shadow-sm">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead className="bg-[#fff0f6] text-left">
            <tr>
              <th className="px-4 py-3">ลำดับงาน</th>
              <th className="px-4 py-3">ออเดอร์</th>
              <th className="px-4 py-3">ลูกค้า</th>
              <th className="px-4 py-3">สถานะจัดส่ง</th>
              <th className="px-4 py-3">สถานะชำระ</th>
              <th className="px-4 py-3 text-right">ยอดรวม</th>
              <th className="px-4 py-3">เวลาสั่ง</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {shown.map((order) => {
              const fulfillment =
                order.fulfillment_status ?? order.status;

              return (
                <tr key={order.id} className="border-t border-[#f4d4e1]">
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityClass(
                        fulfillment,
                      )}`}
                    >
                      {priorityLabel(fulfillment)}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-semibold">{order.order_no}</td>
                  <td className="px-4 py-4">
                    <p className="font-medium">
                      {order.customer?.full_name || "-"}
                    </p>
                    <p className="text-xs text-[#8a8a9e]">
                      {order.customer?.phone || "-"}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    {fulfillmentLabel(fulfillment)}
                  </td>
                  <td className="px-4 py-4">
                    {paymentLabel(order.payment_status ?? "unpaid")}
                  </td>
                  <td className="px-4 py-4 text-right font-semibold">
                    ฿
                    {Number(
                      order.final_total ?? order.total_amount ?? 0,
                    ).toLocaleString("th-TH")}
                  </td>
                  <td className="px-4 py-4 text-xs text-[#8a8a9e]">
                    {new Date(
                      order.submitted_at ?? order.created_at,
                    ).toLocaleString("th-TH")}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="rounded-full bg-[#f76da8] px-4 py-2 text-xs font-semibold text-white"
                    >
                      เปิด
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {shown.length === 0 && (
          <p className="p-8 text-center text-sm text-[#8a8a9e]">
            ไม่มีออเดอร์ในสถานะนี้
          </p>
        )}
      </div>
    </>
  );
}

function matchesFilter(order: Order, filter: string) {
  const fulfillment = order.fulfillment_status ?? order.status;
  const payment = order.payment_status ?? "unpaid";

  if (filter === "all") return true;
  if (filter === "submitted")
    return ["submitted", "shipping_quoted"].includes(fulfillment);
  if (filter === "packing") return fulfillment === "packing";
  if (filter === "packed") return fulfillment === "packed";
  if (filter === "shipped")
    return ["shipped", "completed"].includes(fulfillment);
  if (filter === "unpaid")
    return (
      !["rejected", "cancelled"].includes(fulfillment) &&
      !["paid", "payment_pending"].includes(payment)
    );
  if (filter === "rejected")
    return fulfillment === "rejected" || order.status === "cancelled";

  return (
    !["rejected", "shipped", "completed"].includes(fulfillment) &&
    order.status !== "cancelled"
  );
}

function priority(status: string) {
  if (["submitted", "shipping_quoted"].includes(status)) return 1;
  if (status === "packing") return 2;
  if (status === "packed") return 3;
  return 4;
}

function priorityLabel(status: string) {
  const value = priority(status);
  return value === 1
    ? "เร่งด่วน"
    : value === 2
      ? "ดำเนินการ"
      : value === 3
        ? "ติดตาม"
        : "เสร็จแล้ว";
}

function priorityClass(status: string) {
  const value = priority(status);
  return value === 1
    ? "bg-red-50 text-red-600"
    : value === 2
      ? "bg-amber-50 text-amber-700"
      : value === 3
        ? "bg-blue-50 text-blue-600"
        : "bg-green-50 text-green-600";
}

function fulfillmentLabel(status: string) {
  const map: Record<string, string> = {
    submitted: "รับออเดอร์แล้ว",
    shipping_quoted: "แจ้งค่าจัดส่งแล้ว",
    packing: "กำลังแพ็ก",
    packed: "แพ็กเสร็จแล้ว",
    shipped: "จัดส่งแล้ว",
    completed: "เสร็จสิ้น",
    rejected: "ปฏิเสธแล้ว",
    cancelled: "ยกเลิกแล้ว",
  };
  return map[status] || status;
}

function paymentLabel(status: string) {
  const map: Record<string, string> = {
    unpaid: "ยังไม่ชำระ",
    awaiting_payment: "รอชำระเงิน",
    payment_pending: "รอตรวจสลิป",
    pending: "รอตรวจสลิป",
    partially_paid: "ชำระบางส่วน",
    paid: "ชำระแล้ว",
  };
  return map[status] || status;
}
