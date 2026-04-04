const CACHE_NAME = 'site-v1'
const APP_SHELL_URL = new URL('./', self.registration.scope).toString()
const ASSETS = [
  APP_SHELL_URL,
  new URL('./index.html', self.registration.scope).toString(),
  new URL('./404.html', self.registration.scope).toString(),
  new URL('./attributions/', self.registration.scope).toString(),
  new URL('./styles/main.css', self.registration.scope).toString(),
  new URL('./client/shell.js', self.registration.scope).toString(),
  new URL('./client/home.js', self.registration.scope).toString(),
  new URL('./client/404.js', self.registration.scope).toString(),
  new URL('./favicon.svg', self.registration.scope).toString(),
  new URL('./favicon-game-super-word.svg', self.registration.scope).toString(),
  new URL('./apple-touch-icon.png', self.registration.scope).toString(),
  new URL('./manifest.json', self.registration.scope).toString(),
  new URL('./chompers/', self.registration.scope).toString(),
  new URL('./styles/chompers.css', self.registration.scope).toString(),
  new URL('./client/chompers/main.js', self.registration.scope).toString(),
  new URL('./chompers/manifest.json', self.registration.scope).toString(),
  new URL('./mission-orbit/', self.registration.scope).toString(),
  new URL('./styles/mission-orbit.css', self.registration.scope).toString(),
  new URL('./client/mission-orbit/main.js', self.registration.scope).toString(),
  new URL('./mission-orbit/manifest.json', self.registration.scope).toString(),
  new URL('./mission-orbit/audio/launch-rumble-light.ogg', self.registration.scope).toString(),
  new URL('./mission-orbit/audio/launch-rumble-heavy.ogg', self.registration.scope).toString(),
  new URL('./mission-orbit/audio/burn-thrust-pulse-light.ogg', self.registration.scope).toString(),
  new URL('./mission-orbit/audio/burn-thrust-pulse-heavy.ogg', self.registration.scope).toString(),
  new URL('./mission-orbit/audio/reentry-texture-light.ogg', self.registration.scope).toString(),
  new URL('./mission-orbit/audio/reentry-texture-heavy.ogg', self.registration.scope).toString(),
  new URL('./mission-orbit/audio/parachute-deploy-light.ogg', self.registration.scope).toString(),
  new URL('./mission-orbit/audio/parachute-deploy-heavy.ogg', self.registration.scope).toString(),
  new URL('./mission-orbit/audio/splashdown-light.ogg', self.registration.scope).toString(),
  new URL('./mission-orbit/audio/splashdown-heavy.ogg', self.registration.scope).toString(),
  new URL('./mission-orbit/audio/space-ambience-light.ogg', self.registration.scope).toString(),
  new URL('./mission-orbit/audio/space-ambience-heavy.ogg', self.registration.scope).toString(),
  new URL('./mission-orbit/audio/celebration-accent-light.ogg', self.registration.scope).toString(),
  new URL('./mission-orbit/audio/celebration-accent-heavy.ogg', self.registration.scope).toString(),
  new URL('./super-word/', self.registration.scope).toString(),
  new URL('./styles/game.css', self.registration.scope).toString(),
  new URL('./client/super-word/main.js', self.registration.scope).toString(),
  new URL('./super-word/manifest.json', self.registration.scope).toString(),
]

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(
      keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key)),
    )

    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const requestUrl = new URL(event.request.url)
  if (requestUrl.origin !== self.location.origin) return

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }

          return response
        })
        .catch(async () => {
          return (await caches.match(event.request))
            || (await caches.match(APP_SHELL_URL))
            || Response.error()
        }),
    )

    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }

          return response
        })
        .catch(() => cached)

      return cached || fetched
    }),
  )
})
*** Add File: c:\Users\jared\source\repos\peninsular-reveries\client\home.ts
const launchLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.game-card-launch'))
const gamepadHint = document.getElementById('home-gamepad-hint') as HTMLElement | null

if (launchLinks.length > 0) {
  let activeIndex = -1
  let previousPreviousPressed = false
  let previousNextPressed = false
  let previousPrimaryPressed = false

  function setGamepadMode(enabled: boolean): void {
    document.body.classList.toggle('gamepad-active', enabled)
    if (gamepadHint) {
      gamepadHint.hidden = !enabled
    }
  }

  function focusLaunchLink(index: number): void {
    const normalizedIndex = (index + launchLinks.length) % launchLinks.length

    if (activeIndex >= 0) {
      launchLinks[activeIndex].classList.remove('gamepad-focus')
    }

    activeIndex = normalizedIndex
    const nextLink = launchLinks[activeIndex]
    nextLink.classList.add('gamepad-focus')
    setGamepadMode(true)
    nextLink.focus({ preventScroll: true })
    nextLink.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }

  function clearGamepadMode(): void {
    if (activeIndex >= 0) {
      launchLinks[activeIndex].classList.remove('gamepad-focus')
    }

    activeIndex = -1
    setGamepadMode(false)
  }

  const clearOnPointer = (): void => {
    clearGamepadMode()
  }

  document.addEventListener('pointerdown', clearOnPointer)
  document.addEventListener('touchstart', clearOnPointer, { passive: true })

  const pollGamepad = (): void => {
    const pad = navigator.getGamepads?.().find((candidate) => candidate !== null)
    const axisX = pad?.axes[0] ?? 0
    const axisY = pad?.axes[1] ?? 0
    const previousPressed = Boolean(pad?.buttons[14]?.pressed) || Boolean(pad?.buttons[12]?.pressed) || axisX < -0.55 || axisY < -0.55
    const nextPressed = Boolean(pad?.buttons[15]?.pressed) || Boolean(pad?.buttons[13]?.pressed) || axisX > 0.55 || axisY > 0.55
    const primaryPressed = Boolean(pad?.buttons[0]?.pressed)

    if (previousPressed && !previousPreviousPressed) {
      focusLaunchLink(activeIndex === -1 ? 0 : activeIndex - 1)
    }

    if (nextPressed && !previousNextPressed) {
      focusLaunchLink(activeIndex === -1 ? 0 : activeIndex + 1)
    }

    if (primaryPressed && !previousPrimaryPressed) {
      if (activeIndex === -1) {
        focusLaunchLink(0)
      } else {
        launchLinks[activeIndex].click()
      }
    }

    previousPreviousPressed = previousPressed
    previousNextPressed = nextPressed
    previousPrimaryPressed = primaryPressed

    requestAnimationFrame(pollGamepad)
  }

  requestAnimationFrame(pollGamepad)
}
