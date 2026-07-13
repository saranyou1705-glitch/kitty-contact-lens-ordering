"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Item = {
  payment_batch_id: string;
  order_id: string;
  amount_applied: number;
  order: {
    id: string;
    order_no: string;
    final_total: number | null;
    total_amount: number | null;
    outstanding_amount: number | null;
  } | null;
};

type Batch = {
  id: string;
  batch_no: string;
  status: string;
  verification_status: string;
  slip_image_url: string | null;
};

export default function PaymentBatchClient({ batchId }: { batchId: string }) {
  const router = useRouter();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    const response = await fetch(`/api/payment-batches/${batchId}`, {
      cache: "no-store",
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "โหลดรายการชำระเงินไม่สำเร็จ");
      setLoading(false);
      return;
    }

    setBatch(result.batch);
    setItems(result.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [batchId]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.amount_applied ?? 0), 0),
    [items],
  );

  const status = batch?.verification_status ?? batch?.status ?? "not_submitted";
  const hasSlip = Boolean(batch?.slip_image_url) || ["pending", "approved", "paid"].includes(status);
  const editable = !hasSlip && !["approved", "paid"].includes(status);

  async function removeOrder(orderId: string) {
    if (!window.confirm("ลบออเดอร์นี้ออกจากรายการชำระรวมใช่หรือไม่?")) return;

    const response = await fetch(
      `/api/payment-batches/${batchId}/orders/${orderId}`,
      { method: "DELETE" },
    );
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "ลบออเดอร์ไม่สำเร็จ");
      return;
    }

    if (result.remainingCount === 0) {
      router.push("/payments/new");
      router.refresh();
      return;
    }

    await load();
  }

  async function deleteBatch() {
    if (!window.confirm("ลบรายการชำระรวมนี้ทั้งหมดใช่หรือไม่?")) return;

    const response = await fetch(`/api/payment-batches/${batchId}`, {
      method: "DELETE",
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "ลบรายการชำระเงินไม่สำเร็จ");
      return;
    }

    router.push("/payments/new");
    router.refresh();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setMessage("กรุณาเลือกไฟล์สลิป");
      return;
    }

    setSaving(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`/api/payment-batches/${batchId}/upload`, {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(result.error ?? "อัปโหลดสลิปไม่สำเร็จ");
      return;
    }

    router.push("/payments/success");
  }

  if (loading) {
    return <p className="py-12 text-center text-[#8a8a9e]">กำลังโหลด...</p>;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
        <p className="text-sm text-[#8a8a9e]">โอนเงินเข้าบัญชี</p>
        <p className="mt-2 text-lg font-bold">
          {process.env.NEXT_PUBLIC_BANK_NAME || "ยังไม่ได้ตั้งค่าชื่อธนาคาร"}
        </p>
        <p className="mt-2 text-sm">
          {process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "ยังไม่ได้ตั้งค่าชื่อบัญชี"}
        </p>
        <p className="mt-2 break-all text-2xl font-bold tracking-wide text-[#f76da8]">
          {process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || "ยังไม่ได้ตั้งค่าเลขบัญชี"}
        </p>
      </section>

      <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs text-[#8a8a9e]">{batch?.batch_no}</p>
          <h2 className="mt-1 font-bold">ออเดอร์ที่เลือกไว้</h2>
          <p className="mt-1 text-sm text-[#8a8a9e]">รวม {items.length} ออเดอร์</p>
        </div>

        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <article key={item.order_id} className="rounded-2xl border border-[#f4d4e1] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold">{item.order?.order_no ?? item.order_id}</p>
                  <p className="mt-1 text-xs text-[#8a8a9e]">ยอดที่เลือกชำระ</p>
                </div>
                <p className="shrink-0 font-bold text-[#f76da8]">
                  ฿{Number(item.amount_applied ?? 0).toLocaleString("th-TH")}
                </p>
              </div>

              {editable && (
                <button
                  type="button"
                  onClick={() => removeOrder(item.order_id)}
                  className="mt-3 h-10 w-full rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-600"
                >
                  ลบออเดอร์นี้ออกจากรายการ
                </button>
              )}
            </article>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-[#f4d4e1] pt-4">
          <span className="font-bold">ยอดรวม</span>
          <span className="text-2xl font-bold text-[#f76da8]">
            ฿{total.toLocaleString("th-TH")}
          </span>
        </div>

        {editable && (
          <button
            type="button"
            onClick={deleteBatch}
            className="mt-4 h-11 w-full rounded-xl border border-red-300 bg-white text-sm font-semibold text-red-600"
          >
            ลบรายการชำระทั้งหมด
          </button>
        )}
      </section>

      {message && <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-600">{message}</p>}

      {!hasSlip ? (
        <form onSubmit={submit} className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
          <h2 className="font-bold">อัปโหลดสลิป</h2>
          <p className="mt-2 text-sm text-[#8a8a9e]">
            ยอดที่ต้องโอน ฿{total.toLocaleString("th-TH")}
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="mt-4 block w-full rounded-2xl border border-[#f3bfd4] bg-white p-3 text-sm"
          />
          <button
            type="submit"
            disabled={saving}
            className="mt-4 h-14 w-full rounded-full bg-[#f76da8] font-semibold text-white disabled:opacity-50"
          >
            {saving ? "กำลังส่ง..." : "ส่งสลิปชำระเงิน"}
          </button>
        </form>
      ) : (
        <section className="rounded-[24px] border border-green-200 bg-green-50 p-5 text-green-800">
          <h2 className="font-bold">ส่งสลิปแล้ว</h2>
          <p className="mt-2 text-sm leading-6">
            การชำระเงินของคุณได้รับการบันทึกแล้ว กรุณารอการยืนยันการรับยอดจากร้านค้า
          </p>
        </section>
      )}
    </div>
  );
}
