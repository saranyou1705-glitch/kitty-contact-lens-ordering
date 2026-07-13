import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-[#fff5f9] px-5 py-10">
      <div className="mx-auto max-w-md">
        <section className="rounded-[28px] border border-green-200 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
            ✓
          </div>

          <h1 className="mt-5 text-2xl font-bold">
            บันทึกการชำระเงินแล้ว
          </h1>

          <p className="mt-3 leading-7 text-[#6f6872]">
            การชำระเงินของคุณได้รับการบันทึกแล้ว
            กรุณารอการยืนยันการรับยอดจากร้านค้า
          </p>

          <Link
            href="/orders"
            className="mt-6 flex h-12 items-center justify-center rounded-full bg-[#f76da8] font-semibold text-white"
          >
            ดูสถานะออเดอร์
          </Link>

          <Link
            href="/home"
            className="mt-3 flex h-12 items-center justify-center rounded-full border border-[#f76da8] bg-white font-semibold text-[#f76da8]"
          >
            กลับหน้าหลัก
          </Link>
        </section>
      </div>
    </main>
  );
}
