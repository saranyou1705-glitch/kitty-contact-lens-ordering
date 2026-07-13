import PaymentBatchClient from "./payment-batch-client";

type PageProps = { params: Promise<{ id: string }> };

export default async function PaymentBatchPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-[#fff5f9] px-4 py-6">
      <div className="mx-auto max-w-md">
        <header className="mb-5 pt-10">
          <p className="text-sm text-[#8a8a9e]">ชำระเงิน</p>
          <h1 className="text-2xl font-bold">รายละเอียดรายการชำระ</h1>
        </header>
        <PaymentBatchClient batchId={id} />
      </div>
    </main>
  );
}
