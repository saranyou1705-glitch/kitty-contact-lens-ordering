import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import ShippingQuoteForm from "./shipping-quote-form";
import PaymentReviewInline from "./payment-review-inline";
import RejectOrderForm from "./reject-order-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (orderError || !order) {
    return (
      <main className="min-h-screen bg-[#fff5f9] p-8">
        <div className="mx-auto max-w-md rounded-[24px] bg-red-50 p-6 text-red-700">
          <h1 className="text-xl font-bold">ไม่สามารถโหลดออเดอร์ได้</h1>
          <p className="mt-3 text-sm">
            {orderError?.message ?? `ไม่พบ Order ID: ${id}`}
          </p>
        </div>
      </main>
    );
  }

  const [{ data: profile }, { data: address }, { data: items }, { data: payments }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, phone")
        .eq("id", order.customer_id)
        .maybeSingle(),
      supabase
        .from("customer_addresses")
        .select("*")
        .eq("id", order.address_id)
        .maybeSingle(),
      supabase
        .from("order_items")
        .select("*")
        .eq("order_id", id)
        .order("created_at"),
      supabase
        .from("payments")
        .select("*")
        .eq("order_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const latestPayment = payments?.[0] ?? null;
  const fulfillmentStatus = order.fulfillment_status ?? order.status;
  const rejected = fulfillmentStatus === "rejected" || order.status === "cancelled";

  return (
    <main className="min-h-screen bg-[#fff5f9] px-5 py-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f4cadb] bg-white text-[#f76da8]"
          >
            ←
          </Link>
          <div>
            <p className="text-sm text-[#8a8a9e]">รายละเอียดคำสั่งซื้อ</p>
            <h1 className="text-3xl font-bold">{order.order_no}</h1>
          </div>
        </header>

        {rejected && (
          <section className="mb-5 rounded-[24px] border border-red-200 bg-red-50 p-5 text-red-700">
            <h2 className="font-bold">ออเดอร์ถูกปฏิเสธ</h2>
            <p className="mt-2 text-sm">
              {order.rejection_reason || "ไม่ระบุเหตุผล"}
            </p>
          </section>
        )}

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <Card title="ลูกค้า">
              <p className="font-semibold">{profile?.full_name || "-"}</p>
              <p className="mt-1 text-sm text-[#8a8a9e]">
                {profile?.phone || "-"}
              </p>
            </Card>

            <Card title="รายการสินค้า">
              <div className="space-y-4">
                {(items ?? []).map((item) => (
                  <div
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
                        <p className="mt-2 text-sm">
                          สั่ง {item.original_quantity ?? item.quantity} คู่
                          {item.fulfillment_changed && (
                            <span className="ml-2 font-semibold text-amber-600">
                              ส่งจริง {item.fulfilled_quantity ?? 0} คู่
                            </span>
                          )}
                        </p>
                      </div>
                      <p className="font-semibold">
                        ฿
                        {Number(
                          item.adjusted_line_total ?? item.line_total ?? 0,
                        ).toLocaleString("th-TH")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {address && (
              <Card title="ที่อยู่จัดส่ง">
                <p className="font-semibold">{address.receiver_name}</p>
                <p className="mt-2 text-sm leading-6 text-[#6f6872]">
                  {address.address_line} {address.subdistrict} {address.district}{" "}
                  {address.province} {address.postal_code}
                </p>
                <p className="mt-1 text-sm text-[#8a8a9e]">{address.phone}</p>
              </Card>
            )}

            {latestPayment && (
              <Card title="สลิปชำระเงินรายออเดอร์">
                <a href={latestPayment.slip_image_url} target="_blank">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={latestPayment.slip_image_url}
                    alt="Payment slip"
                    className="max-h-[520px] w-full rounded-2xl border object-contain"
                  />
                </a>

                <PaymentReviewInline
                  orderId={order.id}
                  paymentId={latestPayment.id}
                  currentStatus={latestPayment.verification_status}
                />
              </Card>
            )}
          </div>

          <div className="space-y-5">
            <Card title="สถานะ">
              <SummaryRow
                label="การจัดส่ง"
                value={fulfillmentStatus}
              />
              <SummaryRow
                label="การชำระเงิน"
                value={order.payment_status ?? "unpaid"}
              />
            </Card>

            <Card title="สรุปยอด">
              <SummaryRow
                label="ยอดสินค้า"
                value={`฿${Number(
                  order.final_subtotal ?? order.subtotal ?? 0,
                ).toLocaleString("th-TH")}`}
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
                value={`฿${Number(
                  order.final_total ?? order.total_amount ?? 0,
                ).toLocaleString("th-TH")}`}
              />
              <SummaryRow
                label="ชำระแล้ว"
                value={`฿${Number(order.paid_amount ?? 0).toLocaleString("th-TH")}`}
              />
              <SummaryRow
                label="คงค้าง"
                value={`฿${Number(
                  order.outstanding_amount ??
                    order.final_total ??
                    order.total_amount ??
                    0,
                ).toLocaleString("th-TH")}`}
              />
            </Card>

            {!rejected && (
              <>
                <ShippingQuoteForm
                  orderId={order.id}
                  initialShippingFee={order.shipping_fee}
                  initialCarrier={order.carrier}
                  initialAdminNote={order.admin_note}
                />

                <RejectOrderForm orderId={order.id} />
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
      <h2 className="mb-4 font-bold">{title}</h2>
      {children}
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3 flex justify-between gap-4 text-sm">
      <span className="text-[#8a8a9e]">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
