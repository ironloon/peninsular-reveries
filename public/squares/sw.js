// Superseded by the root service worker. Cleans up the per-game registration.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheKeys = await caches.keys()
    await Promise.all(cacheKeys.filter((key) => key.startsWith('squares')).map((key) => caches.delete(key)))
    await self.registration.unregister()
  })())
})