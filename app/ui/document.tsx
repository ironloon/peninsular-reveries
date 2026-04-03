import type { RemixNode } from 'remix/component'
import { Nav } from './nav.js'

interface DocumentProps {
  title: string
  description: string
  path: string
  stylesheets?: string[]
  scripts?: string[]
  bodyClass?: string
  children: RemixNode
}

const SITE_URL = 'https://jaredkrinke.github.io/peninsular-reveries'

export function Document() {
  return (props: DocumentProps) => {
    const { title, description, path, stylesheets = [], scripts = [], bodyClass, children } = props
    const fullTitle = path === '/' ? 'Peninsular Reveries' : `${title} — Peninsular Reveries`
    const ogUrl = SITE_URL + path

    const allStyles = ['/styles/main.css', ...stylesheets]
    const allScripts = ['/client/shell.js', ...scripts]

    return (
      <html lang="en">
        <head>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>{fullTitle}</title>
          <meta name="description" content={description} />
          <meta property="og:title" content={fullTitle} />
          <meta property="og:description" content={description} />
          <meta property="og:url" content={ogUrl} />
          <meta property="og:type" content="website" />
          <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#1a1a2e" />
          {allStyles.map(href => <link rel="stylesheet" href={href} />)}
          <script innerHTML={`const theme=localStorage.getItem('theme');if(theme)document.documentElement.setAttribute('data-theme',theme);`} />
        </head>
        <body className={bodyClass}>
          <header id="site-header" className="site-header">
            <Nav path={path} />
          </header>
          <main>
            {children}
          </main>
          <footer className="site-footer">
            <p>A quiet corner of the internet.</p>
          </footer>
          {allScripts.map(src => <script type="module" src={src} />)}
        </body>
      </html>
    )
  }
}
