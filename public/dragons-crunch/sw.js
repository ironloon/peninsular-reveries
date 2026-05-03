const CACHE_NAME = 'dragons-crunch-v1'

// Compute base path from where this SW lives (e.g. /peninsular-reveries/dragons-crunch/sw.js)
const BASE_PATH = self.location.pathname.replace(/\/dragons-crunch\/sw\.js$/, '') || ''

function withBase(url) {
  if (url.startsWith('/')) {
    return BASE_PATH + url
  }
  return url
}

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('dragons-crunch-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  const reqPath = url.pathname

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone)
          })
        }
        return response
      })
      .catch(() =>
        caches.match(event.request).then((response) => response || Response.error()),
      ),
  )
})
