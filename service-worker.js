const CACHE_NAME = 'roulette-game-cache-v1';
const URLS_TO_CACHE = [
  './', // Alias for index.html for the root path
  './index.html',
  './style.css',
  './script.js',
  './images/icon-192x192.png', // Placeholder path, but good to cache if real
  './images/icon-512x512.png'  // Placeholder path
];

// Install event: cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(err => {
        console.error('Failed to open cache or add files during install:', err);
      })
  );
});

// Fetch event: serve cached assets if available (Cache-first strategy)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // Not in cache - try to fetch from network
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(err => {
          console.error('Fetch failed; returning offline page or error if available, or just erroring out:', err);
          // Optionally, return a generic offline fallback page here if one was cached
          // For example: return caches.match('./offline.html');
        });
      })
  );
});

// Activate event: remove old caches if any
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
