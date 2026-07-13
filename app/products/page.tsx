import BottomNav from "@/components/bottom-nav";
import ProductsLiveGrid from "./products-live-grid";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-[#fff5f9] px-5 pb-28 pt-7">
      <div className="mx-auto max-w-md">
        <header className="mb-6">
          <p className="text-sm text-[#8a8a9e]">เลือกคอนแทคเลนส์</p>
          <h1 className="text-2xl font-bold text-[#2b2b38]">สินค้าทั้งหมด</h1>
          <p className="mt-2 text-xs text-[#8a8a9e]">ระบบตรวจสอบรายการ Active และสต๊อคล่าสุดทุก 5 วินาที</p>
        </header>
        <ProductsLiveGrid />
      </div>
      <BottomNav active="products" />
    </main>
  );
}
