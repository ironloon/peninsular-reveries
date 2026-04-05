import { css } from 'remix/component'
import { renderToString } from 'remix/component/server'
import { attributionsPagePath } from '../data/attributions/index.js'
import { Document } from '../ui/document.js'
import { games } from '../data/game-registry.js'
import { getSiteBasePath } from '../site-config.js'
import { withBasePath } from '../site-paths.js'
import { ComingSoonGameCard, GameCard } from '../ui/game-card.js'

const heroStyles = {
  textAlign: 'center',
  padding: 'calc(var(--space-3xl) + var(--space-md)) 0 var(--space-3xl)',
  '& h1': {
    fontSize: 'var(--text-xl)',
  },
  '& p': {
    fontSize: 'var(--text-base)',
    color: 'var(--color-muted)',
    marginTop: 'var(--space-sm)',
  },
}

const homeGamepadHintStyles = {
  fontSize: 'var(--text-sm)',
}

const gamesListStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-xl)',
}

const noscriptMessageStyles = {
  background: 'var(--color-surface)',
  padding: 'var(--space-md)',
  borderRadius: '8px',
  textAlign: 'center',
  marginTop: 'var(--space-md)',
}

export async function homeAction() {
  const siteBasePath = getSiteBasePath()
  const liveGames = games.filter(g => g.status === 'live')
  const comingSoon = games.filter(g => g.status === 'coming-soon')

  const html = await renderToString(
    <Document
      title="Peninsular Reveries"
      description="Games, puzzles, and experiments — made for fun."
      path="/"
      includeNav={false}
      manifestPath="/manifest.json"
      scripts={['/client/home.js']}
    >
      <div className="hero" mix={[css(heroStyles)]}>
        <h1>Peninsular Reveries</h1>
        <p>Games, puzzles, and experiments — made for fun.</p>
        <p id="home-gamepad-hint" className="home-gamepad-hint" hidden mix={[css(homeGamepadHintStyles)]}>Use a controller to move between games, then press A to open one.</p>
      </div>
      <section id="games" className="games-list" mix={[css(gamesListStyles)]}>
        <noscript>
          <p className="noscript-message" mix={[css(noscriptMessageStyles)]}>JavaScript adds navigation and interactive features. The content below is still browsable without it.</p>
        </noscript>
        {liveGames.map(game => {
          const gamePath = withBasePath(`/${game.slug}/`, siteBasePath)
          const attributionPath = withBasePath(`${attributionsPagePath}#${game.slug}`, siteBasePath)

          return (
            <GameCard
              slug={game.slug}
              name={game.name}
              description={game.description}
              icon={game.icon}
              gamePath={gamePath}
              attributionPath={attributionPath}
            />
          )
        })}
        {comingSoon.map(game => (
          <ComingSoonGameCard name={game.name} description={game.description} icon={game.icon} />
        ))}
      </section>
    </Document>
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
