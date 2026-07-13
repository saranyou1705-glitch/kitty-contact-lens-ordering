import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminPaymentsPage() {
  const supabase = createAdminClient();

  const { data: payments } = await supabase
    .from("payments")
    .select(`
      id,
      amount,
      slip_image_url,
      verification_status,
      verification_message,
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
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#fff5f9] px-5 py-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center gap-4">
          <Link
            href="/admin"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f4cadb] bg-white text-[#f76da8]"
          >
            ←
          </Link>
          <div>
            <p className="text-sm text-[#8a8a9e]">ระบบหลังบ้าน</p>
            <h1 className="text-3xl font-bold">รอตรวจสอบสลิป</h1>
          </div>
        </header>

        <section className="space-y-4">
          {(payments ?? []).map((payment) => {
            const order = Array.isArray(payment.orders)
              ? payment.orders[0]
              : payment.orders;

            const profile = (order && Array.isArray(order.profiles)
              ? order.profiles[0]
              : order?.profiles) as { full_name?: string; phone?: string } | null | undefined;

            return (
              <article
                key={payment.id}
                className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold">{order?.order_no || "-"}</h2>
                    <p className="mt-1 text-sm text-[#8a8a9e]">
                      {profile?.full_name || "-"} · {profile?.phone || "-"}
                    </p>
                    <p className="mt-3 font-semibold text-[#f76da8]">
                      ยอดสลิป ฿{Number(payment.amount).toLocaleString("th-TH")}
                    </p>
                    <p className="mt-1 text-sm text-[#8a8a9e]">
                      ยอดออเดอร์ ฿{Number(order?.total_amount || 0).toLocaleString("th-TH")}
                    </p>
                    <p className="mt-3 text-sm text-[#6f6872]">
                      {payment.verification_message}
                    </p>
                  </div>

                  <Link
                    href={payment.slip_image_url}
                    target="_blank"
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[#f76da8] px-5 font-semibold text-white"
                  >
                    เปิดดูสลิป
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
