/* Service worker — Validación de accesos (línea -web)
   cache-first: tras la primera carga, la PWA funciona sin conexión.
   Para publicar una versión nueva, sube el número de CACHE (v1 -> v2). */
const CACHE = "valida-web-v1";
const CORE = [
  "./",
  "./validacion-web.html",
  "./manifest-web.webmanifest",
  "./jsQR.js",
  "./icon-180.png",
  "./icon-512.png",
  "./icon-maskable-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.allSettled(CORE.map((u) => c.add(u)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((resp) => {
        try {
          if (resp && (resp.ok || resp.type === "opaque")) {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
        } catch (_) {}
        return resp;
      }).catch(() => caches.match("./validacion-web.html"));
    })
  );
});
