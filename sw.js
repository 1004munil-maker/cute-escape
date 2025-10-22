// public/sw.js など。登録パスに合わせて配置してね
const VERSION = '20251025'; // ★更新のたびに上げる
const CACHE   = `cute-escape-v${VERSION}`;

const ASSETS = [
  // ルート
  '/cute-escape/',
  '/cute-escape/index.html',

  // ソース
  '/cute-escape/src/ui.css',
  '/cute-escape/src/main.js',
  '/cute-escape/src/game.js',
  '/cute-escape/src/input.js',
  '/cute-escape/src/sfx.js', // 使ってなければ消してOK

  // PWA
  '/cute-escape/public/manifest.webmanifest',
  '/cute-escape/public/icons/icon-192.png',
  '/cute-escape/public/icons/icon-512.png',

  // 画像（キャラ）
'/cute-escape/public/assets/player-ribbon-256.png',
'/cute-escape/public/assets/player-boy-256.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // no-store で取りに行って最新を確保（失敗してもインストールは継続）
    await Promise.all(ASSETS.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res && res.ok) await c.put(url, res.clone());
      } catch {}
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return; // POST等はスルー

  const accept = req.headers.get('accept') || '';
  const isHTML = req.mode === 'navigate' || accept.includes('text/html');

  if (isHTML) {
    // === HTML: network-first、失敗時は index.html を ignoreSearch でフォールバック ===
    e.respondWith((async () => {
      try {
        const net = await fetch(req, { cache: 'no-store' });
        if (net && net.ok) {
          const c = await caches.open(CACHE);
          // キャッシュキーは canonical（index.html）に寄せる
          const canonical = new URL('/cute-escape/index.html', self.registration.scope).toString();
          await c.put(canonical, net.clone());
        }
        return net;
      } catch {
        const c = await caches.open(CACHE);
        // リクエストの検索を無視して探す＆canonicalも探す
        const cached = (await c.match(req, { ignoreSearch: true })) ||
                       (await c.match('/cute-escape/index.html', { ignoreSearch: true }));
        return cached || Response.error();
      }
    })());
    return;
  }

  // === 静的アセット: cache-first + ignoreSearch（SWRで裏更新） ===
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const cached = await c.match(req, { ignoreSearch: true });
    // 裏で更新（SWR）
    e.waitUntil((async () => {
      try {
        const net = await fetch(req, { cache: 'no-store' });
        if (net && net.ok) await c.put(req, net.clone());
      } catch {}
    })());
    if (cached) return cached;
    try {
      const net = await fetch(req);
      if (net && net.ok) await c.put(req, net.clone());
      return net;
    } catch {
      return cached || Response.error();
    }
  })());
});