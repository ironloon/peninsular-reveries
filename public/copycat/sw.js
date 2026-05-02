const CACHE_NAME = 'copycat-v3'

// Compute base path from where this SW lives (e.g. /peninsular-reveries/copycat/sw.js)
const BASE_PATH = self.location.pathname.replace(/\/copycat\/sw\.js$/, '') || ''

function withBase(url: string): string {
  if (url.startsWith('/')) {
    return BASE_PATH + url
  }
  return url
}

self.addEventListener('install', (event) => {
  // No precache — install always succeeds
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('copycat-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  const reqPath = url.pathname

  // Network-first for everything so ?v= cache-busting works and HTML never goes stale
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
