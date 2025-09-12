// Minimal service worker to make the site installable and provide basic offline shell
const CACHE_NAME = 'pd2-shell-v1';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './images.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // Network-first for navigation, cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }
  // For other requests, try cache then network
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
