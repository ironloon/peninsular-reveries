import type { RemixNode } from 'remix/component'
import { getSiteBasePath, getSiteUrl } from '../site-config.js'
import { resolveSiteUrl, withBasePath } from '../site-paths.js'
import { Nav } from './nav.js'

interface DocumentProps {
  title: string
  description: string
  path: string
  stylesheets?: string[]
  includeDefaultStyles?: boolean
  scripts?: string[]
  bodyClass?: string
  manifestPath?: string
  serviceWorkerPath?: string
  serviceWorkerScope?: string
  children: RemixNode
}

export function Document() {
  return (props: DocumentProps) => {
    const {
      title,
      description,
      path,
      stylesheets = [],
      includeDefaultStyles = true,
      scripts = [],
      bodyClass,
      manifestPath,
      serviceWorkerPath,
      serviceWorkerScope,
      children,
    } = props
    const siteBasePath = getSiteBasePath()
    const siteUrl = getSiteUrl()
    const fullTitle = path === '/' ? 'Peninsular Reveries' : `${title} — Peninsular Reveries`
    const ogUrl = resolveSiteUrl(siteUrl, path)

    const allStyles = [
      ...(includeDefaultStyles ? ['/styles/main.css'] : []),
      ...stylesheets,
    ].map(href => withBasePath(href, siteBasePath))
    const allScripts = ['/client/shell.js', ...scripts].map(src => withBasePath(src, siteBasePath))
    const manifestHref = manifestPath ? withBasePath(manifestPath, siteBasePath) : undefined
    const serviceWorkerHref = serviceWorkerPath ? withBasePath(serviceWorkerPath, siteBasePath) : undefined
    const serviceWorkerScopeHref = serviceWorkerScope ? withBasePath(serviceWorkerScope, siteBasePath) : undefined

    return (
      <html
        lang="en"
        data-base-path={siteBasePath}
        data-service-worker-path={serviceWorkerHref}
        data-service-worker-scope={serviceWorkerScopeHref}
      >
        <head>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>{fullTitle}</title>
          <meta name="description" content={description} />
          <meta property="og:title" content={fullTitle} />
          <meta property="og:description" content={description} />
          <meta property="og:url" content={ogUrl} />
          <meta property="og:type" content="website" />
          <meta property="og:image" content={resolveSiteUrl(siteUrl, '/og-image.png')} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <link rel="icon" type="image/svg+xml" href={withBasePath('/favicon.svg', siteBasePath)} />
          <link rel="apple-touch-icon" href={withBasePath('/apple-touch-icon.png', siteBasePath)} />
          {manifestHref ? <link rel="manifest" href={manifestHref} /> : null}
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
