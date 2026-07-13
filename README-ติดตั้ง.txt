ติดตั้งชุดเชื่อม Supabase และลงทะเบียนจริง

1) แตก ZIP แล้วคัดลอกทุกโฟลเดอร์/ไฟล์ไปวางทับใน:
   /Users/ea/kitty-contact-lens-ordering/

2) เข้า Supabase > SQL Editor > New query
   เปิดไฟล์ supabase/01_registration_tables.sql
   คัดลอกทั้งหมดไปวาง แล้วกด Run

3) สร้างไฟล์ .env.local ที่โฟลเดอร์หลักของโปรเจกต์
   ใช้รูปแบบจาก .env.local.example

   NEXT_PUBLIC_SUPABASE_URL=Project URL
   SUPABASE_SERVICE_ROLE_KEY=Service role key

   หาได้ที่ Supabase > Project Settings > API

   สำคัญ:
   - ห้ามส่ง Service role key ให้คนอื่น
   - ห้ามใส่ Key ลง GitHub
   - ตรวจว่า .gitignore มี .env*

4) ใส่ค่าเดียวกันใน Vercel:
   Project > Settings > Environment Variables
   - NEXT_PUBLIC_SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   เลือก Production, Preview, Development

5) ทดสอบ:
   cd ~/kitty-contact-lens-ordering
   npm run dev
   เปิด http://localhost:3000/register
   กรอกข้อมูลและกดบันทึก

6) ตรวจข้อมูลใน Supabase:
   Table Editor > profiles
   Table Editor > customer_addresses

7) เมื่อทดสอบสำเร็จ:
   git add .
   git commit -m "Connect customer registration to Supabase"
   git push

หมายเหตุ:
- ห้าม git add ไฟล์ .env.local
- หน้า Home หลังลงทะเบียนเป็นหน้าเริ่มต้นชั่วคราว
- ขั้นถัดไปคือสร้าง Product List และ Admin Product Management
