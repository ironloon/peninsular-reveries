import { renderToString } from 'remix/component/server'
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
    >
      <div className="hero">
        <h1>Peninsular Reveries</h1>
        <p>Games, puzzles, and experiments — made for fun.</p>
      </div>
      <section id="games" className="games-list">
        <noscript>
          <p className="noscript-message">JavaScript adds navigation and interactive features. The content below is still browsable without it.</p>
        </noscript>
        {liveGames.map(game => (
          <a href={withBasePath(`/${game.slug}/`, siteBasePath)} className="game-card">
            <span className="game-card-icon" aria-hidden="true">{game.icon}</span>
            <h2>{game.name}</h2>
            <p>{game.description}</p>
          </a>
        ))}
        {comingSoon.map(game => (
          <div className="game-card game-card-coming-soon">
            <span className="game-card-icon" aria-hidden="true">{game.icon}</span>
            <h2>{game.name}</h2>
            <p>{game.description}</p>
            <span className="coming-soon-badge">Coming Soon</span>
          </div>
        ))}
      </section>
    </Document>
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
