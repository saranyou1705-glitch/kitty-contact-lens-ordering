import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import ReviewForm from "./review-form";

type PageProps = { params: Promise<{ id: string }> };

export default async function PaymentBatchDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: batch } = await supabase
    .from("payment_batches")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!batch) notFound();

  const [{ data: profile }, { data: links }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, phone")
      .eq("id", batch.customer_id)
      .maybeSingle(),
    supabase
      .from("payment_batch_orders")
      .select("id, order_id, amount_applied")
      .eq("payment_batch_id", id),
  ]);

  const orderIds = (links ?? []).map((item) => item.order_id);
  let orders: any[] = [];

  if (orderIds.length > 0) {
    const { data } = await supabase
      .from("orders")
      .select("id, order_no, fulfillment_status, payment_status")
      .in("id", orderIds);
    orders = data ?? [];
  }

  const orderMap = new Map(orders.map((order) => [order.id, order]));
  const paymentStatus = batch.verification_status ?? batch.status;

  return (
    <main className="min-h-screen bg-[#fff5f9] px-4 py-6 sm:px-5 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-center gap-3 sm:mb-8">
          <Link
            href="/admin/payment-batches"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#f4cadb] bg-white text-xl font-bold text-[#f76da8] shadow-sm"
            aria-label="กลับหน้ารายการชำระเงิน"
          >
            ←
          </Link>
          <div className="min-w-0">
            <p className="text-sm text-[#8a8a9e]">ตรวจการชำระเงินรวม</p>
            <h1 className="truncate text-2xl font-bold sm:text-3xl">
              {batch.batch_no ?? "รายละเอียดการชำระเงิน"}
            </h1>
          </div>
        </header>

        <section className="mb-5 rounded-[22px] border border-[#f4d4e1] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-[#8a8a9e]">สถานะการชำระเงิน</span>
            <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass(paymentStatus)}`}>
              {paymentStatusLabel(paymentStatus)}
            </span>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <div className="space-y-5">
            <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
              <h2 className="font-bold">ลูกค้า</h2>
              <p className="mt-3 font-semibold">{profile?.full_name || "-"}</p>
              <p className="mt-1 text-sm text-[#8a8a9e]">{profile?.phone || "-"}</p>
            </section>

            <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
              <h2 className="font-bold">ออเดอร์ในชุดชำระเงิน</h2>
              <div className="mt-4 space-y-4">
                {(links ?? []).map((item) => {
                  const order = orderMap.get(item.order_id);
                  return (
                    <div key={item.id} className="rounded-2xl border border-[#f4d4e1] p-4">
                      <div className="flex justify-between gap-4">
                        <div>
                          <p className="font-semibold">{order?.order_no || "-"}</p>
                          <p className="mt-1 text-xs text-[#8a8a9e]">
                            การจัดส่ง: {fulfillmentLabel(order?.fulfillment_status)}
                          </p>
                          <p className="mt-1 text-xs text-[#8a8a9e]">
                            การชำระ: {orderPaymentLabel(order?.payment_status)}
                          </p>
                        </div>
                        <p className="font-bold text-[#f76da8]">
                          ฿{Number(item.amount_applied).toLocaleString("th-TH")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="space-y-5">
            <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
              <p className="text-sm text-[#8a8a9e]">ยอดชำระรวม</p>
              <p className="mt-2 text-3xl font-bold text-[#f76da8]">
                ฿{Number(batch.total_amount ?? batch.amount ?? 0).toLocaleString("th-TH")}
              </p>

              {batch.slip_image_url ? (
                <a
                  href={batch.slip_image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={batch.slip_image_url}
                    alt="Payment slip"
                    className="max-h-[520px] w-full rounded-2xl border border-[#f4d4e1] object-contain"
                  />
                  <span className="mt-3 flex h-11 items-center justify-center rounded-full border border-[#f76da8] text-sm font-semibold text-[#f76da8]">
                    เปิดดูสลิปขนาดเต็ม
                  </span>
                </a>
              ) : (
                <p className="mt-5 rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">
                  ลูกค้ายังไม่ได้อัปโหลดสลิป
                </p>
              )}
            </section>

            <ReviewForm
              batchId={batch.id}
              status={paymentStatus}
              currentReason={batch.review_reason}
              disabled={!batch.slip_image_url}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function fulfillmentLabel(status?: string | null) {
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
  return map[status ?? ""] ?? "ไม่ทราบสถานะ";
}

function orderPaymentLabel(status?: string | null) {
  const map: Record<string, string> = {
    unpaid: "ยังไม่ชำระ",
    awaiting_payment: "รอชำระเงิน",
    payment_pending: "รอตรวจสอบการชำระ",
    pending: "รอตรวจสอบการชำระ",
    partially_paid: "ชำระบางส่วน",
    paid: "ชำระแล้ว",
    rejected: "การชำระถูกปฏิเสธ",
  };
  return map[status ?? ""] ?? "ไม่ทราบสถานะ";
}

function paymentStatusLabel(status?: string | null) {
  const map: Record<string, string> = {
    awaiting_payment: "รอลูกค้าชำระ",
    awaiting_slip: "รอลูกค้าส่งสลิป",
    unpaid: "ยังไม่ชำระ",
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
  return map[status ?? ""] ?? "ไม่ทราบสถานะ";
}

function statusClass(status?: string | null) {
  if (["approved", "paid"].includes(status ?? "")) return "bg-green-50 text-green-700";
  if (["rejected", "cancelled"].includes(status ?? "")) return "bg-red-50 text-red-600";
  if (["pending", "payment_pending", "pending_review", "under_review"].includes(status ?? "")) return "bg-amber-50 text-amber-700";
  return "bg-blue-50 text-blue-700";
}
