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
  ws.on('error', (err) => console.error('[dev-watcher] WebSocket error:', err));
});

wss.on('error', (err) => {
  console.error('[dev-watcher] WebSocket server error:', err);
});

function broadcast(obj) {
  const str = JSON.stringify(obj);
  wss.clients.forEach(c => { 
    if (c.readyState === WebSocket.OPEN) {
      try {
        c.send(str);
      } catch (err) {
        console.error('[dev-watcher] Error broadcasting to client:', err);
      }
    }
  });
}

const watcher = chokidar.watch(WATCH_GLOBS, { ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 120, pollInterval: 10 } });
watcher.on('all', (event, changedPath) => {
  try {
    const rel = path.relative(process.cwd(), changedPath);
    console.log(`[dev-watcher] ${event}: ${rel}`);
    broadcast({ type: 'reload', path: rel, event });
  } catch (err) {
    console.error('[dev-watcher] Error handling file change:', err);
  }
});

watcher.on('error', (err) => {
  console.error('[dev-watcher] File watcher error:', err);
});

process.on('SIGINT', () => { 
  console.log('[dev-watcher] stopping'); 
  try {
    watcher.close(); 
    wss.close(); 
  } catch (err) {
    console.error('[dev-watcher] Error during shutdown:', err);
  }
  process.exit(0); 
});
