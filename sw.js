const VERSION = '20251024';
const CACHE   = `cute-escape-v${VERSION}`;
const ASSETS  = [
  '/cute-escape/',
  '/cute-escape/index.html',
  '/cute-escape/src/ui.css',
  '/cute-escape/src/main.js',
  '/cute-escape/src/game.js',
  '/cute-escape/src/input.js',
  '/cute-escape/public/manifest.webmanifest'
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
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const isHTML = req.mode === 'navigate' ||
                 (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    // HTMLは network-first、404はキャッシュ保存しない。fallback は ignoreSearch:true
    e.respondWith((async () => {
      try {
        const net = await fetch(req, { cache: 'no-store' });
        if (net && net.ok) {
          const c = await caches.open(CACHE);
          await c.put(req, net.clone()); // クエリ付きURLもそのままキーに
        }
        return net;
      } catch {
        const c = await caches.open(CACHE);
        const cached = await c.match(req, { ignoreSearch: true });
        return cached || Response.error();
      }
    })());
    return;
  }

  // その他アセットは cache-first（404は保存しない）
  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;

    try {
      const net = await fetch(req);
      if (net && net.ok) {
        const c = await caches.open(CACHE);
        await c.put(req, net.clone());
      }
      return net;
    } catch {
      return cached || Response.error();
    }
  })());
});