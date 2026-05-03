const CACHE_NAME = 'baking-simulator-v1'

const urlsToCache = [
  '/baking-simulator/',
  '/styles/baking-simulator.css',
  '/client/baking-simulator/main.js',
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