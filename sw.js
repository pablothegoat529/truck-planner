/* Truck Drop Planner – offline support.
   The app itself and its map/drag libraries are kept on the phone so the planner opens
   with poor signal. Postcode, routing, bridge and map-tile lookups always go online. */
const CACHE = "drop-planner-v1";
const APP = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
const LIBS = "cdnjs.cloudflare.com";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // The app: try the internet first so updates show straight away, fall back to the saved copy
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    }).catch(() => caches.match(req).then(r => r || caches.match("./index.html"))));
  } else if (url.hostname === LIBS) {
    // Map + drag libraries: saved copy first (they never change)
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    })));
  }
  // everything else (postcodes, routing, bridges, map tiles, screenshot reader) goes straight online
});
