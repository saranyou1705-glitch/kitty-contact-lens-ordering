import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import PackingWorkspace from "./packing-workspace";
import TrackingForm from "./tracking-form";

type PageProps = { params: Promise<{ id: string }> };

export default async function PackerOrderDetailPage({ params }: PageProps) {
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
          <h1 className="font-bold">โหลดออเดอร์ไม่สำเร็จ</h1>
          <p className="mt-2 text-sm">{orderError?.message ?? "ไม่พบออเดอร์"}</p>
        </div>
      </main>
    );
  }

  const [{ data: items, error: itemError }, { data: address }, { data: profile }, { data: packingItems }] =
    await Promise.all([
      supabase.from("order_items").select("*").eq("order_id", id).order("created_at"),
      supabase.from("customer_addresses").select("*").eq("id", order.address_id).maybeSingle(),
      supabase.from("profiles").select("id, full_name, phone").eq("id", order.customer_id).maybeSingle(),
      supabase.from("packing_items").select("*").eq("order_id", id),
    ]);

  const packingMap = new Map(
    (packingItems ?? []).map((item) => [item.order_item_id, item]),
  );

  const rows = (items ?? []).map((item) => {
    const packing = packingMap.get(item.id);

    return {
      orderItemId: item.id,
      packingId: packing?.id ?? "",
      name: item.model_name_snapshot,
      color: item.color_name_snapshot,
      power: item.power_snapshot,
      orderedQuantity: Number(item.original_quantity ?? item.quantity),
      packedQuantity: Number(
        packing?.packed_quantity ??
        item.fulfilled_quantity ??
        item.quantity
      ),
      willShip: packing?.will_ship ?? true,
      isChecked: packing?.is_checked ?? false,
    };
  });

  const status = order.fulfillment_status ?? order.status;

  return (
    <main className="min-h-screen bg-[#fff5f9] px-5 py-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-center gap-4">
          <Link
            href="/packer/orders"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f4cadb] bg-white text-[#f76da8]"
          >
            ←
          </Link>
          <div>
            <p className="text-sm text-[#8a8a9e]">รายละเอียดออเดอร์</p>
            <h1 className="text-3xl font-bold">{order.order_no}</h1>
          </div>
        </header>

        {itemError && (
          <section className="mb-5 rounded-2xl bg-red-50 p-4 text-red-600">
            {itemError.message}
          </section>
        )}

        <div className="space-y-5">
          <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
            <h2 className="font-bold">ลูกค้าและที่อยู่จัดส่ง</h2>
            <p className="mt-3 font-semibold">
              {address?.receiver_name || profile?.full_name || "-"}
            </p>
            <p className="mt-1 text-sm text-[#8a8a9e]">
              {address?.phone || profile?.phone || "-"}
            </p>
            {address && (
              <p className="mt-2 text-sm leading-6 text-[#6f6872]">
                {address.address_line} {address.subdistrict} {address.district}{" "}
                {address.province} {address.postal_code}
              </p>
            )}
          </section>

          <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
            <h2 className="font-bold">รายการสินค้า</h2>
            <div className="mt-4 space-y-3">
              {rows.map((row) => (
                <div key={row.orderItemId} className="rounded-2xl border border-[#f4d4e1] p-4">
                  <p className="font-semibold">{row.name}</p>
                  <p className="mt-1 text-sm text-[#8a8a9e]">
                    {row.color} · {row.power}
                  </p>
                  <p className="mt-2 text-sm">จำนวน {row.orderedQuantity} คู่</p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href={`/admin/orders/${order.id}/print/picking-list`}
              target="_blank"
              className="flex h-12 items-center justify-center rounded-full border border-[#f76da8] bg-white text-sm font-semibold text-[#f76da8]"
            >
              ปริ๊นใบจัดของ
            </Link>
            <Link
              href={`/admin/orders/${order.id}/print/shipping-label`}
              target="_blank"
              className="flex h-12 items-center justify-center rounded-full bg-[#f76da8] text-sm font-semibold text-white"
            >
              ปริ๊นใบปะหน้า
            </Link>
          </div>

          <PackingWorkspace
            orderId={order.id}
            status={status}
            rows={rows}
            carrier={order.carrier}
            trackingNo={order.tracking_no}
          />

          {status === "packed" && (
            <TrackingForm
              orderId={order.id}
              initialCarrier={order.carrier}
              initialTrackingNo={order.tracking_no}
            />
          )}
        </div>
      </div>
    </main>
  );
}
