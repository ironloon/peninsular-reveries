const CACHE_NAME = 'mudskipper-v1'

const urlsToCache = [
  '/mudskipper/',
  '/styles/mudskipper.css',
  '/client/mudskipper/main.js',
  '/favicon.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response
      return fetch(event.request)
    }),
  )
})
