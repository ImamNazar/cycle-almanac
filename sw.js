/* Almanac service worker: makes the app work offline.
   Strategy: serve from cache instantly, refresh the cache in the background,
   so an update you upload to GitHub arrives on the next visit.
   It only ever caches this site's own files. It never touches your logged data. */
const CACHE = "almanac-v2";
const FILES = ["./", "index.html", "manifest.webmanifest",
  "assets/css/style.css", "assets/js/engine.js", "assets/js/content.js", "assets/js/scene.js", "assets/js/figures.js", "assets/js/app.js",
  "assets/fonts/fraunces.woff2", "assets/fonts/fraunces-italic.woff2", "assets/fonts/figtree.woff2", "assets/fonts/figtree-italic.woff2",
  "assets/icons/favicon.svg", "assets/icons/icon-192.png", "assets/icons/icon-512.png", "assets/icons/apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(hit => {
    const net = fetch(r).then(res => { if (res && res.ok) caches.open(CACHE).then(c => c.put(r, res.clone())); return res; }).catch(() => hit);
    return hit || net;
  }));
});
