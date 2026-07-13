import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import OrdersLiveList from "./orders-live-list";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ filter?: string }>;
};

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const { filter = "action" } = await searchParams;
  const supabase = createAdminClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  const customerIds = [
    ...new Set((orders ?? []).map((order) => order.customer_id)),
  ];

  let profiles: Array<{ id: string; full_name: string; phone: string }> = [];

  if (customerIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, phone")
      .in("id", customerIds);

    profiles = data ?? [];
  }

  const profileMap = new Map(
    profiles.map((profile) => [profile.id, profile]),
  );

  const initialOrders = (orders ?? []).map((order) => ({
    ...order,
    customer: profileMap.get(order.customer_id) ?? null,
  }));

  return (
    <main className="min-h-screen bg-[#fff5f9] px-5 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center gap-4">
          <Link
            href="/admin"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f4cadb] bg-white text-[#f76da8]"
          >
            ←
          </Link>
          <div>
            <p className="text-sm text-[#8a8a9e]">ระบบหลังบ้าน</p>
            <h1 className="text-3xl font-bold">รายการคำสั่งซื้อ</h1>
          </div>
        </header>

        {error && (
          <section className="mb-5 rounded-2xl bg-red-50 p-4 text-red-600">
            {error.message}
          </section>
        )}

        <OrdersLiveList
          initialOrders={initialOrders}
          initialFilter={filter}
        />
      </div>
    </main>
  );
}
