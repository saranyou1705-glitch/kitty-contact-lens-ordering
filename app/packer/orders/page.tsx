import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  searchParams: Promise<{ filter?: string }>;
};

export const dynamic = "force-dynamic";

export default async function PackerOrdersPage({ searchParams }: PageProps) {
  const { filter = "all" } = await searchParams;
  const supabase = createAdminClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .not("fulfillment_status", "eq", "rejected")
    .not("status", "eq", "cancelled")
    .order("created_at", { ascending: false });

  const filtered = (orders ?? []).filter((order) => {
    const status = order.fulfillment_status ?? order.status;

    if (filter === "submitted")
      return ["submitted", "shipping_quoted"].includes(status);
    if (filter === "packing") return status === "packing";
    if (filter === "packed") return status === "packed";
    if (filter === "shipped") return status === "shipped";
    return true;
  });

  return (
    <main className="min-h-screen bg-[#fff5f9] px-5 py-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center gap-4">
          <Link
            href="/packer"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f4cadb] bg-white text-[#f76da8]"
          >
            ←
          </Link>
          <div>
            <p className="text-sm text-[#8a8a9e]">ฝ่ายจัดสินค้า</p>
            <h1 className="text-3xl font-bold">
              {filterTitle(filter)}
            </h1>
          </div>
        </header>

        {error && (
          <section className="mb-5 rounded-2xl bg-red-50 p-4 text-red-600">
            {error.message}
          </section>
        )}

        <section className="space-y-4">
          {filtered.map((order) => {
            const status = order.fulfillment_status ?? order.status;

            return (
              <Link
                key={order.id}
                href={`/packer/orders/${order.id}`}
                className="block rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold">{order.order_no}</h2>
                    <p className="mt-1 text-xs text-[#8a8a9e]">
                      {new Date(
                        order.submitted_at ?? order.created_at,
                      ).toLocaleString("th-TH")}
                    </p>
                  </div>

                  <span className="rounded-full bg-[#fff0f6] px-3 py-2 text-xs font-semibold text-[#f76da8]">
                    {statusLabel(status)}
                  </span>
                </div>
              </Link>
            );
          })}

          {filtered.length === 0 && (
            <p className="rounded-[24px] bg-white p-8 text-center text-sm text-[#8a8a9e]">
              ไม่มีออเดอร์ในสถานะนี้
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function filterTitle(filter: string) {
  const map: Record<string, string> = {
    submitted: "ออเดอร์รอจัดสินค้า",
    packing: "ออเดอร์กำลังแพ็ก",
    packed: "ออเดอร์รอจัดส่ง",
    shipped: "ออเดอร์จัดส่งแล้ว",
    all: "ออเดอร์ทั้งหมด",
  };
  return map[filter] || "ออเดอร์ทั้งหมด";
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    submitted: "รอจัดสินค้า",
    shipping_quoted: "รอจัดสินค้า",
    packing: "กำลังแพ็ก",
    packed: "รอจัดส่ง",
    shipped: "จัดส่งแล้ว",
    completed: "เสร็จสิ้น",
  };
  return map[status] || status;
}
