import { games } from '../data/game-registry.js'

interface NavProps {
  path: string
}

export function Nav() {
  return (props: NavProps) => {
    const { path } = props
    const liveGames = games.filter(g => g.status === 'live')
    return (
      <nav className="site-nav" aria-label="Site navigation">
        <a href="/" className={isActive('/', path) ? 'active' : undefined}>Home</a>
        {liveGames.map(game => {
          const href = `/${game.slug}/`
          return (
            <a href={href} className={isActive(href, path) ? 'active' : undefined}>
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
