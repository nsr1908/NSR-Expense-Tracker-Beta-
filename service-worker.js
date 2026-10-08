/* Offline cache: local assets up front, Chart.js cached on first load. */
const CACHE = 'expense-tracker-v1';
const ASSETS = ['./', './index.html', './style.css', './script.js', './manifest.json'];
const CHART = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all([c.addAll(ASSETS), fetch(CHART).then(r => c.put(CHART, r)).catch(() => {})])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
    if (r.ok && (e.request.url.startsWith(self.location.origin) || e.request.url === CHART)) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match('./index.html'))));
});
