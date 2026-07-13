import Link from "next/link";

type BottomNavProps = {
  active: "home" | "products" | "orders" | "profile";
};

const items = [
  { key: "home", label: "หน้าแรก", href: "/home", icon: "⌂" },
  { key: "products", label: "สินค้า", href: "/products", icon: "◫" },
  { key: "orders", label: "ออเดอร์", href: "/orders", icon: "▤" },
  { key: "profile", label: "โปรไฟล์", href: "/profile", icon: "♡" },
] as const;

export default function BottomNav({ active }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#f4d4e1] bg-white/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {items.map((item) => {
          const isActive = active === item.key;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs ${
                isActive ? "font-semibold text-[#f76da8]" : "text-[#9a93a0]"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-lg ${
                  isActive ? "bg-[#fff0f6]" : ""
                }`}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
