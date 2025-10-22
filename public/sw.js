// public/sw.js — App Shell cache
const CACHE = 'cute-escape-v4';
const ASSETS = [
  './',
  './index.html',
  './src/ui.css',
  './src/main.js',
  './src/game.js',
  './src/input.js',
  './public/manifest.webmanifest'
];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  const url = new URL(e.request.url);
  if (ASSETS.some(a=>url.pathname.endsWith(a.replace('./','/')))){
    e.respondWith(caches.match(e.request).then(r=>r || fetch(e.request)));
  }
});
