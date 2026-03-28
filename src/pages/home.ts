import { games } from '../shared/game-registry.js'

// Homepage initialization with error boundary (SITE-06)
const main = document.querySelector('main')
if (main) {
  try {
    const section = document.getElementById('games')
    if (section) {
      section.innerHTML = ''
      for (const game of games) {
        const card = document.createElement('a')
        card.href = './' + game.slug + '/'
        card.className = 'game-card'

        const h2 = document.createElement('h2')
        h2.textContent = game.name
        card.appendChild(h2)

        const p = document.createElement('p')
        p.textContent = game.description
        card.appendChild(p)

        section.appendChild(card)
      }
    }
  } catch (error) {
    console.error('Homepage initialization failed:', error)
    const errorEl = document.createElement('p')
    errorEl.textContent = 'Something went wrong loading this page. Try refreshing.'
    main.appendChild(errorEl)
  }
}
