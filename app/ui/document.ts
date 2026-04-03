import { html } from 'remix/html-template'
import type { SafeHtml } from 'remix/html-template'
import { renderNav } from './nav.js'

interface DocumentOptions {
  title: string
  description: string
  path: string
  stylesheets?: string[]
  scripts?: string[]
  bodyAttrs?: string
}

const SITE_URL = 'https://jaredkrinke.github.io/peninsular-reveries'

export function document(options: DocumentOptions, content: SafeHtml): SafeHtml {
  const { title, description, path, stylesheets = [], scripts = [] } = options
  const fullTitle = path === '/' ? 'Peninsular Reveries' : `${title} — Peninsular Reveries`
  const ogUrl = SITE_URL + path

  const styleLinks = ['/styles/main.css', ...stylesheets]
    .map(href => html.raw`<link rel="stylesheet" href="${href}">`)
    .join('\n  ')

  const scriptTags = ['/client/shell.js', ...scripts]
    .map(src => html.raw`<script type="module" src="${src}"></script>`)
    .join('\n  ')

  const nav = renderNav(path)
  const bodyAttr = options.bodyAttrs ? ` ${options.bodyAttrs}` : ''

  return html.raw`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fullTitle}</title>
  <meta name="description" content="${description}">
  <meta property="og:title" content="${fullTitle}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${ogUrl}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="${SITE_URL}/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  ${styleLinks}
  <script>
    const theme = localStorage.getItem('theme');
    if (theme) document.documentElement.setAttribute('data-theme', theme);
  </script>
</head>
<body${bodyAttr}>
  <header id="site-header" class="site-header">${nav}</header>
  <main>
    ${content}
  </main>
  <footer class="site-footer">
    <p>A quiet corner of the internet.</p>
  </footer>
  ${scriptTags}
</body>
</html>`
}
