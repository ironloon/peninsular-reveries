const CACHE_NAME = 'mission-orbit-v7'
const APP_SHELL_URL = new URL('./', self.registration.scope).toString()
const ASSETS = [
  APP_SHELL_URL,
  new URL('../styles/mission-orbit.css', self.registration.scope).toString(),
  new URL('../client/shell.js', self.registration.scope).toString(),
  new URL('../client/mission-orbit/main.js', self.registration.scope).toString(),
  new URL('./audio/launch-rumble-light.ogg', self.registration.scope).toString(),
  new URL('./audio/launch-rumble-heavy.ogg', self.registration.scope).toString(),
  new URL('./audio/burn-thrust-pulse-light.ogg', self.registration.scope).toString(),
  new URL('./audio/burn-thrust-pulse-heavy.ogg', self.registration.scope).toString(),
  new URL('./audio/reentry-texture-light.ogg', self.registration.scope).toString(),
  new URL('./audio/reentry-texture-heavy.ogg', self.registration.scope).toString(),
  new URL('./audio/parachute-deploy-light.ogg', self.registration.scope).toString(),
  new URL('./audio/parachute-deploy-heavy.ogg', self.registration.scope).toString(),
  new URL('./audio/splashdown-light.ogg', self.registration.scope).toString(),
  new URL('./audio/splashdown-heavy.ogg', self.registration.scope).toString(),
  new URL('./audio/space-ambience-light.ogg', self.registration.scope).toString(),
  new URL('./audio/space-ambience-heavy.ogg', self.registration.scope).toString(),
  new URL('./audio/celebration-accent-light.ogg', self.registration.scope).toString(),
  new URL('./audio/celebration-accent-heavy.ogg', self.registration.scope).toString(),
  new URL('../favicon.svg', self.registration.scope).toString(),
  new URL('../apple-touch-icon.png', self.registration.scope).toString(),
  new URL('./manifest.json', self.registration.scope).toString(),
]

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    await self.clients.claim()
  })())
})

function isNetworkFirstRequest(request) {
  if (request.mode === 'navigate') return true

  const url = new URL(request.url)
  return request.destination === 'script'
    || request.destination === 'style'
    || request.destination === 'document'
    || url.pathname.endsWith('.js')
    || url.pathname.endsWith('.css')
    || url.pathname.endsWith('.html')
    || url.pathname.endsWith('.json')
}

async function cacheResponse(request, response) {
  if (!response || !response.ok) return response

  const cache = await caches.open(CACHE_NAME)
  await cache.put(request, response.clone())
  return response
}

async function networkFirst(request, fallbackRequest) {
  const cache = await caches.open(CACHE_NAME)

  try {
    const response = await fetch(new Request(request, { cache: 'no-cache' }))
    return await cacheResponse(request, response)
  } catch {
    return (await cache.match(request))
      || (fallbackRequest ? await cache.match(fallbackRequest) : undefined)
      || Response.error()
  }
}

async function cacheFirst(request, fallbackRequest) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)
    return await cacheResponse(request, response)
  } catch {
    return (fallbackRequest ? await cache.match(fallbackRequest) : undefined) || Response.error()
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const requestUrl = new URL(event.request.url)
  if (requestUrl.origin !== self.location.origin) return

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, APP_SHELL_URL))
    return
  }

  if (isNetworkFirstRequest(event.request)) {
    event.respondWith(networkFirst(event.request))
    return
  }

  event.respondWith(cacheFirst(event.request))
})