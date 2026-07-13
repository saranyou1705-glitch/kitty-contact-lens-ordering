import Link from "next/link";

export default function PaymentButton({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  if (status !== "shipping_quoted") {
    return null;
  }

  return (
    <Link
      href={`/orders/${orderId}/payment`}
      className="mt-6 flex h-14 items-center justify-center rounded-full bg-[#f76da8] font-semibold text-white"
    >
      ชำระเงินและอัปโหลดสลิป
    </Link>
  );
}
