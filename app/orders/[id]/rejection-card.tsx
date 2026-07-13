export default function RejectionCard({
  status,
  reason,
}: {
  status: string;
  reason: string | null;
}) {
  if (status !== "rejected") return null;

  return (
    <section className="rounded-[24px] border border-red-200 bg-red-50 p-5">
      <h2 className="font-bold text-red-700">ออเดอร์ถูกปฏิเสธ</h2>
      <p className="mt-3 text-sm text-red-700">
        {reason || "กรุณาติดต่อแอดมินเพื่อสอบถามรายละเอียด"}
      </p>
    </section>
  );
}
