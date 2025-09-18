# PD2 Sheets Proxy (Prototype)

Non-invasive, safe-by-default proxy for Google Sheets.

- Default: Disabled (endpoints return 501) until credentials + API_TOKEN are configured.
- CORS: Only localhost origins allowed by default.
- Security: Requires Bearer token (API_TOKEN) for all `/api/sheets/*` endpoints.
- Rate limit: 60 req/min per IP.

## Run (local)
```powershell
cd server
npm install
npm run dev
```

Then test:
```powershell
# Health
curl http://127.0.0.1:8787/api/health

# Sheets (expects API_TOKEN set)
$env:API_TOKEN="change-me-dev-token" # or set in .env
curl -X POST http://127.0.0.1:8787/api/sheets/read -H "Authorization: Bearer $env:API_TOKEN" -H "Content-Type: application/json" -d '{"sheetId":"abc","range":"A1:B2"}'
```

## Configure
- Copy `.env.example` to `.env` and adjust values. Required keys:

```
PORT=8787
# Comma-separated list of allowed origins (protocol+host[:port])
ALLOW_ORIGINS=https://<your-pages-domain>,http://localhost,http://127.0.0.1
# Bearer token required by all /api/sheets/* endpoints
API_TOKEN=<set-a-strong-random-token>

# Provide Google service account credentials (one of these approaches):
# 1) Inline JSON (preferred in hosted env vars)
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@...gserviceaccount.com","client_id":"...","universe_domain":"googleapis.com"}'
# 2) Or point to a JSON file on disk
# GOOGLE_SERVICE_ACCOUNT_FILE=C:\\secure\\service-account.json
```

Notes:
- Keep real secrets out of source control. Set them via hosting dashboard env vars.
- Ensure the service account email has access to the target Google Sheet.

## Deploy

### Render.com (recommended)
1. Create a new Web Service from the `server/` folder.
2. Build command: `npm install`
3. Start command: `node index.js`
4. Set Env Vars in the Render dashboard:
	- `PORT` (Render injects its own; you can omit or set as needed)
	- `ALLOW_ORIGINS` = `https://<your-pages-domain>,http://localhost,http://127.0.0.1`
	- `API_TOKEN` = your strong token
	- `GOOGLE_SERVICE_ACCOUNT_JSON` = paste JSON
5. Deploy. You’ll get an URL like `https://pd2-api-xxxx.onrender.com`.

### Heroku
1. Create app, add Node.js buildpack.
2. `Procfile`: `web: node index.js` (create at `server/Procfile`).
3. Set Config Vars: `ALLOW_ORIGINS`, `API_TOKEN`, `GOOGLE_SERVICE_ACCOUNT_JSON`.
4. Deploy the `server/` directory.

## Frontend wiring
In `assets/js/config.js`, set the production API URL, or override at runtime:
- Preferred: set `<meta name="pd2-api" content="https://your-api.example.com">` in `index.html`.
- Or run in browser console: `localStorage.setItem('PD2_API_URL','https://your-api.example.com')`.

When configured, `/api/health` will show:
```
{"configured":{"sheets":true,"authToken":true}, ...}
```

## Notes
- This proxy is scaffolded to avoid breaking the existing frontend; no frontend files were changed.
- Implement the actual Google Sheets calls in `routes/sheets.js` once credentials are ready.

## Deploy (recommended: Render.com)

1) Push only the `server/` folder to a separate repo, or set Render root directory to `server/`.

2) Create a new Web Service:
	- Environment: Node
	- Build Command: `npm install`
	- Start Command: `node index.js`
	- Instance Type: Free (or suitable)

3) Environment Variables (Render Dashboard):
	- `PORT` (Render provides automatically; our app reads it)
	- `ALLOW_ORIGINS` = `https://<your-pages-domain>,http://localhost,http://127.0.0.1`
	- `API_TOKEN` = `<secure-token>`
	- `GOOGLE_SERVICE_ACCOUNT_JSON` = `<paste service account JSON>`

4) After deploy, copy the public URL (e.g., `https://pd2-api-xxxx.onrender.com`).

5) In the frontend repo, set `assets/js/config.js` `PRODUCTION_API_URL` to that URL.

## Deploy (Heroku alternative)

1) In `server/`: create `Procfile` with: `web: node index.js`.

2) `heroku create` then `heroku config:set` the env vars listed above.

3) `git push heroku main` (or the branch you use).

---

## (ภาษาไทย) เช็คลิสต์ตั้งค่าก่อนใช้งานจริงแบบครบวงจร

เพื่อให้ระบบทำงานได้ครบ (อ่าน/เขียน Google Sheets จากหน้าเว็บที่โฮสต์บน GitHub Pages) ให้ทำตามลำดับต่อไปนี้:

1) ดีพลอย API (โฟลเดอร์ `server/`) ไปยังผู้ให้บริการ Node.js เช่น Render หรือ Heroku
- Render: ใช้ไฟล์ `server/render.yaml` เป็นตัวอย่าง ตั้งค่า Build = `npm install`, Start = `node index.js`.
- Heroku: มี `server/Procfile` ให้แล้ว (เนื้อหา: `web: node index.js`).

2) ตั้งค่า Environment Variables ในแดชบอร์ดของผู้ให้บริการ API
- `ALLOW_ORIGINS` = `https://<โดเมน-GitHub-Pages-ของคุณ>,http://localhost,http://127.0.0.1`
- `API_TOKEN` = โทเค็นลับที่สุ่มให้ยาวและคาดเดายาก
- `GOOGLE_SERVICE_ACCOUNT_JSON` = วาง JSON ของ Service Account (ต้องแชร์สิทธิ์ให้ชีตเป้าหมาย)

3) จด URL ของ API ที่ดีพลอยเสร็จ เช่น `https://pd2-api-xxxx.onrender.com`

4) ผูก Frontend ให้ชี้ไปยัง API ดังกล่าว โดยแก้ไฟล์ `index.html` ที่ root:
- ใส่แท็ก: `<meta name="pd2-api" content="https://pd2-api-xxxx.onrender.com">`
	(เราได้ใส่ placeholder ไว้ให้แล้ว เปลี่ยนเฉพาะค่า content)

5) เปิดใช้งาน GitHub Pages สำหรับสาขา main (เรามีเวิร์กโฟลว์ `.github/workflows/deploy-pages.yml` สร้างให้อัตโนมัติ)
- เมื่อ push โค้ดขึ้น main ไฟล์ static จะถูกดีพลอยไปยัง Pages โดยอัตโนมัติ

6) ทดสอบ Health
- เรียก `https://pd2-api-xxxx.onrender.com/api/health` และตรวจดูคีย์ `configured`: ควรเป็น `{ sheets: true, authToken: true }`

7) ผูกการเรียกใช้งานในหน้าเว็บ (ฝั่งไคลเอนต์)
- ฝั่ง JS จะอ่านค่า API จาก `<meta name="pd2-api">` โดยอัตโนมัติผ่านไฟล์ `assets/js/config.js`
- ในเครื่องทดสอบ สามารถ override ชั่วคราวผ่าน `localStorage.setItem('PD2_API_URL','https://...')`

เสร็จแล้ว หน้าเว็บบน GitHub Pages จะส่งคำขอไปยัง API Proxy ที่คุณดีพลอยไว้ และ API จะเชื่อมกับ Google Sheets อย่างปลอดภัยโดยไม่ต้องเปิดเผยค่าลับในไคลเอนต์

