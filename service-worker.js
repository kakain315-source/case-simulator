const CACHE_NAME = 'case-sim-v1';
const FILES = [
  './',
  './index.html',
  './style.css',
  './main.js',
  './manifest.json'
];

self.addEventListener('install', evt=>{
  evt.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', evt=>{
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});
self.addEventListener('fetch', evt=>{
  const req = evt.request;
  // try network first for fresh main.js and index.html
  if(req.method === 'GET' && (req.url.endsWith('/main.js') || req.url.endsWith('/index.html'))){
    evt.respondWith(fetch(req).catch(()=>caches.match(req)));
    return;
  }
  evt.respondWith(caches.match(req).then(m => m || fetch(req).catch(()=>caches.match('./'))));
});
