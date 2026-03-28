import { games } from './game-registry.js'

const header = document.getElementById('site-header')
if (header) {
  const base = document.body.dataset.base ?? '.'

  const nav = document.createElement('nav')
  nav.className = 'site-nav'
  nav.setAttribute('aria-label', 'Site navigation')

  const homeLink = document.createElement('a')
  homeLink.href = base + '/'
  homeLink.textContent = 'Home'
  nav.appendChild(homeLink)

  for (const game of games) {
    const link = document.createElement('a')
    link.href = base + '/' + game.slug + '/'
    link.textContent = game.name
    nav.appendChild(link)
  }

  // Mark active link based on current URL path
  const path = window.location.pathname
  for (const a of Array.from(nav.querySelectorAll('a'))) {
    const href = a.getAttribute('href') ?? ''
    // Resolve the href relative to current page to get absolute path
    const resolved = new URL(href, window.location.href).pathname
    if (path === resolved || path === resolved.replace(/\/$/, '')) {
      a.classList.add('active')
    }
  }

  header.appendChild(nav)
}

// Theme toggle in footer
const footer = document.querySelector('.site-footer')
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
