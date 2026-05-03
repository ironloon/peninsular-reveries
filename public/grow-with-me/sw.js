const CACHE_NAME = 'grow-with-me-v1'

const urlsToCache = [
  '/grow-with-me/',
  '/styles/grow-with-me.css',
  '/client/grow-with-me/main.js',
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