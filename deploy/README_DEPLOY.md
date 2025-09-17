Deployment checklist (quick)

1) Prepare server and DNS
   - Point your domain (example.com) to the server IP.
   - Open firewall ports 80 and 443.

2) Install Node & pm2
   - Ensure Node.js (v18+) is installed.
   - Install pm2 (global) or use `npx pm2`.

3) Start services with pm2
   - npx pm2 start ecosystem.config.js --update-env
   - npx pm2 save
   - npx pm2 startup    # follow printed instructions for your OS

4) Setup TLS + Reverse proxy
   - Option A (recommended): Use Caddy (auto TLS). Place `deploy/Caddyfile` on server and run `caddy run`.
   - Option B: Use Nginx with `deploy/nginx.conf.example` and issue certs via Certbot.

5) Add secrets securely
   - Place Google service account JSON into a secure path (e.g., `/etc/pd2/google-service-account.json`) and set `GOOGLE_SERVICE_ACCOUNT_FILE` or `GOOGLE_SERVICE_ACCOUNT_JSON` in pm2 env.
   - Set `API_TOKEN` in pm2 env or via your secret manager.

6) Monitoring & logging
   - Forward pm2 logs to a log aggregator (Loki/ELK/Datadog) or use `pm2 logs` for debugging.
   - Configure health checks and alerts to call `/api/health`.

7) Final tests
   - curl -I https://example.com/
   - curl -H 'Authorization: Bearer <API_TOKEN>' https://example.com/api/health

8) Google Sheets integration (how to enable)

   - Create a Google Service Account in Google Cloud Console and grant it access to the target spreadsheet (Share the sheet with the service account email).
   - Download the JSON key and place it on the server, e.g. `/etc/pd2/google-service-account.json`.
   - Configure pm2 to provide the file path as an env var, or export the JSON into `GOOGLE_SERVICE_ACCOUNT_JSON` (less recommended):

      # Example (Linux)
      export GOOGLE_SERVICE_ACCOUNT_FILE=/etc/pd2/google-service-account.json
      export API_TOKEN=changeme
      npx pm2 restart pd2-api --update-env

   - Test read (replace <SHEET_ID> and <RANGE>):

      curl -X POST -H "Authorization: Bearer changeme" -H "Content-Type: application/json" \
         -d '{"sheetId":"<SHEET_ID>","range":"Sheet1!A1:C10"}' \
         https://example.com/api/sheets/read

   - Test append (append a single row):

      curl -X POST -H "Authorization: Bearer changeme" -H "Content-Type: application/json" \
         -d '{"sheetId":"<SHEET_ID>","range":"Sheet1!A1:C1","values":[["a","b","c"]]}' \
         https://example.com/api/sheets/append

   - Notes: The router will throw 501 if credentials are not present; when properly configured it will proxy read/append calls to Google Sheets API.


If you want, I can add scripts to automate `pm2 startup` steps for specific OS (Windows/Linux) and wire in a simple log forwarder example.
