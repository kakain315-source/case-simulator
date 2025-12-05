const CACHE_NAME = "blazecase-cache-v1";
const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/standoff_autonomous.html",
    "/manifest.json",
    "/icon-192.png",
    "/icon-512.png"
];

// Установка SW
self.addEventListener("install", (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Активация
self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Обработка запросов
self.addEventListener("fetch", (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});
