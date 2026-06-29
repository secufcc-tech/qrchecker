/* Service worker — Validación de accesos
   Estrategia cache-first: tras la primera carga, la app funciona 100% sin conexión.
   Para publicar una versión nueva de la app, sube el número de CACHE (v1 -> v2). */
const CACHE = "valida-v2";
const CORE = [
  "./",
  "./validacion.html",
  "./manifest.webmanifest",
  "./jsQR.js",
  "./icon-180.png",
  "./icon-512.png",
  "./icon-maskable-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      // addAll falla si algún archivo no existe; los añadimos de forma tolerante
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
        // Cachea lo que se vaya descargando (incluye jsQR desde CDN si se usó como respaldo)
        try {
          if (resp && (resp.ok || resp.type === "opaque")) {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
        } catch (_) {}
        return resp;
      }).catch(() => caches.match("./validacion.html"));
    })
  );
});
