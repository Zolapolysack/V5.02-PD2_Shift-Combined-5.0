import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import sheetsRouterFactory from './routes/sheets.js';
import logger from './logger.js';

const app = express();
const PORT = Number(process.env.PORT || 8787);

// CORS allowlist: default to localhost only (safe default)
const ALLOW_ORIGINS = (process.env.ALLOW_ORIGINS || 'http://127.0.0.1,http://localhost').split(',');
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser clients
    const ok = ALLOW_ORIGINS.some((o) => origin.startsWith(o.trim()));
    return ok ? callback(null, true) : callback(new Error('CORS not allowed'));
  },
  credentials: false
};

// Security & basics
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '200kb' }));

app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Global rate limit (safe default)
app.use(rateLimit({ windowMs: 60 * 1000, max: 60 }));

// Health endpoint

app.get('/api/health', (req, res) => {
  logger.info('Health check', { ip: req.ip });
  res.json({ ok: true, service: 'pd2-sheets-proxy', time: new Date().toISOString(), version: '0.1.0' });
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

// Sheets router: disabled until Google credentials configured (safe mode)
const sheetsRouter = sheetsRouterFactory({
  configured: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_CREDENTIALS_JSON),
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
  const status = err.status || 500;
  logger.error(`Error: ${err.message}`, { status, stack: err.stack, url: req.originalUrl, ip: req.ip });
  res.status(status).json({ ok: false, error: err.message || 'Internal Error' });
});

app.listen(PORT, () => {
  console.log(`[pd2-sheets-proxy] listening on http://127.0.0.1:${PORT}`);
});
