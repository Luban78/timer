const CACHE_NAME = "mg3i-trainer-v038";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./history.js",
  "./storage.js",
  "./graph.js",
  "./detailGraph.js",
  "./sound.js",
  "./ui.js",
  "./algMenu.js",
  "./cubeConnection.js",
  "./algorithmStats.js",
  "./algorithms.js",
  "./manifest.json"
];

self.addEventListener("install", event=>{
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache=>{
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

self.addEventListener("activate", event=>{
  event.waitUntil(
    caches.keys().then(keys=>{
      return Promise.all(
        keys
          .filter(key=>key!==CACHE_NAME)
          .map(key=>caches.delete(key))
      );
    }).then(()=>{
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", event=>{
  event.respondWith(
    fetch(event.request)
      .then(response=>{
        const copy=response.clone();

        caches.open(CACHE_NAME).then(cache=>{
          cache.put(event.request,copy);
        });

        return response;
      })
      .catch(()=>{
        return caches.match(event.request);
      })
  );
});