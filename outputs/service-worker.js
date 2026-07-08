const CACHE_NAME = "learnedcircle-app-v3";
const OFFLINE_URL = "/offline.html";
const APP_SHELL = [
  "/",
  "/index.html",
  "/library.html",
  "/account.html",
  "/legal.html",
  "/trust.html",
  "/styles.css",
  "/app.js",
  "/library.js",
  "/account.js",
  "/app-register.js",
  "/app.webmanifest",
  "/assets/favicon.svg",
  "/assets/app-icon.svg",
  "/assets/app-icon-192.png",
  "/assets/app-icon-512.png",
  "/assets/app-icon-maskable.svg",
  "/assets/app-icon-maskable-192.png",
  "/assets/app-icon-maskable-512.png",
  "/assets/apple-touch-icon.png",
  "/assets/legal-hero-courthouse.png",
  OFFLINE_URL
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request).catch(() => new Response(JSON.stringify({
      ok: false,
      message: "You appear to be offline. Please reconnect and try again."
    }), {
      status: 503,
      headers: { "Content-Type": "application/json" }
    })));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL)))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok && url.origin === self.location.origin) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    }).catch(() => cached))
  );
});
