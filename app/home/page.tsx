import Link from "next/link";
import CustomerOrderDashboard from "./customer-order-dashboard";

export default function CustomerHomePage() {
  return (
    <main className="min-h-screen bg-[#fff5f9] px-5 py-8">
      <div className="mx-auto max-w-xl">
        <header className="rounded-[28px] bg-[#f76da8] p-6 text-white shadow-sm">
          <p className="text-sm opacity-90">Kitty Kawaii</p>
          <h1 className="mt-1 text-3xl font-bold">สั่งซื้อคอนแทคเลนส์</h1>
          <p className="mt-2 text-sm opacity-90">
            ดูสินค้า ติดตามออเดอร์ และชำระเงินได้จากหน้านี้
          </p>

          <Link
            href="/products"
            className="mt-5 flex h-12 items-center justify-center rounded-full bg-white font-semibold text-[#f76da8]"
          >
            เลือกสินค้า
          </Link>
        </header>

        <CustomerOrderDashboard />
      </div>
    </main>
  );
}
