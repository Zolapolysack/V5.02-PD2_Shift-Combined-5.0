import express from 'express';
import { google } from 'googleapis';
import fs from 'fs';

function loadCredentials() {
  // Priority: GOOGLE_SERVICE_ACCOUNT_FILE -> GOOGLE_SERVICE_ACCOUNT_JSON
  const filePath = process.env.GOOGLE_SERVICE_ACCOUNT_FILE;
  if (filePath && fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      throw new Error('Invalid JSON in GOOGLE_SERVICE_ACCOUNT_FILE');
    }
  }
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      return JSON.parse(json);
    } catch (e) {
      throw new Error('Invalid JSON in GOOGLE_SERVICE_ACCOUNT_JSON');
    }
  }
  return null;
}

export default function sheetsRouterFactory({ configured }) {
  const router = express.Router();

  if (!configured) {
    router.get('/ping', (req, res) => {
      res.status(503).json({ ok: false, configured: false, error: 'Sheets proxy not configured' });
    });
    router.post('/read', (req, res) => {
      res.status(501).json({ ok: false, error: 'Sheets proxy not configured' });
    });
    router.post('/append', (req, res) => {
      res.status(501).json({ ok: false, error: 'Sheets proxy not configured' });
    });
    return router;
  }

  // Initialize Google auth lazily
  let authClient = null;
  async function getAuth() {
    if (authClient) return authClient;
    const creds = loadCredentials();
    if (!creds) throw new Error('Google service account credentials not found');
    const client = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    authClient = await client.getClient();
    return authClient;
  }

  router.post('/read', async (req, res, next) => {
    const { sheetId, range } = req.body || {};
    if (!sheetId || !range) return res.status(400).json({ ok: false, error: 'sheetId and range are required' });
    try {
      const auth = await getAuth();
      const sheets = google.sheets({ version: 'v4', auth });
      const resp = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range });
      return res.json({ ok: true, values: resp.data.values || [] });
    } catch (err) {
      return next(err);
    }
  });

  router.post('/append', async (req, res, next) => {
    const { sheetId, range, values } = req.body || {};
    if (!sheetId || !range || !Array.isArray(values)) {
      return res.status(400).json({ ok: false, error: 'sheetId, range and values[] are required' });
    }
    try {
      const auth = await getAuth();
      const sheets = google.sheets({ version: 'v4', auth });
      const resp = await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range,
        valueInputOption: 'RAW',
        requestBody: { values }
      });
      return res.json({ ok: true, result: resp.data });
    } catch (err) {
      return next(err);
    }
  });

  router.get('/ping', (req, res) => {
    res.json({ ok: true, configured: true });
  });

  return router;
}
