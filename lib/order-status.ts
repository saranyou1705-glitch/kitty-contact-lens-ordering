export function fulfillmentLabel(status?: string | null) {
  const map: Record<string, string> = {
    submitted: "รับออเดอร์แล้ว",
    shipping_quoted: "แจ้งค่าจัดส่งแล้ว",
    packing: "กำลังจัดสินค้า",
    packed: "แพ็กสินค้าแล้ว",
    shipped: "จัดส่งแล้ว",
    completed: "เสร็จสิ้น",
    rejected: "ปฏิเสธแล้ว",
    cancelled: "ยกเลิกแล้ว",
  };

  return map[status ?? ""] ?? status ?? "-";
}

export function paymentLabel(status?: string | null) {
  const map: Record<string, string> = {
    unpaid: "ยังไม่ชำระ",
    awaiting_payment: "รอชำระเงิน",
    payment_pending: "รอตรวจสอบการชำระ",
    pending: "รอตรวจสอบการชำระ",
    partially_paid: "ชำระบางส่วน",
    paid: "ชำระแล้ว",
    rejected: "การชำระถูกปฏิเสธ",
  };

  return map[status ?? ""] ?? status ?? "-";
}

export function isClosedOrder(order: {
  status?: string | null;
  fulfillment_status?: string | null;
}) {
  const status = order.fulfillment_status ?? order.status;
  return status === "rejected" || status === "cancelled";
}
