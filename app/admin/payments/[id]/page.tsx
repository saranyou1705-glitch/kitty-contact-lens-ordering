import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import PaymentReviewForm from "./payment-review-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PaymentReviewPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: payment } = await supabase
    .from("payments")
    .select(`
      id,
      amount,
      slip_image_url,
      verification_status,
      verification_message,
      review_reason,
      created_at,
      orders (
        id,
        order_no,
        total_amount,
        status,
        profiles (
          full_name,
          phone
        )
      )
    `)
    .eq("id", id)
    .single();

  if (!payment) {
    notFound();
  }

  const order = Array.isArray(payment.orders)
    ? payment.orders[0]
    : payment.orders;

  const profile = (order && Array.isArray(order.profiles)
    ? order.profiles[0]
    : order?.profiles) as { full_name?: string; phone?: string } | null | undefined;

  const amountMatches =
    Number(payment.amount) === Number(order?.total_amount ?? 0);

  return (
    <main className="min-h-screen bg-[#fff5f9] px-5 py-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center gap-4">
          <Link
            href="/admin/payments"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f4cadb] bg-white text-[#f76da8]"
          >
            ←
          </Link>
          <div>
            <p className="text-sm text-[#8a8a9e]">ตรวจสอบสลิป</p>
            <h1 className="text-3xl font-bold">
              {order?.order_no || "-"}
            </h1>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
            <h2 className="font-bold">หลักฐานการชำระเงิน</h2>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={payment.slip_image_url}
              alt="Payment slip"
              className="mt-4 w-full rounded-2xl border border-[#f4d4e1]"
            />

            <a
              href={payment.slip_image_url}
              target="_blank"
              className="mt-4 inline-flex text-sm font-semibold text-[#f76da8]"
            >
              เปิดรูปขนาดเต็ม
            </a>
          </section>

          <div className="space-y-5">
            <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
              <h2 className="font-bold">ข้อมูลตรวจสอบ</h2>

              <div className="mt-4 space-y-3 text-sm">
                <Row label="ลูกค้า" value={profile?.full_name || "-"} />
                <Row label="เบอร์โทร" value={profile?.phone || "-"} />
                <Row
                  label="ยอดสลิป"
                  value={`฿${Number(payment.amount).toLocaleString("th-TH")}`}
                />
                <Row
                  label="ยอดออเดอร์"
                  value={`฿${Number(order?.total_amount || 0).toLocaleString("th-TH")}`}
                />
              </div>

              <div className={`mt-4 rounded-2xl p-4 text-sm ${
                amountMatches
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}>
                {amountMatches
                  ? "ยอดเงินตรงกับยอดออเดอร์"
                  : "ยอดเงินไม่ตรงกับยอดออเดอร์"}
              </div>
            </section>

            <PaymentReviewForm
              paymentId={payment.id}
              currentStatus={payment.verification_status}
              currentReason={payment.review_reason}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[#8a8a9e]">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
