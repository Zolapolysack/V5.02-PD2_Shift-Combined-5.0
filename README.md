# V5.02-PD2_Shift-Combined---3.0

# PD2_Shift-Combined — เอกสารทางการ (รายละเอียดฉบับสมบูรณ์)

เอกสารนี้เป็นคู่มือทางการสำหรับนักพัฒนา ผู้ดูแลระบบ และผู้ส่งมอบงานที่รับผิดชอบโครงการ PD2_Shift-Combined (เวอร์ชัน V5.02) โดยรวมครอบคลุมเชิงเทคนิค การติดตั้ง การพัฒนา การทดสอบ การดีพลอย การปฏิบัติงาน และแนวทางการบำรุงรักษา

## สรุปโดยย่อ
PD2_Shift-Combined เป็นเว็บแอปแบบ static ที่รันบนเบราว์เซอร์โดยไม่ต้องมี backend เฉพาะสำหรับการแสดงผลหลัก ระบบแบ่งงานเป็นโมดูล (Shift A, Shift B, ตัดม้วน, รายงาน) ซึ่งโหลดเป็นหน้า HTML ย่อยผ่าน `<iframe>` ภายใน `index.html` (shell) เพื่อรักษาโดเมนความรับผิดชอบแยกกัน และสื่อสารระหว่างกันด้วย `window.postMessage` ที่กำหนดไว้

## เป้าหมายของเอกสารนี้
- อธิบายโครงสร้างโค้ด
- ให้ขั้นตอนการติดตั้ง การรัน และการทดสอบที่ชัดเจนสำหรับนักพัฒนา
- ระบุช่องโหว่ที่ควรปรับปรุงและแนวทางการแก้ไข
- ให้แนวปฏิบัติสำหรับการปล่อยงานและการดูแลระบบ

---

## 1. ขอบเขตและกรอบงาน
- ฟังก์ชันหลัก: บันทึกข้อมูลกะงาน (Shift A และ B), คำนวณ/บันทึกการตัดม้วนผ้า, สร้างรายงานโดยผสานข้อมูลกับ Google Sheets
- ลักษณะการ deploy: ไฟล์ static (HTML/CSS/JS) ที่สามารถโฮสต์บน static host หรือ internal server
- ข้อจำกัด: ไม่รองรับการจัดเก็บข้อมูลที่ต้องการความปลอดภัยขั้นสูงโดยตรงบนไคลเอนต์ — หากต้องการ ให้เพิ่ม backend/proxy สำหรับจัดการข้อมูลลับและการอนุญาต

## 2. โครงสร้างโฟลเดอร์หลัก
- `index.html` — Shell หลักของแอป
- `pd2-notify.js` — ไลบรารีแจ้งเตือนกลาง (Toast และ Centered Success)
- `ปรับ script PD2_Shift-A_V4.0/` — โมดูล Shift A (หน้าจอฟอร์มและสคริปต์ขนาดใหญ่)
- `ปรับ script PD2_Shift-B_V4.0/` — โมดูล Shift B
- `ตัดม้วน PD2/` — โมดูลตัดม้วน
- `link google sheet/` — โมดูลรายงานและตัวเชื่อม Google Sheets
- `dev/watch-and-reload.js` — watcher สำหรับนักพัฒนา (WebSocket reload)
- `health.html` — หน้าแสดงข้อมูลสุขภาพพื้นฐานของระบบ
- `__tests__/` — ที่เก็บชุดทดสอบ (ปัจจุบันมีการทดสอบสำหรับ `pd2-notify`)
- `docs/` — เอกสารประกอบเชิงเทคนิค (ARCHITECTURE.md, RUNBOOK.md)

## 3. สถาปัตยกรรมเชิงเทคนิค (โดยย่อ)
- รูปแบบ: Shell + Module pattern โดยใช้ `<iframe>`
- การสื่อสาร: `window.postMessage` ด้วยชนิดข้อความที่กำหนด (เช่น `PD2_READY`, `PD2_REQUEST_SYNC`)
- ข้อมูลร่วม: ตัวแปร `SHARED` ใน shell เก็บรายการที่ใช้ร่วม (machines, fabricSizes, employees)
- การนำทาง: ฟังก์ชัน `navigateTo(target, opts)` ใน shell รับผิดชอบ cache-busting, timeout, retry, และ debounce
- การพัฒนาแบบ realtime: `dev/watch-and-reload.js` ส่งข้อความ reload ผ่าน WebSocket ไปยัง shell เพื่อรีโหลด iframe อัตโนมัติเมื่อไฟล์โมดูลเปลี่ยน

## 4. API / โปรโตคอลข้อความข้ามเฟรม (contract)
- `PD2_READY` — โมดูลแจ้งว่า UI พร้อม (module -> shell)
- `PD2_REQUEST_SYNC` — โมดูลขอรายการร่วมจาก shell (module -> shell)
- `PD2_ADD_CUSTOM` — โมดูลส่งคำขอเพิ่มรายการ custom (payload: { category, data }) (module -> shell)
- `PD2_SYNC_CUSTOM` — shell ส่งรายการร่วมให้โมดูล (shell -> module)
- `PD2_CENTERED_SUCCESS` — โมดูลแจ้งให้ shell แสดง overlay success (payload: { count })

การใช้งาน: shell จะตรวจสอบ `origin` และ source window ก่อนยอมรับการกระทำที่เปลี่ยนแปลง state

## 5. การติดตั้งและการรัน (Development)
ข้อกำหนด
- Node.js v16+ (แนะนำ)
- npm (มาพร้อม Node)

ขั้นตอน
```powershell
# ติดตั้งขึ้นตอนแรก
npm install
# เริ่มเซิร์ฟเวอร์พัฒนา (live-server)

```
- สังเกต URL ที่ live-server พิมพ์ในคอนโซล (จะระบุพอร์ตที่เซิร์ฟเวอร์กำลังฟัง)
- สำหรับการเข้าถึงจากอุปกรณ์มือถือในเครือข่ายเดียวกัน ให้ใช้ `http://<HOST_IP>:<PORT>` แทน `localhost` และตรวจสอบ firewall

## 6. การทดสอบ
- รัน unit tests:
```powershell
npm test
```
- ปัจจุบันมีชุดทดสอบสำหรับ `pd2-notify` (ตรวจสอบการสร้าง container, แสดง toast, และการ dedupe)

## 7. การพัฒนาอย่างปลอดภัย (แนะนำ)
- หลีกเลี่ยงการฝังคีย์/secret ในโค้ดฝั่งไคลเอนต์
- หากต้องการใช้ Google APIs ด้วยสิทธิ์ที่สูงขึ้น ให้สร้าง backend proxy เพื่อจัดการ OAuth และ token storage
- รัน `npm audit` เป็นระยะเพื่อเช็กช่องโหว่ของ dependency

## 8. การปล่อยงาน (Release)
- เพิ่ม `CACHE_VER` ที่ใช้งานใน `index.html` หรือตั้งกระบวนการ build เพื่อป้อนเวอร์ชัน
- แนะนำให้เผยแพร่ผ่าน host ที่รองรับ HTTPS (เช่น internal CDN, Netlify, GitHub Pages พร้อม CloudFront ฯลฯ)
- ตัวอย่างขั้นตอนพื้นฐาน:
```powershell
# เพิ่มหมายเลขเวอร์ชัน/Cache token
# รันเทสต์
npm test
# คัดลอกไฟล์ไปยังโฟลเดอร์สำหรับ deploy
# ส่งขึ้น host ที่เลือก (ขั้นตอนนี้ขึ้นกับ host)
```

## 9. การเฝ้าระวังและบำรุงรักษา
- เพิ่ม monitoring (เช่น Sentry) บน front-end เพื่อจับ runtime errors
- สำรองข้อมูล Google Sheets (หากเป็นแหล่งความจริงของข้อมูล)
- ตั้งกระบวนการอัปเดต dependency (Dependabot หรือ manual schedule)

## 10. ปรับปรุงที่แนะนำ (Roadmap สั้น ๆ)
- สร้าง backend proxy สำหรับ Google Sheets (เพื่อจัดการ secrets และ CORS)
- เพิ่ม CI (GitHub Actions) รัน lint + test บน PR
- ติดตั้ง ESLint/Prettier และ pre-commit hooks
- แยก/Refactor โมดูลขนาดใหญ่ (เช่น Shift-A) ให้เป็นไฟล์ JS ย่อยและ bundler (Vite)
- เพิ่ม E2E tests (Playwright / Cypress)

## 11. การนำทางโค้ดสำหรับผู้พัฒนา (Quick map)
- เริ่มที่ `index.html` เพื่อดูตรรกะการนำทางและ postMessage
- ดู `pd2-notify.js` สำหรับ API แจ้งเตือนที่โมดูลเรียกใช้
- เปิดโฟลเดอร์โมดูล (`ปรับ script PD2_Shift-A_V4.0/` เป็นต้น) เพื่อสำรวจฟอร์มและสคริปต์การบันทึกข้อมูล
- ตรวจสอบ `dev/watch-and-reload.js` หากต้องการปรับการทำงานของ live reload

## 12. ข้อควรปฏิบัติในการพัฒนาร่วม (Contribution)
- ก่อนสร้าง PR: รัน `npm test` และตรวจสอบว่าไม่มี error
- ระบุรายละเอียดใน PR: ปัญหาที่แก้, การเปลี่ยน API ถ้ามี, วิธีทดสอบด้วยตนเอง
- เพิ่ม/ปรับ tests เมื่อแก้ logic ที่สำคัญ

## 13. ลำดับเวอร์ชันสรุป
- V4.x → V5.02: ปรับปรุงการรองรับมือถือ, เพิ่มกลไก prefetch/cache, ปรับปรุงการแจ้งเตือน และเพิ่มเครื่องมือสำหรับนักพัฒนา

---

