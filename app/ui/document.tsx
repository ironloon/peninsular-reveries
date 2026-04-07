import { css, type RemixNode } from '@remix-run/component'
import { getSiteBasePath, getSiteUrl } from '../site-config.js'
import { resolveSiteUrl, withBasePath } from '../site-paths.js'
import { gameBodyStyles, gameMainStyles } from './game-shell.js'
import { Nav } from './nav.js'
import { siteFooterStyles, siteHeaderStyles, siteMainStyles } from './site-styles.js'

interface DocumentProps {
  title: string
  description: string
  path: string
  stylesheets?: string[]
  includeNav?: boolean
  includeFooter?: boolean
  includeDefaultStyles?: boolean
  scripts?: string[]
  bodyClass?: string
  viewportFitCover?: boolean
  faviconPath?: string
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
      includeNav = true,
      includeFooter = true,
      includeDefaultStyles = true,
      scripts = [],
      bodyClass,
      viewportFitCover = false,
      faviconPath = '/favicon.svg',
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
    const faviconHref = withBasePath(faviconPath, siteBasePath)
    const manifestHref = manifestPath ? withBasePath(manifestPath, siteBasePath) : undefined
    const siteServiceWorkerHref = withBasePath('/sw.js', siteBasePath)
    const siteServiceWorkerScopeHref = withBasePath('/', siteBasePath)
    const serviceWorkerHref = serviceWorkerPath ? withBasePath(serviceWorkerPath, siteBasePath) : undefined
    const serviceWorkerScopeHref = serviceWorkerScope ? withBasePath(serviceWorkerScope, siteBasePath) : undefined
    const viewportContent = viewportFitCover
      ? 'width=device-width, initial-scale=1.0, viewport-fit=cover'
      : 'width=device-width, initial-scale=1.0'

    return (
      <html
        lang="en"
        data-base-path={siteBasePath}
        data-site-service-worker-path={siteServiceWorkerHref}
        data-site-service-worker-scope={siteServiceWorkerScopeHref}
        data-service-worker-path={serviceWorkerHref}
        data-service-worker-scope={serviceWorkerScopeHref}
      >
        <head>
          <meta charSet="UTF-8" />
          <meta name="viewport" content={viewportContent} />
          <title>{fullTitle}</title>
          <meta name="description" content={description} />
          <meta property="og:title" content={fullTitle} />
          <meta property="og:description" content={description} />
          <meta property="og:url" content={ogUrl} />
          <meta property="og:type" content="website" />
          <meta property="og:image" content={resolveSiteUrl(siteUrl, '/og-image.png')} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <link rel="icon" type="image/svg+xml" href={faviconHref} />
          <link rel="apple-touch-icon" href={withBasePath('/apple-touch-icon.png', siteBasePath)} />
          {manifestHref ? <link rel="manifest" href={manifestHref} /> : null}
          <meta name="theme-color" content="#1a1a2e" />
          {allStyles.map(href => <link rel="stylesheet" href={href} />)}
          <script innerHTML={`const theme=localStorage.getItem('theme');if(theme)document.documentElement.setAttribute('data-theme',theme);const reduceMotion=localStorage.getItem('reduce-motion');if(reduceMotion==='reduce'||reduceMotion==='no-preference')document.documentElement.setAttribute('data-reduce-motion',reduceMotion);`} />
        </head>
        <body className={bodyClass} mix={includeDefaultStyles ? [] : [css(gameBodyStyles)]}>
          {includeNav ? (
            <header id="site-header" className="site-header" mix={includeDefaultStyles ? [css(siteHeaderStyles)] : []}>
              <Nav path={path} />
            </header>
          ) : null}
          <main mix={includeDefaultStyles ? [css(siteMainStyles)] : [css(gameMainStyles)]}>
            {children}
          </main>
          {includeFooter ? (
            <footer className="site-footer" mix={includeDefaultStyles ? [css(siteFooterStyles)] : []}>
              <p>A quiet corner of the internet.</p>
            </footer>
          ) : null}
          {allScripts.map(src => <script type="module" src={src} />)}
        </body>
      </html>
    )
  }
}
