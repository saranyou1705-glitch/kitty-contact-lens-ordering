import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, fulfillment_status, payment_status");

  const rows = orders ?? [];
  const status = (order: any) => order.fulfillment_status ?? order.status;

  const counts = {
    submitted: rows.filter((order) =>
      ["submitted", "shipping_quoted"].includes(status(order)),
    ).length,
    packing: rows.filter((order) => status(order) === "packing").length,
    packed: rows.filter((order) => status(order) === "packed").length,
    shipped: rows.filter((order) =>
      ["shipped", "completed"].includes(status(order)),
    ).length,
    unpaid: rows.filter(
      (order) =>
        !["rejected", "cancelled"].includes(status(order)) &&
        !["paid", "payment_pending"].includes(order.payment_status ?? "unpaid"),
    ).length,
    rejected: rows.filter(
      (order) =>
        status(order) === "rejected" || order.status === "cancelled",
    ).length,
  };

  return (
    <main className="min-h-screen bg-[#fff5f9] px-5 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-sm text-[#8a8a9e]">ระบบหลังบ้าน</p>
          <h1 className="text-3xl font-bold">แดชบอร์ดแอดมิน</h1>
          <p className="mt-2 text-sm text-[#8a8a9e]">
            กดการ์ดเพื่อเปิดออเดอร์ในสถานะนั้นโดยตรง
          </p>
        </header>

        <section className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatusCard
            href="/admin/orders?filter=submitted"
            label="ออเดอร์ใหม่"
            value={counts.submitted}
            description="รับออเดอร์แล้ว รอดำเนินการ"
          />
          <StatusCard
            href="/admin/orders?filter=packing"
            label="กำลังแพ็ก"
            value={counts.packing}
            description="อยู่ระหว่างจัดสินค้า"
          />
          <StatusCard
            href="/admin/orders?filter=packed"
            label="แพ็กเสร็จแล้ว"
            value={counts.packed}
            description="รอบันทึกการจัดส่ง"
          />
          <StatusCard
            href="/admin/orders?filter=shipped"
            label="จัดส่งแล้ว"
            value={counts.shipped}
            description="ส่งสินค้าแล้ว"
          />
          <StatusCard
            href="/admin/orders?filter=unpaid"
            label="ยังไม่ชำระ"
            value={counts.unpaid}
            description="มียอดคงค้าง"
          />
          <StatusCard
            href="/admin/orders?filter=rejected"
            label="ปฏิเสธแล้ว"
            value={counts.rejected}
            description="ออเดอร์สิ้นสุด"
          />
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <Link
            href="/admin/orders"
            className="rounded-[24px] bg-[#f76da8] p-5 text-center font-semibold text-white"
          >
            ดูรายการคำสั่งซื้อทั้งหมด
          </Link>
          <Link
            href="/admin/payment-batches"
            className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 text-center font-semibold text-[#f76da8]"
          >
            ตรวจการชำระเงินรวม
          </Link>
          <Link
            href="/packer"
            className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 text-center font-semibold text-[#f76da8]"
          >
            ไปหน้า Packer
          </Link>
        <Link href="/admin/inventory" className="mt-4 block rounded-[24px] border border-[#f4d4e1] bg-white p-5 text-center font-semibold text-[#f76da8]">สินค้าคงคลัง</Link><Link href="/admin/products/manage" className="mt-3 block rounded-[24px] border border-[#f4d4e1] bg-white p-5 text-center font-semibold text-[#f76da8]">จัดการชนิดสินค้า</Link><Link href="/admin/users" className="mt-3 block rounded-[24px] border border-[#f4d4e1] bg-white p-5 text-center font-semibold text-[#f76da8]">จัดการผู้ใช้งาน</Link></section>
      </div>
    </main>
  );
}

function StatusCard({
  href,
  label,
  value,
  description,
}: {
  href: string;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <p className="text-sm font-semibold text-[#6f6872]">{label}</p>
      <p className="mt-2 text-4xl font-bold text-[#f76da8]">{value}</p>
      <p className="mt-2 text-xs text-[#8a8a9e]">{description}</p>
    </Link>
  );
}
