"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [busyId, setBusyId] = useState("");
  const [form, setForm] = useState({
    sku: "",
    category: "Contact Lens",
    modelName: "",
    color: "",
    power: "0.00",
    productType: "Blister",
    retailPrice: "250",
    memberPrice: "220",
    openingQty: "0",
    active: "true",
  });

  async function load() {
    const r = await fetch(`/api/admin/products?t=${Date.now()}`, { cache: "no-store" });
    const d = await r.json();
    if (r.ok) setItems(d.items ?? []);
  }

  useEffect(() => { load(); }, []);

  async function upload() {
    if (!file) return;
    const f = new FormData();
    f.set("file", file);
    f.set("actorRole", "admin");
    const r = await fetch("/api/admin/products/import", { method: "POST", body: f });
    const d = await r.json();
    setMsg(d.error ?? `เพิ่ม ${d.created} อัปเดต ${d.updated} ผิดพลาด ${d.errors?.length ?? 0}`);
    if (r.ok) await load();
  }

  async function create() {
    const r = await fetch("/api/admin/products/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, active: form.active === "true", actorRole: "admin" }),
    });
    const d = await r.json();
    setMsg(d.error ?? "เพิ่มสินค้าแล้ว");
    if (r.ok) await load();
  }

  async function toggle(item: any) {
    const active = !(item.product?.is_active && item.is_orderable);
    setBusyId(item.id);
    const r = await fetch(`/api/admin/products/${item.id}/active`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    const d = await r.json();
    setBusyId("");
    setMsg(d.error ?? (active ? "เปิดขายสินค้าแล้ว" : "ปิดการแสดงสินค้าแล้ว"));
    if (r.ok) await load();
  }

  return (
    <main className="min-h-screen bg-[#fff5f9] px-5 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">จัดการชนิดสินค้า</h1>
            <p className="mt-2 text-sm text-[#8a8a9e]">
              Active = ลูกค้าเห็นและเลือกสั่งได้
            </p>
          </div>
          <div className="flex gap-2">
            <a href="/api/admin/products/export" className="rounded-full border border-[#f3bfd4] bg-white px-4 py-3 text-sm font-semibold text-[#f76da8]">
              ส่งออก Excel
            </a>
            <Link href="/admin" className="rounded-full bg-[#f76da8] px-4 py-3 text-sm font-semibold text-white">
              กลับหน้าหลักแอดมิน
            </Link>
          </div>
        </div>

        <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-bold">นำเข้าจาก Excel</h2>
          <a href="/templates/product-master-template.xlsx" download className="mt-2 inline-block text-sm font-semibold text-[#f76da8]">
            ดาวน์โหลดไฟล์ตัวอย่าง
          </a>
          <input type="file" accept=".xlsx,.xls" onChange={e => setFile(e.target.files?.[0] ?? null)} className="mt-4 block w-full rounded-2xl border p-3" />
          <button onClick={upload} className="mt-4 h-12 w-full rounded-full bg-[#f76da8] font-semibold text-white">
            นำเข้าสินค้า
          </button>
        </section>

        <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-bold">เพิ่มสินค้าโดยตรง</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(form).map(([k, v]) => (
              <label key={k} className="text-sm">
                {k}
                {k === "active" ? (
                  <select value={v} onChange={e => setForm({ ...form, [k]: e.target.value })} className="mt-1 h-11 w-full rounded-xl border px-3">
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                ) : (
                  <input value={v} onChange={e => setForm({ ...form, [k]: e.target.value })} className="mt-1 h-11 w-full rounded-xl border px-3" />
                )}
              </label>
            ))}
          </div>
          <button onClick={create} className="mt-5 h-12 w-full rounded-full bg-[#f76da8] font-semibold text-white">
            เพิ่มสินค้า
          </button>
        </section>

        {msg && <p className="mt-4 rounded-2xl bg-white p-4">{msg}</p>}

        <section className="mt-5 overflow-x-auto rounded-3xl bg-white shadow-sm">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-[#fff0f6]">
              <tr>
                <th className="p-3 text-left">SKU</th>
                <th className="p-3 text-left">สินค้า</th>
                <th>ค่าสายตา</th>
                <th>ราคาปลีก</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const active = Boolean(item.product?.is_active && item.is_orderable);
                return (
                  <tr key={item.id} className="border-t">
                    <td className="p-3 font-semibold">{item.sku || "-"}</td>
                    <td className="p-3">{item.product?.model_name} · {item.color?.color_name}</td>
                    <td className="text-center">{item.power}</td>
                    <td className="text-center">฿{Number(item.retail_price ?? 0).toLocaleString("th-TH")}</td>
                    <td className="text-center">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        disabled={busyId === item.id}
                        onClick={() => toggle(item)}
                        className={`rounded-full px-4 py-2 text-xs font-semibold text-white ${active ? "bg-gray-500" : "bg-green-600"}`}
                      >
                        {busyId === item.id ? "กำลังบันทึก..." : active ? "ตั้งเป็น Inactive" : "ตั้งเป็น Active"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
