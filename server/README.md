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
- Copy `.env.example` to `.env` and adjust values.
- Provide Google credentials (to be wired): `GOOGLE_SERVICE_ACCOUNT_JSON` or `GOOGLE_CREDENTIALS_JSON`.
- Replace `API_TOKEN` with a secure, short-lived token in production.

## Notes
- This proxy is scaffolded to avoid breaking the existing frontend; no frontend files were changed.
- Implement the actual Google Sheets calls in `routes/sheets.js` once credentials are ready.
