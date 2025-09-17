# Security Overview (PD2 Shift Console)

> Scope: Internal organizational deployment (LAN / VPN). No public internet exposure is assumed. This document lists the current baseline, recent hardening changes, and the short roadmap.

## 1. Threat Model (Internal Use)
- Primary risks: Credential leakage, unintended data modification, lateral movement via XSS if a trusted workstation is compromised.
- Out of scope (current phase): Public hostile traffic, automated bot scanning, advanced persistent threats.

## 2. Current Baseline
| Area | Status |
|------|--------|
| Rate Limiting | Global 60 req/min (express-rate-limit) |
| CORS | Exact host+protocol allow list (env: `ALLOW_ORIGINS`) |
| Auth (Sheets API) | Bearer token (`API_TOKEN`) enforced for `/api/sheets/*` |
| Config gating | Sheets routes return 501 if credentials missing |
| Logging | Winston + daily rotate + masking for sensitive keywords |
| Security Headers | Helmet + CSP (report-only) + X-Powered-By disabled |
| SW / PWA | Static offline shell only (no dynamic cache poisoning) |
| Error Handling | Generic message for 5xx; internal details hidden in production |

## 3. Recent Hardening Changes
- Strict CORS origin comparison (removed `startsWith` risk)
- Added Content Security Policy (report-only) for future tightening
- Hardened error handler: hides internal errors (500) from clients
- Disabled `x-powered-by` exposure header

## 4. Environment Variables (.env)
```
PORT=8787
ALLOW_ORIGINS=http://127.0.0.1,http://localhost
API_TOKEN=<48+ char random>
# One of the following for Google Sheets (future phase)
GOOGLE_SERVICE_ACCOUNT_JSON={...}
GOOGLE_CREDENTIALS_JSON={...}
```
Guidelines:
- Use a unique API_TOKEN per environment (dev/stage/prod)
- Rotate tokens at least every 90 days (manual now; automation planned)

## 5. Logging & Privacy
- Masking keywords (baseline): password, token, secret
- To be extended (roadmap): apikey, auth, credential, bearer
- Log retention: 14 days (winston-daily-rotate-file)
- Recommendation: Forward logs to central SIEM if/when available.

## 6. Dependency Hygiene
- Run `npm audit --production` at release time
- Development-only packages (e.g. image tooling) isolated from runtime attack surface; evaluate upgrading jimp or moving build steps to CI.
- Plan: Add automated Dependabot / Renovate when repo integrated with central Git hosting.

## 7. Roadmap (Prioritized)
### Immediate (Completed / In Progress)
- [x] Strict CORS
- [x] Safe error handler
- [x] CSP (report-only)
- [ ] Extend sensitive log fields
- [ ] Example `.env` file committed (without secrets)

### Short Term (Next Sprint)
- Enforce CSP (remove unsafe inline scripts gradually)
- Add Referrer-Policy, Permissions-Policy, HSTS (when behind HTTPS)
- Implement schema validation (zod/joi) for Sheets endpoints
- Add script to generate secure API token

### Medium Term
- Token rotation workflow + audit trail for actions
- Add integration tests for headers & auth rejection paths
- Introduce vulnerability scanning in CI pipeline

### Long Term
- Full RBAC / per-user authentication layer (if multi-user)
- Encrypt sensitive at-rest data (if local persistence added)

## 8. Operational Recommendations
- Deploy behind an internal reverse proxy (nginx/traefik) that terminates HTTPS and enforces HSTS.
- Restrict network access with firewall rules (only trusted VLAN / VPN)
- Regularly review logs for anomalous access patterns (excess 401, bursts)

## 9. Incident Response (Internal Playbook)
1. Revoke / rotate `API_TOKEN` immediately if suspected exposure.
2. Invalidate service worker (bump version) if any static asset tampering suspected.
3. Archive logs (`logs/app-*.log`) for forensic retention.
4. Patch & redeploy with incremented version identifier.

## 10. Contact / Stewardship
- Internal owner: Production Dept. 2 IT liaison
- Security escalation path: Internal IT Security Team

---
Prepared automatically as part of initial hardening batch.
