"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function CustomerNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/packer") ||
    pathname.startsWith("/api")
  ) {
    return null;
  }

  return (
    <>
      {pathname !== "/" && pathname !== "/home" && (
        <button
          type="button"
          onClick={() => router.back()}
          className="fixed bottom-24 left-4 z-[100] flex h-12 w-12 items-center justify-center rounded-full border border-[#f4cadb] bg-white text-xl font-bold text-[#f76da8] shadow-md print:hidden"
          aria-label="กลับหน้าก่อนหน้า"
        >
          ←
        </button>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-[100] border-t border-[#f4d4e1] bg-white px-2 py-2 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] print:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-4 gap-1">
          <Nav
            href="/home"
            label="หน้าหลัก"
            active={pathname === "/" || pathname === "/home" || pathname.startsWith("/orders")}
          />
          <Nav
            href="/products"
            label="สินค้า"
            active={pathname.startsWith("/products")}
          />
          <Nav
            href="/cart"
            label="ตะกร้า"
            active={pathname.startsWith("/cart") || pathname.startsWith("/checkout")}
          />
          <Nav
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

function Nav({
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
      className={`flex min-h-12 items-center justify-center rounded-2xl px-1 text-center text-xs font-semibold ${
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
