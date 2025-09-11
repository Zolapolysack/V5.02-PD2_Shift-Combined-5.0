import express from 'express';

export default function sheetsRouterFactory({ configured }) {
  const router = express.Router();

  // Helper: until configured, respond 501 safely
  if (!configured) {
    router.post('/read', (req, res) => {
      res.status(501).json({ ok: false, error: 'Sheets proxy not configured' });
    });
    router.post('/append', (req, res) => {
      res.status(501).json({ ok: false, error: 'Sheets proxy not configured' });
    });
    return router;
  }

  // NOTE: Placeholders — implement Google Sheets API calls here after wiring credentials
  router.post('/read', async (req, res) => {
    // Expected body: { sheetId, range }
    const { sheetId, range } = req.body || {};
    if (!sheetId || !range) return res.status(400).json({ ok: false, error: 'sheetId and range are required' });
    // TODO: call Google Sheets API and return values
    return res.status(501).json({ ok: false, error: 'Not implemented yet' });
  });

  router.post('/append', async (req, res) => {
    // Expected body: { sheetId, range, values: [][] }
    const { sheetId, range, values } = req.body || {};
    if (!sheetId || !range || !Array.isArray(values)) {
      return res.status(400).json({ ok: false, error: 'sheetId, range and values[] are required' });
    }
    // TODO: call Google Sheets API to append values
    return res.status(501).json({ ok: false, error: 'Not implemented yet' });
  });

  return router;
}
