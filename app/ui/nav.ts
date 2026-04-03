import { html } from 'remix/html-template'
import type { SafeHtml } from 'remix/html-template'
import { games } from '../data/game-registry.js'

export function renderNav(currentPath: string): SafeHtml {
  const links: SafeHtml[] = [
    isActive('/', currentPath)
      ? html.raw`<a href="/" class="active">Home</a>`
      : html.raw`<a href="/">Home</a>`,
  ]

  for (const game of games) {
    const href = `/${game.slug}/`
    if (isActive(href, currentPath)) {
      links.push(html.raw`<a href="${href}" class="active">${game.name}</a>`)
    } else {
      links.push(html.raw`<a href="${href}">${game.name}</a>`)
    }
  }

  return html.raw`<nav class="site-nav" aria-label="Site navigation">${links.join('\n    ')}</nav>`
}

function isActive(href: string, currentPath: string): boolean {
  const normalized = currentPath.replace(/\/$/, '') || '/'
  const hrefNormalized = href.replace(/\/$/, '') || '/'
  return normalized === hrefNormalized
}
