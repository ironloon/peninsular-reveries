import { html } from 'remix/html-template'
import { createHtmlResponse } from 'remix/response/html'
import { document } from '../ui/document.js'
import { games } from '../data/game-registry.js'

export function homeAction() {
  const gameCards = games.map(
    game => html.raw`<a href="/${game.slug}/" class="game-card">
        <span class="game-card-icon" aria-hidden="true">${game.icon}</span>
        <h2>${game.name}</h2>
        <p>${game.description}</p>
      </a>`,
  )

  const content = html.raw`
    <div class="hero">
      <h1>Peninsular Reveries</h1>
      <p>Games, puzzles, and experiments — made for fun.</p>
    </div>
    <section id="games" class="games-list">
      <noscript>
        <p class="noscript-message">JavaScript adds navigation and interactive features. The content below is still browsable without it.</p>
      </noscript>
      ${gameCards.join('\n      ')}
    </section>`

  return createHtmlResponse(
    document(
      {
        title: 'Peninsular Reveries',
        description: 'Games, puzzles, and experiments — made for fun.',
        path: '/',
      },
      content,
    ),
  )
}
