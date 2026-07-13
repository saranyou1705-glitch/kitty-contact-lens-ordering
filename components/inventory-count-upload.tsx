"use client";
import { useState } from "react";

export default function InventoryCountUpload({
  actorRole,
  onCompleted,
}: {
  actorRole: "admin" | "packer";
  onCompleted?: () => void | Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!file) return;
    const f = new FormData();
    f.set("file", file);
    f.set("actorRole", actorRole);
    f.set("actorId", localStorage.getItem("kitty_profile_id") ?? "");
    setLoading(true);
    setResult(null);
    const r = await fetch("/api/inventory/import-count", {
      method: "POST",
      body: f,
    });
    const d = await r.json();
    setLoading(false);
    setResult(d);
    if (r.ok && onCompleted) await onCompleted();
  }

  return (
    <section className="rounded-[24px] border border-[#f4d4e1] bg-white p-5 shadow-sm">
      <h2 className="font-bold">อัปโหลดผลนับสต๊อค</h2>
      <p className="mt-2 text-sm text-[#8a8a9e]">
        ไฟล์ต้องมี SKU, Quantity และ Counted At
      </p>
      <a
        href="/templates/inventory-count-template.xlsx"
        download
        className="mt-3 inline-block text-sm font-semibold text-[#f76da8]"
      >
        ดาวน์โหลดไฟล์ตัวอย่าง Excel
      </a>
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="mt-4 block w-full rounded-2xl border border-[#f3bfd4] p-3"
      />
      <button
        onClick={run}
        disabled={!file || loading}
        className="mt-4 h-12 w-full rounded-full bg-[#f76da8] font-semibold text-white disabled:opacity-40"
      >
        {loading ? "กำลังนำเข้า..." : "นำเข้าผลนับสต๊อค"}
      </button>
      {result && (
        <div
          className={`mt-4 rounded-2xl p-4 text-sm ${
            result.error
              ? "bg-red-50 text-red-600"
              : "bg-green-50 text-green-700"
          }`}
        >
          {result.error ??
            `สำเร็จ ${result.matched} SKU · ไม่พบ ${result.unmatched} SKU · ผลต่างรวม ${result.totalDifference}`}
        </div>
      )}
    </section>
  );
}
