import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function PackerDashboardPage() {
  const supabase = createAdminClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, fulfillment_status");

  const rows = orders ?? [];
  const status = (order: any) => order.fulfillment_status ?? order.status;

  const counts = {
    submitted: rows.filter((order) =>
      ["submitted", "shipping_quoted"].includes(status(order)),
    ).length,
    packing: rows.filter((order) => status(order) === "packing").length,
    packed: rows.filter((order) => status(order) === "packed").length,
    shipped: rows.filter((order) => status(order) === "shipped").length,
  };

  return (
    <main className="min-h-screen bg-[#fff5f9] px-5 py-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="text-sm text-[#8a8a9e]">ฝ่ายจัดสินค้า</p>
          <h1 className="text-3xl font-bold">Packer Dashboard</h1>
          <p className="mt-2 text-sm text-[#8a8a9e]">
            กดการ์ดเพื่อเปิดออเดอร์ในสถานะนั้น
          </p>
        </header>

        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <PackerCard
            href="/packer/orders?filter=submitted"
            label="รอจัดสินค้า"
            value={counts.submitted}
          />
          <PackerCard
            href="/packer/orders?filter=packing"
            label="กำลังแพ็ก"
            value={counts.packing}
          />
          <PackerCard
            href="/packer/orders?filter=packed"
            label="รอจัดส่ง"
            value={counts.packed}
          />
          <PackerCard
            href="/packer/orders?filter=shipped"
            label="จัดส่งแล้ว"
            value={counts.shipped}
          />
        </section>

        <Link
          href="/packer/orders"
          className="mt-6 flex h-14 items-center justify-center rounded-full bg-[#f76da8] font-semibold text-white"
        >
          ดูออเดอร์ทั้งหมด
        </Link><Link href="/packer/inventory-upload" className="mt-3 flex h-14 items-center justify-center rounded-full border border-[#f76da8] bg-white font-semibold text-[#f76da8]">อัปโหลดผลนับสต๊อค</Link>
      </div>
    </main>
  );
}

function PackerCard({
  href,
  label,
  value,
}: {
  href: string;
  label: string;
  value: number;
}) {
  return (
    <Link
      href={href}
      className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <p className="text-sm font-semibold text-[#6f6872]">{label}</p>
      <p className="mt-2 text-4xl font-bold text-[#f76da8]">{value}</p>
      <p className="mt-2 text-xs text-[#8a8a9e]">กดเพื่อเปิดรายการ</p>
    </Link>
  );
}
