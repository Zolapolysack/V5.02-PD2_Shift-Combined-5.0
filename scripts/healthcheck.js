#!/usr/bin/env node
const http = require('http');
const { exec } = require('child_process');
const urls = [
  'http://127.0.0.1:8080/',
  'http://127.0.0.1:8080/прปรับ%20script%20PD2_Shift-A_V4.0/index.html'
];

// Simple healthcheck: try to GET a list of URLs and report status
function checkUrl(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve({ url, status: res.statusCode });
      res.resume();
    });
    req.on('error', (err) => resolve({ url, error: String(err) }));
    req.setTimeout(5000, () => { req.abort(); resolve({ url, error: 'timeout' }); });
  });
}

async function run() {
  console.log('Healthcheck: starting http-server in background...');
  const server = exec('npx http-server . -p 8080', { cwd: process.cwd(), windowsHide: true });
  let started = false;
  server.stdout && server.stdout.on('data', (d) => {
    const s = String(d || '');
    if (s.includes('Available on')) {
      started = true;
    }
    process.stdout.write(s);
  });
  server.stderr && server.stderr.on('data', (d) => process.stderr.write(String(d)));

  // wait up to 5s for server to start
  const startTimeout = Date.now() + 5000;
  while (!started && Date.now() < startTimeout) {
    await new Promise((r) => setTimeout(r, 200));
  }
  if (!started) {
    console.error('Failed to start http-server for healthcheck');
    server.kill();
    process.exit(2);
  }

  const toCheck = [
    'http://127.0.0.1:8080/',
    'http://127.0.0.1:8080/ปรับ script PD2_Shift-A_V4.0/index.html',
    'http://127.0.0.1:8080/ปรับ script PD2_Shift-B_V4.0/index.html',
    'http://127.0.0.1:8080/ตัดม้วน PD2/index.html',
    'http://127.0.0.1:8080/link google sheet/index.html',
    'http://127.0.0.1:8080/pd2-notify.js'
  ];

  const results = await Promise.all(toCheck.map(checkUrl));
  let ok = true;
  results.forEach(r => {
    if (r.error) { console.error(`${r.url} -> ERROR: ${r.error}`); ok = false; }
    else if (r.status && r.status >= 200 && r.status < 400) console.log(`${r.url} -> ${r.status}`);
    else { console.error(`${r.url} -> ${r.status || 'no-status'}`); ok = false; }
  });

  // shutdown server
  server.kill();
  process.exit(ok ? 0 : 3);
}

run().catch(err => { console.error(err); process.exit(3); });
