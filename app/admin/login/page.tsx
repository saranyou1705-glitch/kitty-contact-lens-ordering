export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff5f9] px-5">
      <section className="w-full max-w-md rounded-[28px] border border-[#f4d4e1] bg-white p-7 text-center shadow-sm">
        <div className="text-5xl">LINE</div>
        <h1 className="mt-4 text-2xl font-bold">เข้าสู่ระบบแอดมิน</h1>
        <p className="mt-3 text-sm leading-6 text-[#8a8a9e]">
          เปิดหน้านี้บนคอมพิวเตอร์ แล้วกดเข้าสู่ระบบ LINE
          หน้าของ LINE จะแสดง QR Code ให้สแกนจากโทรศัพท์
        </p>
        {error && (
          <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-600">
            {decodeURIComponent(error)}
          </p>
        )}
        <a
          href="/api/auth/line/start"
          className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-[#06c755] font-semibold text-white"
        >
          Login ด้วย LINE
        </a>
        <p className="mt-4 text-xs text-[#8a8a9e]">
          เฉพาะบัญชี Admin หรือ Super Admin ที่ได้รับอนุมัติแล้ว
        </p>
      </section>
    </main>
  );
}
