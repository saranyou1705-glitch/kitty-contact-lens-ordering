แก้ SKU ใหม่ไม่แสดงฝั่งลูกค้า:
- หน้า Products ไม่ใช้ nested relation cache แล้ว
- อ่าน Products และ Active Variants แยกกันแล้วจับคู่เอง
- บังคับ force-dynamic/no cache
- เพิ่ม SKU ใน Model เดิมแล้วจะเปิด Product และ Color กลับเป็น Active
- SKU Active แสดงให้ลูกค้าเห็นทันทีหลังรีเฟรช

เพิ่ม Admin Login ด้วย LINE บนคอมพิวเตอร์:
- เปิด /admin/login
- กด Login ด้วย LINE
- LINE จะแสดง QR Code ให้สแกนจากโทรศัพท์
- ตรวจ ID token, LINE User ID, role และ approval_status
- บันทึก Audit Log เมื่อ Login

ต้องรัน SQL:
supabase/17_line_admin_login_and_approval.sql

ต้องเพิ่มใน .env.local:
NEXT_PUBLIC_APP_URL=http://localhost:3000
LINE_LOGIN_CHANNEL_ID=...
LINE_LOGIN_CHANNEL_SECRET=...
AUTH_SESSION_SECRET=...
SUPER_ADMIN_BOOTSTRAP=true

ใช้ SUPER_ADMIN_BOOTSTRAP=true เฉพาะครั้งแรก เมื่อ Login สำเร็จแล้วให้เปลี่ยนเป็น false
Callback URL ที่ต้องใส่ใน LINE Developers:
http://localhost:3000/api/auth/line/callback
สำหรับ Production ให้ใช้ HTTPS domain จริงแทน localhost
