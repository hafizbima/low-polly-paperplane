const CACHE = 'paperflight-v1';
self.addEventListener('install', event => { event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  const response = await fetch('/');
  if (!response.ok) throw new Error('Halaman offline tidak tersedia');
  const html = await response.clone().text();
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map(match => match[1]);
  await cache.addAll(['/icon.svg','/manifest.webmanifest', ...assets]);
  await cache.put('/', response);
})()); self.skipWaiting(); });
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('paperflight-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then(response => { if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); } return response; }).catch(() => caches.match(event.request)));
});
