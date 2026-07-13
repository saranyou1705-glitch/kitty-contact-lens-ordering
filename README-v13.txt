v13
- ลูกค้าสมัครผ่าน LINE LIFF
- เก็บ LINE User ID ชื่อเล่น ชื่อจริง ชื่อร้าน เบอร์โทร ที่อยู่
- สร้างรหัสลูกค้าอัตโนมัติ
- สมัครใหม่เป็น Normal และสถานะ Pending
- ต้องให้แอดมินอนุมัติก่อนใช้งาน
- หน้า /admin/users จัดการ User, Role, Tier, Approval
- ตั้งเปอร์เซ็นต์สต๊อค Normal/VIP/VVIP ได้จากหน้า User Management
- ลูกค้าเห็นและสั่งได้ตาม floor(warehouse_qty × percent / 100)
- ตรวจสิทธิ์และจำนวนซ้ำฝั่ง Server ตอนสร้างออเดอร์

ต้องรัน SQL:
supabase/18_user_management_and_stock_visibility.sql

.env.local:
NEXT_PUBLIC_LIFF_ID=LIFF_ID
