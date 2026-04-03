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

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(withBasePath('/sw.js')).catch(() => {
    // SW registration failed — offline won't work, that's fine
  })
}
