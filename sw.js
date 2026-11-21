/* Versioned app-shell cache for GitHub Pages. Existing logs remain in localStorage. */
const CACHE = "almanac-v10";
const FILES = ["./","index.html","manifest.webmanifest","assets/css/style.css","assets/css/orbit-four.css","assets/css/living-universe-v5.css","assets/css/editorial-six.css","assets/js/engine.js","assets/js/content.js","assets/js/scene.js","assets/js/figures.js","assets/js/app.js","assets/js/orbit-interaction.js","assets/fonts/fraunces.woff2","assets/fonts/fraunces-italic.woff2","assets/fonts/figtree.woff2","assets/fonts/figtree-italic.woff2","assets/icons/favicon.svg","assets/icons/icon-192.png","assets/icons/icon-512.png","assets/icons/apple-touch-icon.png"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("almanac-") && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
});
