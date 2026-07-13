"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import InventoryCountUpload from "@/components/inventory-count-upload";

export default function InventoryPageClient() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/admin/inventory?t=${Date.now()}`, {
      cache: "no-store",
    });
    const d = await r.json();
    if (r.ok) setItems(d.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const shown = useMemo(
    () =>
      items.filter((x) =>
        `${x.sku} ${x.product?.model_name} ${x.color?.color_name} ${x.power}`
          .toLowerCase()
          .includes(q.toLowerCase()),
      ),
    [items, q],
  );

  const totals = items.reduce(
    (a, x) => ({
      w: a.w + x.warehouse_qty,
      p: a.p + x.packed_qty,
      s: a.s + x.shipped_qty,
      d: a.d + x.delivered_qty,
    }),
    { w: 0, p: 0, s: 0, d: 0 },
  );

  return (
    <main className="min-h-screen bg-[#fff5f9] px-5 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">สินค้าคงคลัง</h1>
            <p className="mt-2 text-sm text-[#8a8a9e]">
              เฉพาะแอดมินดูยอดทั้งหมดได้
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/api/admin/inventory/export"
              className="rounded-full border border-[#f3bfd4] bg-white px-4 py-3 text-sm font-semibold text-[#f76da8]"
            >
              ส่งออก Excel
            </a>
            <Link
              href="/admin"
              className="rounded-full bg-[#f76da8] px-4 py-3 text-sm font-semibold text-white"
            >
              กลับหน้าหลักแอดมิน
            </Link>
          </div>
        </div>

        <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["อยู่ในคลัง", totals.w],
            ["แพ็กแล้ว", totals.p],
            ["จัดส่ง", totals.s],
            ["ลูกค้ารับแล้ว", totals.d],
          ].map(([l, v]) => (
            <div key={String(l)} className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm text-[#8a8a9e]">{l}</p>
              <p className="mt-1 text-3xl font-bold text-[#f76da8]">{v}</p>
            </div>
          ))}
        </section>

        <div className="mt-5">
          <InventoryCountUpload actorRole="admin" onCompleted={load} />
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหา SKU รุ่น สี ค่าสายตา"
          className="mt-5 h-12 w-full rounded-2xl border border-[#f3bfd4] bg-white px-4"
        />

        {loading && (
          <p className="mt-4 text-sm text-[#8a8a9e]">กำลังรีเฟรชตัวเลข...</p>
        )}

        <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-[#fff0f6]">
              <tr>
                <th className="p-3 text-left">SKU</th>
                <th className="p-3 text-left">สินค้า</th>
                <th>ค่าสายตา</th>
                <th>ในคลัง</th>
                <th>แพ็กแล้ว</th>
                <th>จัดส่ง</th>
                <th>รับแล้ว</th>
                <th>นับล่าสุด</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((x) => (
                <tr key={x.id} className="border-t">
                  <td className="p-3 font-semibold">{x.sku || "ยังไม่มี SKU"}</td>
                  <td className="p-3">
                    {x.product?.model_name} · {x.color?.color_name}
                  </td>
                  <td className="text-center">{x.power}</td>
                  <td className="text-center font-bold">{x.warehouse_qty}</td>
                  <td className="text-center">{x.packed_qty}</td>
                  <td className="text-center">{x.shipped_qty}</td>
                  <td className="text-center">{x.delivered_qty}</td>
                  <td className="text-center text-xs">
                    {x.last_counted_at
                      ? new Date(x.last_counted_at).toLocaleString("th-TH")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
