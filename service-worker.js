const CACHE_NAME = "word-catch-v8";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./css/game.css",
  "./js/app.js",
  "./js/router.js",
  "./js/storage.js",
  "./js/utils.js",
  "./js/game.js",
  "./js/gameScreen.js",
  "./js/wordListScreen.js",
  "./js/sound.js",
  "./js/shareResult.js",
  "./js/data/seedWords.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  // Deliberately no skipWaiting() here: a new worker stays parked until the
  // player taps "Обновить", so an update can't yank the page out from under
  // a round in progress. app.js sends SKIP_WAITING when they do.
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => cached);
    })
  );
});
