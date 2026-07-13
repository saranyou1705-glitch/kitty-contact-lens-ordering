"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const customerPrefixes = [
  "/home",
  "/products",
  "/cart",
  "/checkout",
  "/orders",
  "/payments",
];

export default function CustomerNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  const visible = customerPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!visible) return null;

  return (
    <>
      <div className="fixed left-4 top-4 z-50 print:hidden">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#f4cadb] bg-white text-xl font-bold text-[#f76da8] shadow-sm"
          aria-label="กลับหน้าก่อนหน้า"
        >
          ←
        </button>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#f4d4e1] bg-white/95 px-3 py-2 shadow-lg backdrop-blur print:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
          <NavItem href="/home" label="หน้าหลัก" active={pathname === "/home"} />
          <NavItem
            href="/products"
            label="สินค้า"
            active={pathname.startsWith("/products")}
          />
          <NavItem
            href="/cart"
            label="ตะกร้า"
            active={pathname.startsWith("/cart") || pathname.startsWith("/checkout")}
          />
          <NavItem
            href="/orders"
            label="ออเดอร์"
            active={pathname.startsWith("/orders")}
          />
          <NavItem
            href="/payments/new"
            label="ชำระเงิน"
            active={pathname.startsWith("/payments")}
            prominent
          />
        </div>
      </nav>
    </>
  );
}

function NavItem({
  href,
  label,
  active,
  prominent = false,
}: {
  href: string;
  label: string;
  active: boolean;
  prominent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-12 items-center justify-center rounded-2xl px-2 text-center text-xs font-semibold ${
        prominent
          ? "bg-[#f76da8] text-white"
          : active
            ? "bg-[#fff0f6] text-[#f76da8]"
            : "text-[#6f6872]"
      }`}
    >
      {label}
    </Link>
  );
}
