import { createAdminClient } from "@/lib/supabase/admin";
import PrintLabelButton from "./print-label-button";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ShippingLabelPage({ params }: PageProps) {
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

  const { data: address } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("id", order.address_id)
    .maybeSingle();

  return (
    <main className="mx-auto min-h-[148mm] w-[105mm] bg-white p-[8mm] text-black print:min-h-0 print:p-[6mm]">
      <PrintLabelButton />

      <section className="border-2 border-black p-4">
        <header className="border-b-2 border-black pb-3">
          <p className="text-xs">KITTY KAWAII</p>
          <h1 className="mt-1 text-2xl font-bold">ใบปะหน้าพัสดุ</h1>
          <p className="mt-2 text-sm font-semibold">{order.order_no}</p>
        </header>

        <section className="mt-4">
          <p className="text-xs font-bold">ผู้รับ</p>
          <p className="mt-2 text-xl font-bold">
            {address?.receiver_name || customer?.full_name || "-"}
          </p>
          <p className="mt-2 text-base leading-7">
            {address
              ? `${address.address_line} ${address.subdistrict ?? ""} ${
                  address.district ?? ""
                } ${address.province ?? ""} ${address.postal_code ?? ""}`
              : "ไม่พบที่อยู่จัดส่ง"}
          </p>
          <p className="mt-2 text-lg font-semibold">
            โทร {address?.phone || customer?.phone || "-"}
          </p>
        </section>

        <section className="mt-5 border-t border-black pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <span>บริษัทขนส่ง</span>
            <span className="font-semibold">{order.carrier || "-"}</span>
          </div>

          <div className="mt-2 flex justify-between gap-4">
            <span>เลขพัสดุ</span>
            <span className="break-all font-semibold">
              {order.tracking_no || "-"}
            </span>
          </div>
        </section>

        <section className="mt-6 border-t border-black pt-4 text-xs">
          <p className="font-bold">ผู้ส่ง</p>
          <p className="mt-1">Kitty Kawaii</p>
        </section>
      </section>
    </main>
  );
}
