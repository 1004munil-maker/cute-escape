// /<repo>/sw.js
const VERSION = '20251024';
const CACHE   = `cute-escape-v${VERSION}`;
const ASSETS  = [
  '/<repo>/',                      // ルート
  '/<repo>/index.html',
  '/<repo>/src/ui.css',
  '/<repo>/src/main.js',
  '/<repo>/src/game.js',
  '/<repo>/src/input.js',
  '/<repo>/public/manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ★ navigate: network-first + fallback(match ignoreSearch)
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const isHTML =
    req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    e.respondWith((async () => {
      try {
        const net = await fetch(req, { cache: 'no-store' });
        // 正常時のみ保存（404をキャッシュしない）
        if (net && net.ok) {
          const c = await caches.open(CACHE);
          // クエリ違いに強くする：Request をキーに保存
          c.put(req, net.clone());
        }
        return net;
      } catch {
        // クエリ違いでも拾えるように ignoreSearch:true
        const c = await caches.open(CACHE);
        const cached = await c.match(req, { ignoreSearch: true });
        return cached || Response.error();
      }
    })());
    return;
  }

  // その他は cache-first（404は保存しない）
  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const net = await fetch(req);
      if (net && net.ok) {
        const c = await caches.open(CACHE);
        c.put(req, net.clone());
      }
      return net;
    } catch {
      return cached || Response.error();
    }
  })());
});