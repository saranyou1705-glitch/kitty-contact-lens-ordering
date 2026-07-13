export default function FulfillmentSummary({
  items,
  originalSubtotal,
  adjustedSubtotal,
  adjustmentAmount,
}: {
  items: Array<{
    id: string;
    model_name_snapshot: string;
    color_name_snapshot: string;
    power_snapshot: string;
    original_quantity: number | null;
    fulfilled_quantity: number | null;
    fulfillment_changed: boolean;
  }>;
  originalSubtotal: number;
  adjustedSubtotal: number;
  adjustmentAmount: number;
}) {
  const changed = items.filter((item) => item.fulfillment_changed);

  if (changed.length === 0) return null;

  return (
    <section className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 p-5">
      <h2 className="font-bold text-amber-800">มีการปรับจำนวนสินค้าที่จัดส่ง</h2>

      <div className="mt-4 space-y-3">
        {changed.map((item) => (
          <div key={item.id} className="text-sm text-amber-800">
            <p className="font-semibold">
              {item.model_name_snapshot} · {item.color_name_snapshot} · {item.power_snapshot}
            </p>
            <p className="mt-1">
              จาก {item.original_quantity ?? 0} คู่ เหลือ {item.fulfilled_quantity ?? 0} คู่
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-amber-200 pt-4 text-sm">
        <div className="flex justify-between">
          <span>ยอดสินค้าเดิม</span>
          <span>฿{originalSubtotal.toLocaleString("th-TH")}</span>
        </div>
        <div className="mt-2 flex justify-between font-semibold">
          <span>ยอดสินค้าหลังปรับ</span>
          <span>฿{adjustedSubtotal.toLocaleString("th-TH")}</span>
        </div>
        <div className="mt-2 flex justify-between font-bold text-red-600">
          <span>ยอดที่ต้องคืน/ปรับยอด</span>
          <span>฿{adjustmentAmount.toLocaleString("th-TH")}</span>
        </div>
      </div>
    </section>
  );
}
