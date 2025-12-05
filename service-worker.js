const CACHE_NAME = 'case-sim-cache-v4';

const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/style.css',
  '/main.js'
];

// Установка Service Worker
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Активация — очищаем старые кэши
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Перехват запросов
self.addEventListener('fetch', evt => {
  evt.respondWith(
    fetch(evt.request)
      .then(response => {
        // Сохраняем новую версию файла
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(evt.request, clone));
        return response;
      })
      .catch(() => caches.match(evt.request))
  );
});
