/* Offline režim: súbory hry sa uložia do telefónu. Pri zmene hry zvýš VERZIA. */
const VERZIA = 'dielna-2';
const SUBORY = [
  './', 'index.html', 'style.css', 'manifest.webmanifest',
  'js/util.js', 'js/sound.js', 'js/geo.js', 'js/art.js', 'js/tasks.js', 'js/store.js', 'js/app.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERZIA).then(c => c.addAll(SUBORY)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERZIA).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Najprv z vyrovnávacej pamäte (hra ide aj bez internetu), na pozadí stiahnuť novšiu verziu.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(VERZIA).then(async cache => {
    const cached = await cache.match(e.request, { ignoreSearch: true });
    const fresh = fetch(e.request)
      .then(resp => {
        if (resp.ok || resp.type === 'opaque') cache.put(e.request, resp.clone());
        return resp;
      })
      .catch(() => cached || cache.match('index.html'));
    return cached || fresh;
  }));
});
