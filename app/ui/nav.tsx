import { css } from '@remix-run/component'
import { games } from '../data/game-registry.js'
import { attributionsPagePath } from '../data/attributions/index.js'
import { getSiteBasePath } from '../site-config.js'
import { withBasePath } from '../site-paths.js'

interface NavProps {
  path: string
}

const siteNavStyles = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--space-md)',
  rowGap: 'var(--space-xs)',
  alignItems: 'center',
  justifyContent: 'center',
  maxWidth: '42rem',
  marginInline: 'auto',
}

const siteNavLinkStyles = {
  textDecoration: 'none',
  color: 'var(--color-text)',
  fontSize: 'var(--text-sm)',
  padding: 'var(--space-sm) var(--space-xs)',
  whiteSpace: 'nowrap',
  '&:hover': {
    color: 'var(--color-accent)',
  },
  '&.active': {
    borderBottom: '2px solid var(--color-accent)',
    color: 'var(--color-accent)',
  },
}

export function Nav() {
  return (props: NavProps) => {
    const { path } = props
    const siteBasePath = getSiteBasePath()
    const liveGames = games.filter(g => g.status === 'live')
    return (
      <nav className="site-nav" aria-label="Site navigation" mix={[css(siteNavStyles)]}>
        <a href={withBasePath('/', siteBasePath)} className={isActive('/', path) ? 'active' : undefined} mix={[css(siteNavLinkStyles)]}>Home</a>
        {liveGames.map(game => {
          const routePath = `/${game.slug}/`
          return (
            <a href={withBasePath(routePath, siteBasePath)} className={isActive(routePath, path) ? 'active' : undefined} mix={[css(siteNavLinkStyles)]}>
              {game.name}
            </a>
          )
        })}
        <a href={withBasePath(attributionsPagePath, siteBasePath)} className={isActive(attributionsPagePath, path) ? 'active' : undefined} mix={[css(siteNavLinkStyles)]}>Attributions</a>
      </nav>
    )
  }
}

function isActive(href: string, currentPath: string): boolean {
  const normalized = currentPath.replace(/\/$/, '') || '/'
  const hrefNormalized = href.replace(/\/$/, '') || '/'
  return normalized === hrefNormalized
}
