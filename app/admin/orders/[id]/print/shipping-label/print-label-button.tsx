"use client";

export default function PrintLabelButton() {
  return (
    <div className="mb-4 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="w-full rounded-full bg-[#f76da8] px-5 py-3 font-semibold text-white"
      >
        ปริ๊นใบปะหน้า
      </button>
    </div>
  );
}
