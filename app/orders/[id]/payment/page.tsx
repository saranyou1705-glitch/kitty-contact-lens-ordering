"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type PaymentData = {
  order: {
    id: string;
    order_no: string;
    status: string;
    subtotal: number;
    shipping_fee: number | null;
    total_amount: number | null;
  };
  settings: {
    store_name: string;
    bank_name: string | null;
    bank_account_name: string | null;
    bank_account_no: string | null;
    promptpay_no: string | null;
    payment_qr_url: string | null;
  } | null;
};

export default function PaymentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<PaymentData | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const response = await fetch(`/api/payment-info?orderId=${params.id}`);
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "โหลดข้อมูลไม่สำเร็จ");
        setLoading(false);
        return;
      }

      setData(result);
      setLoading(false);
    }

    load();
  }, [params.id]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    if (!file || !data?.order.total_amount) {
      setMessage("กรุณาเลือกไฟล์สลิป");
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("orderId", data.order.id);

    const uploadResponse = await fetch("/api/payments/upload", {
      method: "POST",
      body: formData,
    });

    const uploadResult = await uploadResponse.json();

    if (!uploadResponse.ok) {
      setSubmitting(false);
      setMessage(uploadResult.error ?? "อัปโหลดสลิปไม่สำเร็จ");
      return;
    }

    const paymentResponse = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: data.order.id,
        slipImageUrl: uploadResult.publicUrl,
        amount: data.order.total_amount,
      }),
    });

    const paymentResult = await paymentResponse.json();
    setSubmitting(false);

    if (!paymentResponse.ok) {
      setMessage(paymentResult.error ?? "บันทึกการชำระเงินไม่สำเร็จ");
      return;
    }

    router.push(`/orders/${data.order.id}`);
    router.refresh();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fff5f9] p-6 text-center">
        กำลังโหลดข้อมูลการชำระเงิน...
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#fff5f9] p-6 text-center text-red-600">
        {message || "ไม่พบข้อมูล"}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fff5f9] px-5 pb-10 pt-7">
      <div className="mx-auto max-w-md">
        <header className="mb-6 flex items-center gap-4">
          <Link
            href={`/orders/${data.order.id}`}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f4cadb] bg-white text-[#f76da8]"
          >
            ←
          </Link>

          <div>
            <p className="text-sm text-[#8a8a9e]">{data.order.order_no}</p>
            <h1 className="text-2xl font-bold">ชำระเงิน</h1>
          </div>
        </header>

        <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#8a8a9e]">ยอดที่ต้องชำระ</p>
          <p className="mt-2 text-3xl font-bold text-[#f76da8]">
            ฿{Number(data.order.total_amount).toLocaleString("th-TH")}
          </p>

          <div className="mt-5 space-y-3 rounded-2xl bg-[#fff8fb] p-4 text-sm">
            <Info label="ธนาคาร" value={data.settings?.bank_name || "-"} />
            <Info label="ชื่อบัญชี" value={data.settings?.bank_account_name || "-"} />
            <Info label="เลขบัญชี" value={data.settings?.bank_account_no || "-"} />
            {data.settings?.promptpay_no && (
              <Info label="พร้อมเพย์" value={data.settings.promptpay_no} />
            )}
          </div>

          {data.settings?.payment_qr_url && (
            <div className="mt-5 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.settings.payment_qr_url}
                alt="QR Payment"
                className="mx-auto max-h-64 rounded-2xl border border-[#f4d4e1]"
              />
            </div>
          )}
        </section>

        <form
          onSubmit={submit}
          className="mt-5 rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm"
        >
          <label className="block font-bold">อัปโหลดสลิป</label>
          <p className="mt-1 text-xs text-[#8a8a9e]">
            รองรับ JPG, PNG และไฟล์ไม่เกิน 5 MB
          </p>

          <input
            required
            type="file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="mt-4 block w-full rounded-2xl border border-[#f3bfd4] bg-white p-3 text-sm"
          />

          {file && (
            <p className="mt-3 text-sm text-[#6f6872]">
              ไฟล์ที่เลือก: {file.name}
            </p>
          )}

          {message && (
            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 h-14 w-full rounded-full bg-[#f76da8] font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "กำลังอัปโหลด..." : "ยืนยันและส่งสลิป"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[#8a8a9e]">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
