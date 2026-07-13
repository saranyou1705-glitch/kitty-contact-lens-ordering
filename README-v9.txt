Inventory v9

เพิ่ม:
- แอดมินดูยอด 4 จุด: ในคลัง / แพ็กแล้ว / จัดส่ง / ลูกค้ารับแล้ว
- แอดมินและ Packer อัปโหลด Excel ผลนับสต๊อค
- ระบบคำนวณผลต่างระหว่างยอดนับกับยอดระบบและบันทึกประวัติ
- แอดมินเพิ่มชนิดสินค้าโดยตรงหรือ Excel
- SKU ผูกกับ product variant
- แพ็ก: warehouse -> packed
- จัดส่ง: packed -> shipped
- ลูกค้ารับ: shipped -> delivered

ต้องรัน SQL: supabase/15_inventory_system.sql
ต้อง npm install เพราะเพิ่ม package xlsx

ข้อควรทราบ: โปรเจกต์เดิมยังไม่มีระบบยืนยันตัวตน/Session ที่บังคับ role ฝั่ง server อย่างสมบูรณ์ ก่อนใช้งาน production ต้องทำ auth จริงเพื่อป้องกันการปลอม actorRole
