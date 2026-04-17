import type { GameState } from './types.js'

const EMOJI_NAMES: Record<string, string> = {
  '🍒': 'Cherry',
  '🍎': 'Apple',
  '🍊': 'Orange',
  '🍇': 'Grapes',
  '🍋': 'Lemon',
  '🍑': 'Peach',
  '🍓': 'Strawberry',
  '🫐': 'Blueberry',
  '🥝': 'Kiwi',
  '🍌': 'Banana',
}

export function renderScene(state: GameState, container?: HTMLElement): void {
  const el = container ?? document.getElementById('scene-items')
  if (!el) return

  el.innerHTML = ''

  let firstActive = true
  for (const item of state.sceneItems) {
    const btn = document.createElement('button')
    btn.className = 'scene-item'
    btn.dataset.itemId = item.id
    btn.style.left = `${item.x}%`
    btn.style.top = `${item.y}%`
    btn.appendChild(document.createTextNode(item.emoji))

    const badge = document.createElement('span')
    badge.className = 'item-badge'
    badge.textContent = String(item.value)
    btn.appendChild(badge)

    const emojiName = EMOJI_NAMES[item.emoji] ?? item.emoji
    btn.setAttribute('aria-label', `${emojiName} — ${item.value}`)
    btn.tabIndex = firstActive ? 0 : -1
    firstActive = false

    el.appendChild(btn)
  }
}

export function renderProblem(state: GameState): void {
  const el = document.getElementById('problem-prompt')
  if (!el) return

  if (state.currentProblem.area === 'counting' && state.currentProblem.countingObjects?.length) {
    el.innerHTML = ''
    for (const obj of state.currentProblem.countingObjects) {
      const span = document.createElement('span')
      span.className = 'counting-object'
      span.setAttribute('aria-hidden', 'true')
      span.textContent = obj
      el.appendChild(span)
    }
  } else {
    el.textContent = state.currentProblem.prompt
  }
}

export function renderHippo(_state: GameState): void {
  const hippoEl = document.getElementById('hippo')
  if (!hippoEl) return

  const color = '#8BC34A'
  hippoEl.style.setProperty('--hippo-color', color)
  hippoEl.style.setProperty('--neck-height', '20px')
  hippoEl.style.setProperty('--jaw-angle', '0')
  hippoEl.style.left = '50%'
}

export function renderHUD(state: GameState): void {
  const scoreEl = document.getElementById('score')
  if (scoreEl) scoreEl.textContent = String(state.score)

  const roundEl = document.getElementById('round-progress')
  if (roundEl) roundEl.textContent = `Round ${state.round} of ${state.totalRounds}`

  const livesEl = document.getElementById('lives')
  if (livesEl) {
    const full = Math.max(0, state.lives)
    const empty = Math.max(0, 3 - state.lives)
    livesEl.textContent = '♥'.repeat(full) + '♡'.repeat(empty)
  }

  const streakEl = document.getElementById('streak')
  if (streakEl) {
    if (state.streak >= 2) {
      streakEl.textContent = `${state.streak} 🔥`
      streakEl.hidden = false
    } else {
      streakEl.hidden = true
    }
  }

  const chipEl = document.getElementById('area-chip')
  if (chipEl) {
    const stars = '★'.repeat(state.level) + '☆'.repeat(3 - state.level)
    chipEl.textContent = `${state.area} · Level ${state.level} ${stars}`
  }
}

export function renderEndScreen(state: GameState): void {
  const finalScoreEl = document.getElementById('end-score')
  if (finalScoreEl) finalScoreEl.textContent = String(state.score)

  const accuracyEl = document.getElementById('end-accuracy')
  if (accuracyEl) {
    const accuracy = state.totalRounds > 0
      ? Math.round((state.correctCount / state.totalRounds) * 100)
      : 0
    accuracyEl.textContent = `${accuracy}%`
  }

  const roundsEl = document.getElementById('end-rounds')
  if (roundsEl) roundsEl.textContent = `${state.correctCount} of ${state.totalRounds}`

  const bestStreakEl = document.getElementById('end-streak')
  if (bestStreakEl) bestStreakEl.textContent = String(state.bestStreak)
}

export function renderAll(state: GameState): void {
  renderProblem(state)
  renderHUD(state)
  renderScene(state)
}
