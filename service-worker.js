const CACHE_NAME = 'b2-english-v32';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    if (url.origin !== location.origin) return;

    // Never cache HTML - always get fresh
    if (url.pathname.endsWith('.html')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // For JS/CSS/files: try network first, then cache
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response.ok && url.pathname.match(/\.(js|css|json)$/)) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});

self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') self.skipWaiting();
});