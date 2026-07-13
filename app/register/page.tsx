"use client";

import Script from "next/script";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    liff?: {
      init(args: { liffId: string }): Promise<void>;
      isLoggedIn(): boolean;
      login(): void;
      getProfile(): Promise<{ userId: string; displayName: string }>;
    };
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const [lineUserId, setLineUserId] = useState("");
  const [lineDisplayName, setLineDisplayName] = useState("");
  const [lineReady, setLineReady] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function initLiff() {
    try {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
      if (!liffId || !window.liff) {
        setMessage("ยังไม่ได้ตั้งค่า NEXT_PUBLIC_LIFF_ID");
        return;
      }
      await window.liff.init({ liffId });
      if (!window.liff.isLoggedIn()) {
        window.liff.login();
        return;
      }
      const profile = await window.liff.getProfile();
      setLineUserId(profile.userId);
      setLineDisplayName(profile.displayName);
      setLineReady(true);
    } catch {
      setMessage("ไม่สามารถเชื่อมต่อ LINE LIFF ได้");
    }
  }

  useEffect(() => {
    if (window.liff) initLiff();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lineUserId) {
      setMessage("ไม่พบ LINE User ID กรุณาเปิดผ่าน LINE LIFF");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lineUserId,
        nickname: form.get("nickname"),
        fullName: form.get("fullName"),
        shopName: form.get("shopName"),
        phone: form.get("phone"),
        address: form.get("address"),
        subdistrict: form.get("subdistrict"),
        district: form.get("district"),
        province: form.get("province"),
        postalCode: form.get("postalCode"),
      }),
    });

    const result = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(result.error ?? "ลงทะเบียนไม่สำเร็จ");
      return;
    }

    localStorage.setItem("kitty_profile_id", result.profileId);
    router.push("/account-status");
  }

  return (
    <>
      <Script
        src="https://static.line-scdn.net/liff/edge/2/sdk.js"
        strategy="afterInteractive"
        onLoad={initLiff}
      />
      <main className="min-h-screen bg-[#fff5f9] px-5 py-8">
        <div className="mx-auto max-w-md">
          <header className="mb-6">
            <p className="text-sm text-[#8a8a9e]">สมัครผ่าน LINE LIFF</p>
            <h1 className="text-3xl font-bold">ลงทะเบียนลูกค้า</h1>
          </header>

          <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
            <div className="mb-4 rounded-2xl bg-[#fff0f6] p-4 text-sm">
              LINE: {lineReady ? lineDisplayName : "กำลังเชื่อมต่อ..."}
            </div>

            <form onSubmit={submit} className="space-y-4">
              <Field label="ชื่อเล่น" name="nickname" />
              <Field label="ชื่อจริง–นามสกุล" name="fullName" />
              <Field label="ชื่อร้าน" name="shopName" />
              <Field label="เบอร์โทร" name="phone" inputMode="numeric" />
              <label className="block text-sm font-medium">
                ที่อยู่จัดส่ง
                <textarea name="address" required rows={3} className="mt-2 w-full rounded-2xl border border-[#f3bfd4] px-4 py-3" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Field label="แขวง/ตำบล" name="subdistrict" />
                <Field label="เขต/อำเภอ" name="district" />
                <Field label="จังหวัด" name="province" />
                <Field label="รหัสไปรษณีย์" name="postalCode" inputMode="numeric" />
              </div>

              {message && <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-600">{message}</p>}

              <button disabled={isSubmitting || !lineReady} className="h-14 w-full rounded-full bg-[#f76da8] font-semibold text-white disabled:opacity-40">
                {isSubmitting ? "กำลังสมัคร..." : "ส่งคำขอสมัคร"}
              </button>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}

function Field({ label, name, inputMode = "text" }: { label: string; name: string; inputMode?: "text" | "numeric" }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input name={name} required inputMode={inputMode} className="mt-2 h-12 w-full rounded-2xl border border-[#f3bfd4] px-4" />
    </label>
  );
}
