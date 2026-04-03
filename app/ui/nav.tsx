import { games } from '../data/game-registry.js'
import { getSiteBasePath } from '../site-config.js'
import { withBasePath } from '../site-paths.js'

interface NavProps {
  path: string
}

export function Nav() {
  return (props: NavProps) => {
    const { path } = props
    const siteBasePath = getSiteBasePath()
    const liveGames = games.filter(g => g.status === 'live')
    return (
      <nav className="site-nav" aria-label="Site navigation">
        <a href={withBasePath('/', siteBasePath)} className={isActive('/', path) ? 'active' : undefined}>Home</a>
        {liveGames.map(game => {
          const routePath = `/${game.slug}/`
          return (
            <a href={withBasePath(routePath, siteBasePath)} className={isActive(routePath, path) ? 'active' : undefined}>
              {game.name}
            </a>
          )
        })}
      </nav>
    )
  }
}

function isActive(href: string, currentPath: string): boolean {
  const normalized = currentPath.replace(/\/$/, '') || '/'
  const hrefNormalized = href.replace(/\/$/, '') || '/'
  return normalized === hrefNormalized
}
