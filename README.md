# IELTS 30 วัน

เว็บแอปติดตามแผนเตรียมสอบ IELTS 30 วัน สร้างจากไฟล์ Excel `IELTS_30_Day_Study_Plan.xlsx` ใช้คนเดียว ไม่มีเซิร์ฟเวอร์ ไม่ต้อง build

## ฟีเจอร์

- ภาพรวม: แถบ 30 วันสีตามทักษะ (ระบายเมื่อเสร็จ), วันที่ต้องทำวันนี้, ชั่วโมงสะสม, นับถอยหลังวันสอบ
- แผน 30 วัน: แบ่งตามสัปดาห์ กรองตามทักษะได้
- หน้าแต่ละวัน: เนื้อหา, เช็กลิสต์งาน, บันทึกวันที่/ชั่วโมง/คะแนน/ข้อผิดพลาด (แทนแท็บ "ติดตามผล")
- วิดีโอ: ปุ่มค้นหา YouTube ตามหัวข้อ, เก็บลิงก์/ช่อง/สรุป (แทนแท็บ "YouTube Tracker")
- สมุดข้อผิดพลาด: รวมสิ่งที่จดไว้ทุกวัน พิมพ์ได้
- ข้อมูลเก็บใน `localStorage` ของเบราว์เซอร์ ใช้ Export/Import JSON เพื่อสำรอง และ Export CSV เปิดใน Excel ได้

## ใช้งานในเครื่อง

เปิด `index.html` ได้เลย หรือรัน `python3 -m http.server` แล้วเข้า http://localhost:8000

## Deploy บน GitHub Pages

1. สร้าง repo ใหม่ใน GitHub เช่น `ielts-30-day-planner`
2. ในโฟลเดอร์นี้รัน:
   ```bash
   git init -b main
   git add .
   git commit -m "IELTS 30 day planner"
   git remote add origin https://github.com/<username>/ielts-30-day-planner.git
   git push -u origin main
   ```
3. ที่ repo เลือก Settings → Pages → Build and deployment → Source: **Deploy from a branch** → Branch: `main` / `/ (root)` → Save
4. รอประมาณ 1 นาที เว็บจะอยู่ที่ `https://<username>.github.io/ielts-30-day-planner/`

หมายเหตุ: ข้อมูลผูกกับเบราว์เซอร์และโดเมนที่ใช้ ถ้าเปลี่ยนเครื่องให้ Export แล้ว Import ที่เครื่องใหม่ ใครที่เปิดลิงก์ของคุณจะเห็นข้อมูลของตัวเอง ไม่เห็นข้อมูลของคุณ

## แก้เนื้อหาแผน

เนื้อหาอยู่ใน `data.js` (สร้างจาก Excel) แก้ข้อความในไฟล์นั้นได้โดยตรง ถ้าเพิ่ม/ลดงานในวันใด ข้อมูลเช็กลิสต์ที่เคยติ๊กของวันนั้นอาจเลื่อนตำแหน่ง

## โครงสร้าง

```
index.html   โครงหน้า
style.css    ธีมสว่าง/มืด, responsive
app.js       logic, routing แบบ hash, localStorage
data.js      แผน 30 วันจาก Excel
```
