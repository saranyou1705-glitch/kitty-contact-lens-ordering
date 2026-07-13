"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function Page() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [settings, setSettings] = useState({ normal_percent: 25, vip_percent: 40, vvip_percent: 60 });
  const [message, setMessage] = useState("");

  async function load() {
    const [u, s] = await Promise.all([
      fetch(`/api/admin/users?t=${Date.now()}`, { cache: "no-store" }).then(r => r.json()),
      fetch(`/api/admin/customer-stock-settings?t=${Date.now()}`, { cache: "no-store" }).then(r => r.json()),
    ]);
    setItems(u.items ?? []);
    if (!s.error) setSettings(s);
  }

  useEffect(() => { load(); }, []);

  async function update(id: string, patch: any) {
    const r = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const d = await r.json();
    setMessage(d.error ?? "บันทึกแล้ว");
    if (r.ok) await load();
  }

  async function saveSettings() {
    const r = await fetch("/api/admin/customer-stock-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        normalPercent: settings.normal_percent,
        vipPercent: settings.vip_percent,
        vvipPercent: settings.vvip_percent,
      }),
    });
    const d = await r.json();
    setMessage(d.error ?? "บันทึกเปอร์เซ็นต์แล้ว");
    if (r.ok) setSettings(d);
  }

  const shown = useMemo(() => items.filter(x =>
    `${x.customer_code} ${x.nickname} ${x.full_name} ${x.shop_name} ${x.phone} ${x.line_user_id}`.toLowerCase().includes(q.toLowerCase())
  ), [items, q]);

  return (
    <main className="min-h-screen bg-[#fff5f9] px-5 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">จัดการผู้ใช้งาน</h1>
            <p className="mt-2 text-sm text-[#8a8a9e]">อนุมัติบัญชี กำหนด Role และระดับลูกค้า</p>
          </div>
          <Link href="/admin" className="rounded-full bg-[#f76da8] px-4 py-3 text-sm font-semibold text-white">กลับหน้าหลักแอดมิน</Link>
        </div>

        <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="font-bold">เปอร์เซ็นต์สต๊อคที่ลูกค้ามองเห็น</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ["normal_percent","ธรรมดา"],
              ["vip_percent","VIP"],
              ["vvip_percent","VVIP"],
            ].map(([key,label]) => (
              <label key={key} className="text-sm">{label} (%)
                <input type="number" min="0" max="100" value={(settings as any)[key]}
                  onChange={e => setSettings({ ...settings, [key]: Number(e.target.value) })}
                  className="mt-2 h-11 w-full rounded-xl border px-3" />
              </label>
            ))}
          </div>
          <button onClick={saveSettings} className="mt-4 h-12 rounded-full bg-[#f76da8] px-6 font-semibold text-white">บันทึกเปอร์เซ็นต์</button>
        </section>

        <input value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหารหัส ชื่อ ร้าน เบอร์ หรือ LINE User ID" className="mt-5 h-12 w-full rounded-2xl border border-[#f3bfd4] bg-white px-4" />

        {message && <p className="mt-3 rounded-2xl bg-white p-3 text-sm">{message}</p>}

        <div className="mt-4 overflow-x-auto rounded-3xl bg-white shadow-sm">
          <table className="min-w-[1400px] w-full text-sm">
            <thead className="bg-[#fff0f6]">
              <tr>
                {["รหัส","ชื่อเล่น","ชื่อจริง","ร้าน","โทรศัพท์","LINE User ID","Role","ระดับ","สถานะ","วันที่สมัคร","จัดการ"].map(h => <th key={h} className="p-3 text-left">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {shown.map(x => (
                <tr key={x.id} className="border-t align-top">
                  <td className="p-3 font-semibold">{x.customer_code ?? "-"}</td>
                  <td className="p-3">{x.nickname ?? "-"}</td>
                  <td className="p-3">{x.full_name ?? "-"}</td>
                  <td className="p-3">{x.shop_name ?? "-"}</td>
                  <td className="p-3">{x.phone ?? "-"}</td>
                  <td className="p-3 text-xs">{x.line_user_id ?? "-"}</td>
                  <td className="p-3">
                    <select value={x.role ?? "customer"} onChange={e => update(x.id,{role:e.target.value})} className="rounded-xl border px-2 py-2">
                      <option value="customer">Customer</option>
                      <option value="packer">Packer</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <select value={x.customer_tier ?? "normal"} onChange={e => update(x.id,{customerTier:e.target.value})} className="rounded-xl border px-2 py-2">
                      <option value="normal">Normal</option>
                      <option value="vip">VIP</option>
                      <option value="vvip">VVIP</option>
                    </select>
                  </td>
                  <td className="p-3">{x.approval_status}</td>
                  <td className="p-3">{new Date(x.created_at).toLocaleString("th-TH")}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => update(x.id,{approvalStatus:"approved"})} className="rounded-full bg-green-600 px-3 py-2 text-xs font-semibold text-white">อนุมัติ</button>
                      <button onClick={() => update(x.id,{approvalStatus:"rejected"})} className="rounded-full bg-red-500 px-3 py-2 text-xs font-semibold text-white">ปฏิเสธ</button>
                      <button onClick={() => update(x.id,{approvalStatus:"suspended"})} className="rounded-full bg-gray-600 px-3 py-2 text-xs font-semibold text-white">ระงับ</button>
                    </div>
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
