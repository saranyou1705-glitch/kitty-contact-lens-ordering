import { createAdminClient } from "@/lib/supabase/admin";
import TrackingCard from "./tracking-card";
import DuplicateOrderButton from "./duplicate-order-button";
import RejectionCard from "./rejection-card";
import ConfirmReceivedForm from "./confirm-received-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (orderError || !order) {
    return (
      <main className="min-h-screen bg-[#fff5f9] px-5 py-8">
        <div className="mx-auto max-w-md rounded-[24px] border border-red-200 bg-red-50 p-6 text-red-700">
          <h1 className="text-xl font-bold">ไม่พบคำสั่งซื้อ</h1>
          <p className="mt-2 text-sm">
            {orderError?.message ?? "ไม่พบข้อมูลออเดอร์นี้"}
          </p>
        </div>
      </main>
    );
  }

  const [{ data: items }, { data: address }, { data: paymentLinks }] =
    await Promise.all([
    supabase
      .from("order_items")
      .select(`
        id,
        model_name_snapshot,
        color_name_snapshot,
        power_snapshot,
        unit_price,
        quantity,
        original_quantity,
        fulfilled_quantity,
        fulfillment_changed,
        line_total,
        adjusted_line_total
      `)
      .eq("order_id", id)
      .order("created_at"),
    supabase
      .from("customer_addresses")
      .select("*")
      .eq("id", order.address_id)
      .maybeSingle(),
    supabase
      .from("payment_batch_orders")
      .select("payment_batch_id, amount_applied")
      .eq("order_id", id),
  ]);

  const batchIds = [
    ...new Set((paymentLinks ?? []).map((item) => item.payment_batch_id)),
  ];

  let paymentBatches: any[] = [];

  if (batchIds.length > 0) {
    const { data } = await supabase
      .from("payment_batches")
      .select("id, status, verification_status")
      .in("id", batchIds);

    paymentBatches = data ?? [];
  }

  const batchMap = new Map(
    paymentBatches.map((batch) => [batch.id, batch]),
  );

  const relatedPayments = (paymentLinks ?? [])
    .map((link) => ({
      ...link,
      batch: batchMap.get(link.payment_batch_id),
    }))
    .filter((item) => item.batch);

  const approvedAmount = relatedPayments
    .filter((item) =>
      ["approved", "paid"].includes(
        item.batch.verification_status ?? item.batch.status ?? "",
      ),
    )
    .reduce(
      (sum, item) => sum + Number(item.amount_applied ?? 0),
      0,
    );

  const hasPendingPayment = relatedPayments.some((item) =>
    [
      "pending",
      "payment_pending",
      "pending_review",
      "under_review",
    ].includes(item.batch.verification_status ?? item.batch.status ?? ""),
  );

  const fulfillmentStatus = order.fulfillment_status ?? order.status;
  const finalSubtotal = Number(order.final_subtotal ?? order.subtotal ?? 0);
  const finalTotal = Number(order.final_total ?? order.total_amount ?? 0);
  const paidAmount = Math.max(
    Number(order.paid_amount ?? 0),
    approvedAmount,
  );
  const outstanding = Math.max(0, finalTotal - paidAmount);

  const paymentStatus =
    outstanding === 0 && finalTotal > 0
      ? "paid"
      : paidAmount > 0
        ? "partially_paid"
        : hasPendingPayment
          ? "payment_pending"
          : order.payment_status ?? "unpaid";

  return (
    <main className="min-h-screen bg-[#fff5f9] px-5 py-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 pt-10">
          <p className="text-sm text-[#8a8a9e]">รายละเอียดคำสั่งซื้อ</p>
          <h1 className="text-3xl font-bold">{order.order_no}</h1>
        </header>

        <div className="space-y-5">
          <RejectionCard
            status={fulfillmentStatus}
            reason={order.rejection_reason}
          />

          {fulfillmentStatus !== "rejected" && (
            <TrackingCard
              fulfillmentStatus={fulfillmentStatus}
              carrier={order.carrier}
              trackingNo={order.tracking_no}
              shippedAt={order.shipped_at}
            />
          )}

          {fulfillmentStatus === "shipped" && !order.customer_received_at && (
            <ConfirmReceivedForm
              orderId={order.id}
              rows={(items ?? []).map((item) => ({
                id: item.id,
                name: item.model_name_snapshot,
                color: item.color_name_snapshot,
                power: item.power_snapshot,
                shippedQuantity: Number(
                  item.fulfilled_quantity ?? item.quantity ?? 0,
                ),
              }))}
            />
          )}

          {order.customer_received_at && (
            <section className="rounded-[24px] border border-green-200 bg-green-50 p-5 text-green-700">
              <h2 className="font-bold">รับสินค้าแล้ว</h2>
              <p className="mt-2 text-sm">
                ยืนยันเมื่อ{" "}
                {new Date(order.customer_received_at).toLocaleString("th-TH")}
              </p>
            </section>
          )}

          <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
            <h2 className="font-bold">สถานะการชำระเงิน</h2>

            <div className="mt-4 flex items-center justify-between gap-4">
              <span className="text-sm text-[#8a8a9e]">
                {paymentLabel(paymentStatus)}
              </span>
              <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600">
                {paymentLabel(paymentStatus)}
              </span>
            </div>

            <div className="mt-4 border-t border-[#f4d4e1] pt-4">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-[#8a8a9e]">ยอดคงค้าง</span>
                <span className="font-bold text-[#f76da8]">
                  ฿{Math.max(0, outstanding).toLocaleString("th-TH")}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
            <h2 className="font-bold">รายการสินค้า</h2>

            <div className="mt-4 space-y-4">
              {(items ?? []).map((item) => {
                const orderedQty = item.original_quantity ?? item.quantity;
                const fulfilledQty =
                  item.fulfilled_quantity ?? item.quantity;
                const lineTotal = Number(
                  item.adjusted_line_total ?? item.line_total ?? 0,
                );

                return (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-[#f4d4e1] p-4"
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-semibold">
                          {item.model_name_snapshot}
                        </p>
                        <p className="mt-1 text-sm text-[#8a8a9e]">
                          {item.color_name_snapshot} · {item.power_snapshot}
                        </p>
                      </div>

                      <p className="font-semibold">
                        ฿{lineTotal.toLocaleString("th-TH")}
                      </p>
                    </div>

                    <p className="mt-3 text-sm">
                      จำนวนที่สั่ง {orderedQty} คู่
                    </p>

                    {item.fulfillment_changed && (
                      <p className="mt-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        จำนวนที่จัดส่งจริง {fulfilledQty} คู่
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
            <h2 className="font-bold">สรุปยอด</h2>

            <div className="mt-4 space-y-3 text-sm">
              <SummaryRow
                label="ยอดสินค้า"
                value={`฿${finalSubtotal.toLocaleString("th-TH")}`}
              />
              <SummaryRow
                label="ค่าจัดส่ง"
                value={
                  order.shipping_fee === null
                    ? "ยังไม่ระบุ"
                    : `฿${Number(order.shipping_fee).toLocaleString("th-TH")}`
                }
              />
              <SummaryRow
                label="ยอดรวม"
                value={`฿${finalTotal.toLocaleString("th-TH")}`}
                strong
              />
              <SummaryRow
                label="ชำระแล้ว"
                value={`฿${paidAmount.toLocaleString("th-TH")}`}
              />
              <SummaryRow
                label="คงค้าง"
                value={`฿${Math.max(0, outstanding).toLocaleString("th-TH")}`}
              />
            </div>
          </section>

          {address && (
            <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
              <h2 className="font-bold">ที่อยู่จัดส่ง</h2>
              <p className="mt-3 font-semibold">{address.receiver_name}</p>
              <p className="mt-2 text-sm leading-6 text-[#6f6872]">
                {address.address_line} {address.subdistrict} {address.district}{" "}
                {address.province} {address.postal_code}
              </p>
              <p className="mt-1 text-sm text-[#8a8a9e]">{address.phone}</p>
            </section>
          )}

          <DuplicateOrderButton orderId={order.id} />
        </div>
      </div>
    </main>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[#8a8a9e]">{label}</span>
      <span className={strong ? "font-bold text-[#f76da8]" : "font-semibold"}>
        {value}
      </span>
    </div>
  );
}

function paymentLabel(status: string) {
  const map: Record<string, string> = {
    unpaid: "ยังไม่ชำระ",
    payment_pending: "รอตรวจสอบสลิป",
    partially_paid: "ชำระบางส่วน",
    paid: "ชำระแล้ว",
  };

  return map[status] || status;
}
