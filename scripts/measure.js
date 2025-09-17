#!/usr/bin/env node
const http = require('http');
const https = require('https');
const { URL } = require('url');
const urls = [
  'http://127.0.0.1:8080/',
  'http://127.0.0.1:8080/ปรับ script PD2_Shift-A_V4.0/index.html',
  'http://127.0.0.1:8080/ปรับ script PD2_Shift-B_V4.0/index.html',
  'http://127.0.0.1:8080/ตัดม้วน PD2/index.html',
  'http://127.0.0.1:8080/link google sheet/index.html',
  'http://127.0.0.1:8080/pd2-notify.js'
];

function measure(url) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const start = Date.now();
    const req = lib.request(u, (res) => {
      const ttfb = Date.now() - start;
      let bytes = 0;
      res.on('data', (chunk) => bytes += chunk.length);
      res.on('end', () => {
        const total = Date.now() - start;
        resolve({ url, status: res.statusCode, ttfb, total, bytes });
      });
    });
    req.on('error', (err) => resolve({ url, error: String(err) }));
    req.end();
  });
}

(async function(){
  console.log('Measuring URLs...');
  for (const u of urls) {
    const r = await measure(u);
    if (r.error) console.log(`${r.url} -> ERROR: ${r.error}`);
    else console.log(`${r.url} -> status=${r.status} ttfb=${r.ttfb}ms total=${r.total}ms bytes=${r.bytes}`);
  }
})();
