const CACHE_NAME = 'reveries-v2'
const ASSETS = [
  '.',
  'super-word/',
  'styles/main.css',
  'styles/game.css',
  'client/shell.js',
  'client/404.js',
  'client/super-word/main.js',
  'favicon.svg',
  'apple-touch-icon.png',
  'manifest.json',
]

function resolveAssetUrl(asset) {
  return new URL(asset, self.registration.scope).toString()
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS.map(resolveAssetUrl)))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      }).catch(() => cached)

      return cached || fetched
    })
  )
})
