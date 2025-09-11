# PD2_Shift-Combined – Operations Runbook

This runbook provides step-by-step procedures for running the application locally, enabling LAN/mobile access, conducting basic health checks, handling common issues, and releasing updates.

## 1. Prerequisites

- Node.js 16 or later installed.
- A modern web browser (Chrome, Edge, Firefox, or Safari).
- Optional: Access to the Google account and Sheets used by the modules.

## 2. Start the Application Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm start
   ```
3. The server binds to the first available port (default 8080). The console prints the active URL (e.g., `http://127.0.0.1:62647`).
4. Open the printed URL in a browser.

## 3. Access from Mobile on the Same Network

1. Determine the host IP address:
   - On Windows PowerShell:
     ```powershell
     ipconfig | findstr IPv4
     ```
   - Example result: `IPv4 Address . . . . . . . . . . : 192.168.2.242`
2. Use the printed port from the server, combine as:
   - `http://<HOST_IP>:<PORT>` (e.g., `http://192.168.2.242:62647`)
3. Ensure the firewall allows inbound traffic for the chosen port. If blocked, create an inbound rule for the `live-server` node process or the specific port.

## 4. Health Check

- Open `health.html` in the browser to review a static capability summary (online status, CPU logical cores, device memory, and storage estimates).
- In the main app, switch between the four modules; a loading overlay should appear and dismiss; toasts may appear on success.

## 5. Development Live Reload

- Start the file watcher (optional):
  ```bash
  npm run watch-reload
  ```
- The watcher exposes a WebSocket server on `ws://127.0.0.1:35729` and broadcasts reload messages when files under module folders change.
- The shell page listens for `reload` messages and reloads the iframe.

## 6. Testing

- Run unit tests:
  ```bash
  npm test
  ```
- Current coverage focuses on the notification module.

## 7. Common Issues and Resolutions

### 7.1 Port 8080 is in use
- The dev server automatically selects an alternative port. Use the URL printed in the console.

### 7.2 Mobile device cannot access the site
- Confirm both devices are on the same Wi‑Fi network.
- Use the host IP (not `localhost`).
- Check Windows Defender Firewall inbound rules for the selected port.
- Temporarily disable the firewall for testing if permissible by policy (re-enable after testing).

### 7.3 Google Sheets is not updating
- Verify credentials and sharing permissions on the target sheet.
- Inspect the browser console for CORS errors or quota/permission errors.
- If sensitive keys are required, do not embed them client-side. Consider adding a minimal backend proxy.

### 7.4 Iframe shows blank or stuck on loading
- Wait up to 10 seconds; the navigator retries once automatically.
- Check the browser console for 404 errors loading module pages.
- Confirm folder names in `pathFor()` match the repository.

## 8. Release Procedure

1. Bump the `CACHE_VER` constant in `index.html` to force clients to fetch updated module pages.
2. Optionally, update a version banner in the footer of `index.html` for traceability.
3. Re-run tests:
   ```bash
   npm test
   ```
4. Deploy the static files to the hosting target (internal server, GitHub Pages, or equivalent). Ensure HTTPS is enabled for production.

## 9. Operational Notes

- The system is a static site; backups concern Google Sheets data rather than server state.
- For multi-site deployments, consider parameterizing module URLs and feature flags via query parameters or a small JSON config file.

## (ภาษาไทย) คู่มือปฏิบัติการ (Runbook) - สรุปการใช้งาน

เอกสารย่อด้านล่างนี้ให้ขั้นตอนสำคัญสำหรับการรันแอปพลิเคชันในเครื่อง การเข้าถึงจากมือถือภายในเครือข่ายเดียวกัน การตรวจสอบสถานะทั่วไป และการแก้ปัญหาพื้นฐาน

1. ข้อกำหนดเบื้องต้น
- ติดตั้ง Node.js 16 หรือใหม่กว่า
- เบราว์เซอร์สมัยใหม่ (Chrome, Edge, Firefox, Safari)
- (ถ้ามี) สิทธิ์เข้าถึง Google Sheets ที่โมดูลใช้งาน

2. เริ่มใช้งานบนเครื่อง
- ติดตั้งแพ็กเกจ: `npm install`
- เริ่มเซิร์ฟเวอร์พัฒนา: `npm start`
- เซิร์ฟเวอร์จะเลือกพอร์ตว่าง (ค่าเริ่มต้น 8080 หากว่าง) และพิมพ์ URL ที่ใช้งานได้ เช่น `http://127.0.0.1:62647`
- เปิด URL ที่พิมพ์ในคอนโซลด้วยเบราว์เซอร์

3. การเข้าถึงจากมือถือบนเครือข่ายเดียวกัน
- หา IP ของเครื่องโฮสต์ (บน PowerShell): `ipconfig | findstr IPv4`
- รวมพอร์ตที่เซิร์ฟเวอร์พิมพ์เป็น `http://<HOST_IP>:<PORT>` เช่น `http://192.168.2.242:62647`
- ตรวจสอบ Firewall ว่ามีการอนุญาตพอร์ตที่ใช้หรือให้สร้าง inbound rule ชั่วคราวสำหรับการทดสอบ

4. การตรวจสุขภาพ (Health Check)
- เปิด `health.html` เพื่อตรวจดูสถานะพื้นฐาน
- สลับโมดูลในแอปและสังเกต overlay โหลดและ toast

5. Live Reload สำหรับนักพัฒนา
- เรียก `npm run watch-reload` เพื่อเริ่ม watcher ที่จะส่งข้อความ reload ผ่าน WebSocket ไปยัง shell
- watcher ฟังที่ `ws://127.0.0.1:35729`

6. การทดสอบ
- รัน unit tests: `npm test`

7. ปัญหาทั่วไป
- พอร์ต 8080 ถูกใช้งาน: เซิร์ฟเวอร์จะเลือกพอร์ตอื่นโดยอัตโนมัติ — ใช้ URL ที่คอนโซลพิมพ์
- เครื่องมือถือเข้าถึงไม่ได้: ตรวจสอบว่าอุปกรณ์เชื่อมต่อ Wi‑Fi เดียวกัน ใช้ IP ของโฮสต์แทน `localhost` และตรวจสอบ firewall
- Google Sheets ไม่อัพเดต: ตรวจสอบสิทธิ์ของชีตและคอนโซลบันทึกข้อผิดพลาด (console) สำหรับ CORS/permission

8. กระบวนการปล่อยงาน (Release)
- เพิ่ม `CACHE_VER` ใน `index.html` เพื่อบังคับให้ไคลเอนต์โหลดไฟล์ใหม่
- รัน `npm test` ก่อนปล่อย
- โฮสต์ไฟล์ (internal server, GitHub Pages ฯลฯ) โดยเปิด HTTPS ใน production

---

หมายเหตุ: หากต้องการให้แปลแบบละเอียดหรือปรับเป็นคู่มือการใช้งานภาษาไทยสำหรับผู้ใช้งาน (non-developer) ผมสามารถขยายเอกสารนี้ให้ครอบคลุมขั้นตอนทีละหน้าจอและรูปภาพประกอบได้

End of document.
