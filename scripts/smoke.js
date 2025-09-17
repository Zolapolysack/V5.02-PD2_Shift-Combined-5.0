const http = require('http');
const { URL } = require('url');

const targets = [
  { name: 'static', url: 'http://127.0.0.1:8080/' },
  { name: 'backend-health', url: 'http://127.0.0.1:8787/api/health' }
];

function check(target) {
  return new Promise((resolve) => {
    const u = new URL(target.url);
    const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname + (u.search || ''), method: 'GET', timeout: 5000 }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        resolve({ name: target.name, status: res.statusCode, length: body.length, body: body.slice(0, 300) });
      });
    });
    req.on('error', (err) => resolve({ name: target.name, error: String(err) }));
    req.on('timeout', () => { req.abort(); resolve({ name: target.name, error: 'timeout' }); });
    req.end();
  });
}

(async () => {
  console.log('Running smoke checks...');
  for (const t of targets) {
    const r = await check(t);
    if (r.error) {
      console.log(`${t.name}: ERROR -> ${r.error}`);
    } else {
      console.log(`${t.name}: ${r.status} (${r.length} bytes)`);
      console.log(`  snippet: ${r.body.replace(/\n/g,' ')}\n`);
    }
  }
  console.log('Smoke checks complete.');
  process.exit(0);
})();
