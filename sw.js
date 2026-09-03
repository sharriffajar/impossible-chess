/**
 * Impossible Chess - Service Worker (Offline Cache & PWA)
 */

const CACHE_NAME = 'impossible-chess-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/test_suite.html',
  '/manifest.webmanifest',
  '/css/styles.css',
  '/css/board.css',
  '/js/app.js',
  '/js/config.js',
  '/js/audio.js',
  '/js/engine/zobrist.js',
  '/js/engine/eval.js',
  '/js/engine/book.js',
  '/js/engine/search.js',
  '/js/engine/learning.js',
  '/js/engine/analysis.js',
  '/js/storage/permadeath.js',
  '/js/ui/board.js',
  '/js/ui/replay.js',
  '/js/ui/evalbar.js',
  '/js/ui/analysis_view.js',
  '/js/ui/ticker.js',
  'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Never cache live Cloudflare API calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => new Response(JSON.stringify({ error: 'offline', victors: [] }), {
        headers: { 'Content-Type': 'application/json' }
      }))
    );
    return;
  }

  // Stale-while-revalidate for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
