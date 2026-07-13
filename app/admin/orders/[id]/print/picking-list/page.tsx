import { createAdminClient } from "@/lib/supabase/admin";
import PrintButton from "./print-button";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PickingListPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (orderError || !order) {
    return (
      <main className="p-8">
        <h1 className="text-xl font-bold">ไม่พบออเดอร์</h1>
        <p className="mt-2 text-sm">{orderError?.message ?? id}</p>
      </main>
    );
  }

  const { data: customer } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .eq("id", order.customer_id)
    .maybeSingle();

  const { data: items } = await supabase
    .from("order_items")
    .select(`
      id,
      model_name_snapshot,
      color_name_snapshot,
      power_snapshot,
      quantity,
      fulfilled_quantity,
      fulfillment_changed
    `)
    .eq("order_id", id)
    .order("created_at");

  return (
    <main className="mx-auto max-w-4xl bg-white p-8 text-black print:max-w-none print:p-0">
      <PrintButton orderId={order.id} />

      <header className="border-b-2 border-black pb-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm">ใบจัดของ / Picking List</p>
            <h1 className="mt-1 text-3xl font-bold">{order.order_no}</h1>
          </div>

          <div className="text-right text-sm">
            <p>
              วันที่:{" "}
              {new Date(order.submitted_at ?? order.created_at).toLocaleString(
                "th-TH",
              )}
            </p>
            <p>สถานะ: {order.fulfillment_status ?? order.status}</p>
          </div>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-bold">ลูกค้า</p>
          <p className="mt-1">{customer?.full_name || "-"}</p>
          <p>{customer?.phone || "-"}</p>
        </div>

        <div className="text-right">
          <p className="font-bold">ขนส่ง</p>
          <p className="mt-1">{order.carrier || "ยังไม่ระบุ"}</p>
        </div>
      </section>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-black p-2 text-left">ลำดับ</th>
            <th className="border border-black p-2 text-left">สินค้า</th>
            <th className="border border-black p-2 text-left">สี</th>
            <th className="border border-black p-2 text-left">ค่าสายตา</th>
            <th className="border border-black p-2 text-center">จำนวน</th>
            <th className="border border-black p-2 text-center">ตรวจ</th>
          </tr>
        </thead>
        <tbody>
          {(items ?? []).map((item, index) => {
            const qty =
              item.fulfillment_changed && item.fulfilled_quantity !== null
                ? item.fulfilled_quantity
                : item.quantity;

            return (
              <tr key={item.id}>
                <td className="border border-black p-3">{index + 1}</td>
                <td className="border border-black p-3">
                  {item.model_name_snapshot}
                </td>
                <td className="border border-black p-3">
                  {item.color_name_snapshot}
                </td>
                <td className="border border-black p-3">
                  {item.power_snapshot}
                </td>
                <td className="border border-black p-3 text-center text-lg font-bold">
                  {qty}
                </td>
                <td className="border border-black p-3 text-center">□</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <section className="mt-8 grid grid-cols-2 gap-8 text-sm">
        <div className="border-t border-black pt-2 text-center">
          ผู้จัดสินค้า
        </div>
        <div className="border-t border-black pt-2 text-center">
          ผู้ตรวจสอบ
        </div>
      </section>
    </main>
  );
}
