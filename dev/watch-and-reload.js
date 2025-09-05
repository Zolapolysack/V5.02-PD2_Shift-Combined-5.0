#!/usr/bin/env node
// Simple file watcher + WebSocket broadcaster for dev reloads
const chokidar = require('chokidar');
const WebSocket = require('ws');
const path = require('path');

const WATCH_GLOBS = [
  path.join(__dirname, '..', 'ปรับ script PD2_Shift-A_V4.0', '**', '*'),
  path.join(__dirname, '..', 'ปรับ script PD2_Shift-B_V4.0', '**', '*'),
  path.join(__dirname, '..', 'ตัดม้วน PD2', '**', '*')
];

const PORT = process.env.DEV_WATCH_PORT ? Number(process.env.DEV_WATCH_PORT) : 35729;

const wss = new WebSocket.Server({ port: PORT });
console.log(`[dev-watcher] websocket server listening on ws://127.0.0.1:${PORT}`);

wss.on('connection', ws => {
  console.log('[dev-watcher] client connected');
  ws.send(JSON.stringify({ type: 'hello', msg: 'dev-watcher' }));
  ws.on('close', () => console.log('[dev-watcher] client disconnected'));
});

function broadcast(obj) {
  const str = JSON.stringify(obj);
  wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(str); });
}

const watcher = chokidar.watch(WATCH_GLOBS, { ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 120, pollInterval: 10 } });
watcher.on('all', (event, changedPath) => {
  const rel = path.relative(process.cwd(), changedPath);
  console.log(`[dev-watcher] ${event}: ${rel}`);
  broadcast({ type: 'reload', path: rel, event });
});

process.on('SIGINT', () => { console.log('[dev-watcher] stopping'); watcher.close(); wss.close(); process.exit(0); });
