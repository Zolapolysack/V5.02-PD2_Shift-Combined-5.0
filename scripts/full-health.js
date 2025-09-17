#!/usr/bin/env node
/**
 * Consolidated health check:
 * 1. Start backend (if not already on port 8787)
 * 2. Start static http-server (if not already on port 8080)
 * 3. Probe:
 *    - Static root + key Thai path pages
 *    - pd2-notify.js
 *    - Service worker and manifest
 *    - Backend /api/health
 * 4. Summarize JSON result & non-zero exit if any hard failures.
 */
const http = require('http');
const { spawn } = require('child_process');
const { URL } = require('url');

function onceReady(port, regex, timeoutMs = 7000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function poll() {
      const req = http.request({ hostname: '127.0.0.1', port, path: '/', method: 'HEAD', timeout: 1200 }, res => {
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) return reject(new Error('timeout waiting for port ' + port));
        setTimeout(poll, 250);
      });
      req.end();
    })();
  });
}

function startIfNeeded(cmd, args, port, name){
  return new Promise(async (resolve) => {
    // Quick probe
    const probe = http.request({ hostname: '127.0.0.1', port, path: '/', method: 'HEAD', timeout: 800 }, res => {
      console.log(`[health] ${name} already running on :${port}`);
      resolve({already:true, proc:null});
    });
    probe.on('error', () => {
      console.log(`[health] starting ${name}...`);
      const proc = spawn(cmd, args, { stdio: 'pipe', shell: process.platform === 'win32' });
      proc.stdout.on('data', d => process.stdout.write(`[${name}] ${d}`));
      proc.stderr.on('data', d => process.stderr.write(`[${name} ERR] ${d}`));
      onceReady(port).then(() => resolve({already:false, proc})).catch(err => resolve({error:err, proc}));
    });
    probe.end();
  });
}

function get(url){
  return new Promise(resolve => {
    const u = new URL(url);
    const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname + u.search, method: 'GET', timeout: 5000 }, res => {
      const chunks=[]; res.on('data', c=>chunks.push(c)); res.on('end', ()=>{
        resolve({ url, status: res.statusCode, length: Buffer.concat(chunks).length });
      });
    });
    req.on('error', e => resolve({ url, error: String(e) }));
    req.on('timeout', () => { req.abort(); resolve({ url, error: 'timeout' }); });
    req.end();
  });
}

(async () => {
  const results = { started: {}, checks: [] };
  const backend = await startIfNeeded('node', ['server/index.js'], 8787, 'backend');
  if (backend.error) { console.error('[health] backend failed to start', backend.error); }
  results.started.backend = backend.already ? 'existing' : (backend.error ? 'error' : 'started');

  const frontend = await startIfNeeded('npx', ['http-server', '.', '-p', '8080'], 8080, 'static');
  if (frontend.error) { console.error('[health] static failed to start', frontend.error); }
  results.started.static = frontend.already ? 'existing' : (frontend.error ? 'error' : 'started');

  const urls = [
    'http://127.0.0.1:8080/',
    'http://127.0.0.1:8080/ปรับ script PD2_Shift-A_V4.0/index.html',
    'http://127.0.0.1:8080/ปรับ script PD2_Shift-B_V4.0/index.html',
    'http://127.0.0.1:8080/ตัดม้วน PD2/index.html',
    'http://127.0.0.1:8080/link google sheet/index.html',
    'http://127.0.0.1:8080/pd2-notify.js',
    'http://127.0.0.1:8080/manifest.json',
    'http://127.0.0.1:8080/sw.js',
    'http://127.0.0.1:8787/api/health'
  ];

  for (const u of urls) {
    const r = await get(u);
    results.checks.push(r);
    if (r.error) console.error('[health] ERROR', r.url, r.error); else console.log('[health] OK', r.url, r.status);
  }

  // Determine overall pass
  const failures = results.checks.filter(c => c.error || !(c.status >= 200 && c.status < 400));
  results.summary = { ok: failures.length === 0, failures: failures.length };

  console.log('\nFULL_HEALTH_RESULT=' + JSON.stringify(results, null, 2));

  // Cleanup any processes we spawned (not existing ones)
  if (backend.proc) backend.proc.kill();
  if (frontend.proc) frontend.proc.kill();

  process.exit(results.summary.ok ? 0 : 4);
})();
