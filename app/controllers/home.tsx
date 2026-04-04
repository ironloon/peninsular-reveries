import { renderToString } from 'remix/component/server'
import { attributionsPagePath } from '../data/attributions.js'
import { Document } from '../ui/document.js'
import { games } from '../data/game-registry.js'
import { getSiteBasePath } from '../site-config.js'
import { withBasePath } from '../site-paths.js'

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
      <div className="hero">
        <h1>Peninsular Reveries</h1>
        <p>Games, puzzles, and experiments — made for fun.</p>
        <p id="home-gamepad-hint" className="home-gamepad-hint" hidden>Use a controller to move between games, then press A to open one.</p>
      </div>
      <section id="games" className="games-list">
        <noscript>
          <p className="noscript-message">JavaScript adds navigation and interactive features. The content below is still browsable without it.</p>
        </noscript>
        {liveGames.map(game => {
          const gamePath = withBasePath(`/${game.slug}/`, siteBasePath)
          const attributionPath = withBasePath(`${attributionsPagePath}#${game.slug}`, siteBasePath)

          return (
            <article className="game-card" data-game-card={game.slug}>
              <a href={gamePath} className="game-card-primary" aria-label={`Open ${game.name}`}>
                <span className="game-card-icon" aria-hidden="true">{game.icon}</span>
                <div className="game-card-copy">
                  <h2>{game.name}</h2>
                  <p>{game.description}</p>
                </div>
              </a>
              <a href={attributionPath} className="game-card-info-btn" aria-label={`View attributions for ${game.name}`} title={`Attributions for ${game.name}`}>
                <span className="game-card-info-text">ATTRIBUTION</span>
              </a>
            </article>
          )
        })}
        {comingSoon.map(game => (
          <article className="game-card game-card-coming-soon">
            <div className="game-card-body">
              <span className="game-card-icon" aria-hidden="true">{game.icon}</span>
              <div className="game-card-copy">
                <h2>{game.name}</h2>
                <p>{game.description}</p>
              </div>
            </div>
            <span className="coming-soon-badge">Coming Soon</span>
          </article>
        ))}
      </section>
    </Document>
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
