// public/sw.js
const VERSION = '20251024';             // ← 更新ごとに変える
const CACHE   = `cute-escape-v${VERSION}`;
const ASSETS  = [
  './',
  './index.html',
  './src/ui.css',
  './src/main.js',
  './src/game.js',
  './src/input.js',
  './public/manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())   // すぐ新SWへ
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())   // すぐクライアント制御
  );
});

// HTMLは network-first、404/opaque はキャッシュしない
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    e.respondWith((async () => {
      try {
        const net = await fetch(req, { cache: 'no-store' });
        if (!net || !net.ok) throw new Error('bad html');
        const clone = net.clone();
        const c = await caches.open(CACHE);
        c.put('./index.html', clone);        // 最新indexを常に温存
        return net;
      } catch {
        // オフライン時などはキャッシュの index.html を返す（404固定化を回避）
        const c = await caches.open(CACHE);
        return (await c.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  // その他アセットは cache-first（404はキャッシュしない）
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