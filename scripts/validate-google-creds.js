#!/usr/bin/env node
/**
 * Lightweight validator to confirm Google service account env is parseable
 * and contains required fields BEFORE hitting live Sheets API.
 * Exits 0 if looks valid; non-zero otherwise.
 */
import fs from 'fs';

function load() {
  const file = process.env.GOOGLE_SERVICE_ACCOUNT_FILE;
  if (file && fs.existsSync(file)) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { throw new Error('Invalid JSON in file: ' + file); }
  }
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_CREDENTIALS_JSON;
  if (inline) {
    try { return JSON.parse(inline); } catch (e) { throw new Error('Invalid JSON in inline GOOGLE_* variable'); }
  }
  throw new Error('No credentials env found');
}

(function main(){
  try {
    const c = load();
    const required = ['type','private_key','client_email'];
    const missing = required.filter(k => !c[k]);
    if (missing.length) throw new Error('Missing fields: ' + missing.join(','));
    if (c.type !== 'service_account') console.warn('[warn] credentials type not service_account');
    if (!process.env.API_TOKEN) console.warn('[warn] API_TOKEN not set (sheets endpoints will 503)');
    console.log(JSON.stringify({ ok: true, client_email: c.client_email, has_key: !!c.private_key, warn: !process.env.API_TOKEN }, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(JSON.stringify({ ok: false, error: err.message }, null, 2));
    process.exit(2);
  }
})();
