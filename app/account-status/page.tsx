"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Page() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const id = localStorage.getItem("kitty_profile_id");
    if (!id) return;
    fetch(`/api/account-status?profileId=${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(r => r.json())
      .then(setProfile);
  }, []);

  if (!profile) return <main className="min-h-screen bg-[#fff5f9] p-8">กำลังตรวจสอบบัญชี...</main>;

  const labels: Record<string,string> = {
    pending: "รอแอดมินอนุมัติ",
    approved: "อนุมัติแล้ว",
    rejected: "บัญชีถูกปฏิเสธ",
    suspended: "บัญชีถูกระงับ",
  };

  return (
    <main className="min-h-screen bg-[#fff5f9] px-5 py-10">
      <div className="mx-auto max-w-md rounded-[28px] border border-[#f4d4e1] bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-bold">{labels[profile.approval_status] ?? "ตรวจสอบบัญชี"}</h1>
        <p className="mt-3 text-sm text-[#8a8a9e]">
          รหัสลูกค้า {profile.customer_code ?? "-"} · ระดับ {String(profile.customer_tier ?? "normal").toUpperCase()}
        </p>
        {profile.approval_status === "approved" ? (
          <Link href="/home" className="mt-6 flex h-14 items-center justify-center rounded-full bg-[#f76da8] font-semibold text-white">
            เข้าใช้งานระบบ
          </Link>
        ) : (
          <p className="mt-6 rounded-2xl bg-[#fff0f6] p-4 text-sm">
            กรุณารอร้านค้าตรวจสอบ เมื่ออนุมัติแล้วจึงจะดูสินค้าและสั่งซื้อได้
          </p>
        )}
      </div>
    </main>
  );
}
