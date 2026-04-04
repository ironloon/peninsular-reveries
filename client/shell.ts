// Theme toggle in footer
const footer = document.querySelector('.site-footer')

function withBasePath(path: string): string {
  const basePath = document.documentElement.dataset.basePath?.replace(/\/+$/g, '') || ''
  return basePath ? `${basePath}${path}` : path
}

if (footer) {
  const toggle = document.createElement('button')
  toggle.className = 'theme-toggle'

  function isDark(): boolean {
    const stored = localStorage.getItem('theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  function updateLabel() {
    toggle.textContent = isDark() ? 'Switch to light mode' : 'Switch to dark mode'
  }

  updateLabel()

  toggle.addEventListener('click', () => {
    const newTheme = isDark() ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
    updateLabel()
  })

  footer.appendChild(toggle)
}

async function syncServiceWorker(): Promise<void> {
  const siteServiceWorkerPath = document.documentElement.dataset.siteServiceWorkerPath ?? withBasePath('/sw.js')
  const siteServiceWorkerScope = document.documentElement.dataset.siteServiceWorkerScope ?? withBasePath('/')
  const serviceWorkerPath = document.documentElement.dataset.serviceWorkerPath
  const serviceWorkerScope = document.documentElement.dataset.serviceWorkerScope
  const registrations = new Map<string, ServiceWorkerRegistration>()

  const trackRegistration = async (registration: ServiceWorkerRegistration): Promise<void> => {
    registrations.set(registration.scope, registration)

    try {
      await registration.update()
    } catch {
      // Ignore update probe failures.
    }
  }

  try {
    const siteRegistration = await navigator.serviceWorker.register(siteServiceWorkerPath, {
      scope: siteServiceWorkerScope,
      updateViaCache: 'none',
    })
    await trackRegistration(siteRegistration)

    if (serviceWorkerPath && serviceWorkerPath !== siteServiceWorkerPath) {
      const options = serviceWorkerScope
        ? { scope: serviceWorkerScope, updateViaCache: 'none' as const }
        : { updateViaCache: 'none' as const }
      const gameRegistration = await navigator.serviceWorker.register(serviceWorkerPath, options)
      await trackRegistration(gameRegistration)
    }

    const refreshRegistrations = (): void => {
      for (const registration of registrations.values()) {
        void registration.update().catch(() => undefined)
      }
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        refreshRegistrations()
      }
    })

    window.addEventListener('focus', refreshRegistrations)
  } catch {
    // SW sync failed — offline won't work, that's fine
  }
}

// Register scoped service worker for offline support
if ('serviceWorker' in navigator) {
  let reloadingForServiceWorker = false

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadingForServiceWorker) return
    reloadingForServiceWorker = true
    window.location.reload()
  })

  void syncServiceWorker()
}
