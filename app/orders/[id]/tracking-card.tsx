export default function TrackingCard({
  fulfillmentStatus,
  carrier,
  trackingNo,
  shippedAt,
}: {
  fulfillmentStatus: string;
  carrier: string | null;
  trackingNo: string | null;
  shippedAt: string | null;
}) {
  if (fulfillmentStatus !== "shipped") {
    return (
      <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
        <h2 className="font-bold">สถานะการจัดส่ง</h2>
        <p className="mt-3 text-sm text-[#8a8a9e]">
          {statusLabel(fulfillmentStatus)}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[24px] border border-green-200 bg-green-50 p-5">
      <h2 className="font-bold text-green-700">จัดส่งแล้ว</h2>

      <div className="mt-4 space-y-3 text-sm text-green-700">
        <div className="flex justify-between gap-4">
          <span>บริษัทขนส่ง</span>
          <span className="font-semibold">{carrier || "-"}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span>เลขพัสดุ</span>
          <span className="break-all font-semibold">{trackingNo || "-"}</span>
        </div>

        {shippedAt && (
          <div className="flex justify-between gap-4">
            <span>วันที่จัดส่ง</span>
            <span className="font-semibold">
              {new Date(shippedAt).toLocaleString("th-TH")}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    submitted: "รับคำสั่งซื้อแล้ว",
    shipping_quoted: "แจ้งค่าจัดส่งแล้ว",
    packing: "กำลังจัดสินค้า",
    packed: "แพ็กสินค้าเสร็จแล้ว",
    shipped: "จัดส่งแล้ว",
    completed: "เสร็จสิ้น",
    cancelled: "ยกเลิก",
  };

  return map[status] || status;
}
