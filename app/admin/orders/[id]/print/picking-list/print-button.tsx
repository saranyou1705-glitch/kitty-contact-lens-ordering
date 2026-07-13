"use client";

import { useState } from "react";

export default function PrintButton({ orderId }: { orderId: string }) {
  const [message, setMessage] = useState("");

  async function printAndStartPacking() {
    const response = await fetch(
      `/api/packer/orders/${orderId}/print-start`,
      { method: "POST" },
    );

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "ไม่สามารถเริ่มแพ็กได้");
      return;
    }

    window.print();
  }

  return (
    <div className="mb-5 print:hidden">
      <button
        type="button"
        onClick={printAndStartPacking}
        className="rounded-full bg-[#f76da8] px-5 py-3 font-semibold text-white"
      >
        ปริ๊นใบจัดของ
      </button>

      {message && (
        <p className="mt-2 text-sm text-red-600">{message}</p>
      )}
    </div>
  );
}
