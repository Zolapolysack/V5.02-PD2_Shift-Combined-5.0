const http = require('http');
const urls = [
  { name: 'health', url: 'http://127.0.0.1:8787/api/health' },
  { name: 'root', url: 'http://127.0.0.1:8080/' }
];

function check(u){
  return new Promise((resolve) => {
    const req = http.get(u.url, { timeout: 5000 }, (res) => {
      res.resume();
      resolve({ name: u.name, status: res.statusCode });
    });
    req.on('error', (e) => resolve({ name: u.name, error: String(e) }));
    req.on('timeout', () => { req.abort(); resolve({ name: u.name, error: 'timeout' }) });
  });
}

async function poll(){
  const results = await Promise.all(urls.map(check));
  results.forEach(r => {
    if(r.error || (r.status && r.status >= 500)){
      console.error('[MONITOR] ALERT', r);
    } else {
      console.log('[MONITOR] OK', r);
    }
  });
}

setInterval(poll, 60 * 1000);
poll();
