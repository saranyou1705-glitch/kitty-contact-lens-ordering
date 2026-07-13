โปรเจกต์นี้จัดระเบียบและแก้โครงสร้างแล้ว

สิ่งที่แก้สำคัญ
- ลบไฟล์ page.tsx ที่วางผิดใน app/api
- ลบไฟล์หน้าลูกค้าที่วางผิดใน app/api/payments
- แยก API และ Page ให้ถูกตาม Next.js App Router
- แก้หน้าชำระเงินลูกค้าให้แสดง:
  • เลขออเดอร์ที่เลือก
  • ยอดแต่ละออเดอร์
  • ยอดรวม
  • ลบออเดอร์บางใบได้
  • ลบรายการชำระรวมได้
  • บัญชีธนาคารและอัปโหลดสลิปอยู่หน้าเดียวกัน
- หลังส่งสลิป ระบบไปหน้ารับทราบ /payments/success
- แก้หน้า Admin Payment Batch Detail ไม่ใช้ relational embed ที่กำกวม
- ลบ .DS_Store, .git, node_modules, .next และ .env.local ออกจากไฟล์ส่งกลับ

วิธีติดตั้ง
1. สำรองโปรเจกต์เดิม
2. ใช้โฟลเดอร์นี้แทนโปรเจกต์เดิม
3. คัดลอก .env.local เดิมของคุณกลับมา หรือสร้างจาก .env.example
4. รัน:
   npm install
   rm -rf .next
   npm run dev

ลิงก์ทดสอบ
ลูกค้า: http://localhost:3000/home
ชำระเงิน: http://localhost:3000/payments/new
แอดมิน: http://localhost:3000/admin
ตรวจชำระเงิน: http://localhost:3000/admin/payment-batches
Packer: http://localhost:3000/packer
