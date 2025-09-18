import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import sheetsRouterFactory from './routes/sheets.js';
import logger from './logger.js';
import fs from 'fs';

const app = express();
const PORT = Number(process.env.PORT || 8787);

// CORS allowlist: default to localhost only (strict exact match by origin host+protocol)
const ALLOW_ORIGINS = (process.env.ALLOW_ORIGINS || 'http://127.0.0.1,http://localhost')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser clients (CLI / curl)
    try {
      const oUrl = new URL(origin);
      const allowed = ALLOW_ORIGINS.some(allowStr => {
        try {
          const aUrl = new URL(allowStr);
          return aUrl.protocol === oUrl.protocol && aUrl.host === oUrl.host; // exact match (protocol+host[:port])
        } catch {
          return allowStr === origin; // fallback exact string compare
        }
      });
      return allowed ? callback(null, true) : callback(new Error('CORS not allowed'));
    } catch {
      return callback(new Error('CORS parse error'));
    }
  },
  credentials: false
};

// Security & basics
// Helmet baseline + CSP (report-only first so we can observe violations safely)
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  useDefaults: true,
  directives: {
    // Allow self scripts + tailwind CDN (adjust if later self-hosted)
    'script-src': ["'self'", 'https://cdn.tailwindcss.com'],
    'style-src': ["'self'", 'https://fonts.googleapis.com', "'unsafe-inline'"],
    'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
    'img-src': ["'self'", 'data:'],
    'connect-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'frame-ancestors': ["'self'"],
    // You can add report-uri / report-to for real reporting endpoints later
  },
  reportOnly: true
}));
// Additional privacy / security headers
app.disable('x-powered-by');
app.use(cors(corsOptions));
app.use(express.json({ limit: '200kb' }));

app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Global rate limit (safe default)
app.use(rateLimit({ windowMs: 60 * 1000, max: 60 }));

// Health endpoint

app.get('/api/health', (req, res) => {
  const started = Date.now();
  logger.info('Health check', { ip: req.ip });
  // Lightweight diagnostics – do NOT leak secrets
  let sheetsConfigured = false;
  try { sheetsConfigured = isSheetsConfigured(); } catch(_) {}
  const hasToken = Boolean(process.env.API_TOKEN && process.env.API_TOKEN !== 'REPLACE_WITH_SECURE_RANDOM');
  res.json({
    ok: true,
    service: 'pd2-sheets-proxy',
    time: new Date().toISOString(),
    version: '0.1.0',
    configured: { sheets: sheetsConfigured, authToken: hasToken },
    perf: { ms: Date.now() - started }
  });
});

// Auth helper: optional API token for sensitive routes
function requireBearer(req, res, next) {
  const token = process.env.API_TOKEN;
  if (!token) return res.status(503).json({ ok: false, error: 'Proxy not fully configured (API_TOKEN missing)' });
  const auth = req.headers.authorization || '';
  const given = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (given && given === token) return next();
  return res.status(401).json({ ok: false, error: 'Unauthorized' });
}

// Sheets router: detect if Google credentials appear usable
function isSheetsConfigured() {
  try {
    // 1) Explicit file path
    const filePath = process.env.GOOGLE_SERVICE_ACCOUNT_FILE;
    if (filePath && fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const json = JSON.parse(raw);
        if (json && json.client_email && json.private_key) return true;
      } catch (_) { /* ignore */ }
    }
    // 2) Inline JSON env
    const jsonEnv = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_CREDENTIALS_JSON; // accept legacy name
    if (jsonEnv) {
      try {
        const j = JSON.parse(jsonEnv);
        if (j && j.client_email && j.private_key) return true;
      } catch (_) { /* ignore */ }
    }
    return false;
  } catch (_) { return false; }
}

const sheetsRouter = sheetsRouterFactory({
  configured: isSheetsConfigured(),
});

// Read is harmless but we still gate behind configuration to avoid surprises

app.use('/api/sheets', (req, res, next) => {
  logger.info(`Sheets API call: ${req.method} ${req.originalUrl}`, { ip: req.ip, body: req.body });
  next();
}, requireBearer, sheetsRouter);

// 404 fallback

app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`, { ip: req.ip });
  res.status(404).json({ ok: false, error: 'Not Found' });
});

// Error handler (no stack in production)
// eslint-disable-next-line no-unused-vars

app.use((err, req, res, next) => {
  const status = Number.isInteger(err.status) ? err.status : 500;
  const logMeta = { status, url: req.originalUrl, ip: req.ip };
  if (status >= 500) {
    // Hide stack in production logs optionally; keep for debug if NODE_ENV !== production
    logger.error(`ServerError: ${err.message}`, { ...logMeta, stack: process.env.NODE_ENV === 'production' ? undefined : err.stack });
  } else {
    logger.warn(`ClientError: ${err.message}`, logMeta);
  }
  const safeMessage = status >= 500 ? 'Internal server error' : (err.publicMessage || err.message || 'Request error');
  res.status(status).json({ ok: false, error: safeMessage });
});

app.listen(PORT, () => {
  console.log(`[pd2-sheets-proxy] listening on http://127.0.0.1:${PORT}`);
});
