/* ============================================================================
   SPORTV — Service Worker
   Caché básica con anti-caché: siempre se intenta actualizar desde la red y
   se usa la caché solo como respaldo cuando no hay conexión.
   ========================================================================== */
const CACHE = 'spv-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE)
    .then((c) => c.addAll(['/', 'index.html', 'css/style.css']))
    .catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Nunca cachear peticiones a la API (para que los eventos estén al día).
  if (url.hostname.includes('script.google') || url.hostname.includes('googleusercontent')) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('/')))
  );
});