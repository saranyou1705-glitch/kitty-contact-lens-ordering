แก้ Runtime SyntaxError ตอนแอดมินกดยืนยันสลิป

สาเหตุ:
- หน้าแอดมินเรียก /api/admin/payment-batches/[id]/review
- แต่โปรเจกต์เดิมไม่มี route นี้ ทำให้ได้รับหน้า 404 HTML
- โค้ดพยายามอ่าน HTML เป็น JSON จึงเกิด Runtime SyntaxError

แก้แล้ว:
- เพิ่ม API ตรวจสอบ payment batch
- อนุมัติแล้วอัปเดต paid_amount, outstanding_amount และ payment_status ของทุกออเดอร์
- ปฏิเสธแล้วคืนสถานะออเดอร์เป็นยังไม่ชำระ
- อัปเดตสถานะ payment_batches เป็น approved หรือ rejected
- ป้องกันการอ่านข้อความ non-JSON จนเกิด SyntaxError
- เพิ่มกล่องยืนยันก่อนอนุมัติหรือปฏิเสธ

วิธีรัน:
1. นำ .env.local จากโปรเจกต์เดิมมาใส่
2. npm install
3. rm -rf .next
4. npm run dev
