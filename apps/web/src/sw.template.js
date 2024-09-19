const CACHE_VERSION = 1;

self.addEventListener("install", (event) => {});

const expectedCacheNamesSet = ["<urlPlaceHolder>"];

// delete caches that are not in the expected urls
self.addEventListener("activate", (event) => {
  console.log("active happened");
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (!expectedCacheNamesSet.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        }),
      ),
    ),
  );
});

self.addEventListener("fetch", (event) => {
  if (!expectedCacheNamesSet.includes(event.request.url)) {
    return;
  }

  event.respondWith(
    caches.open(event.request.url).then((cache) => {
      return cache
        .match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request.clone()).then((response) => {
            if (response.status === 200) {
              cache.put(event.request, response.clone());
            } else {
              console.log("Not caching the response to", event.request.url);
            }

            return response;
          });
        })
        .catch((error) => {
          console.error("  Error in fetch handler:", error);
          throw error;
        });
    }),
  );
});
