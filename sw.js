
const CACHE_NAME = "vtrain2k-cache-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./sw.js",
  "./icon.svg"
];

// Installation: App-Dateien lokal zwischenspeichern.
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// Aktivierung: alte Cache-Versionen entfernen.
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Dateien möglichst aus dem Cache laden.
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Nur Dateien der eigenen Website behandeln.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request)
          .then(response => {
            if (response && response.status === 200) {
              const copy = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, copy));
            }
            return response;
          })
          .catch(() => {
            if (event.request.mode === "navigate") {
              return caches.match("./index.html");
            }
            return new Response("Offline – Datei nicht im Cache.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" }
            });
          });
      })
  );
});
