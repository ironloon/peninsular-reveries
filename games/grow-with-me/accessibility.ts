const statusEl = () => document.getElementById('game-status')
const feedbackEl = () => document.getElementById('game-feedback')

export function announceSeedPlant(): void {
  const el = feedbackEl()
  if (!el) return
  el.textContent = 'Seed planted! Watch it grow during the day.'
}

export function announceSprout(): void {
  const el = feedbackEl()
  if (!el) return
  el.textContent = 'A sprout emerged from the soil!'
}

export function announceBloom(): void {
  const el = feedbackEl()
  if (!el) return
  el.textContent = 'A flower is blooming!'
}

export function announceRain(): void {
  const el = feedbackEl()
  if (!el) return
  el.textContent = 'It started raining! Growth will be boosted.'
}

export function announceDayPhase(phase: string): void {
  const el = statusEl()
  if (!el) return
  const messages: Record<string, string> = {
    dawn: 'Dawn breaks. Plants begin to grow.',
    day: 'Daylight. Plants grow faster now.',
    dusk: 'The sun sets. Growth slows down.',
    night: 'Nighttime. Plants rest until dawn.',
  }
  el.textContent = messages[phase] ?? ''
}

export function announceStart(): void {
  const el = statusEl()
  if (!el) return
  el.textContent = 'Garden ready. Move in the left lane to plant seeds!'
}

export function announcePlaying(): void {
  const el = statusEl()
  if (!el) return
  el.textContent = 'Grow your garden! Move in different lanes to plant, water, and nurture.'
}

export function announceCelebration(): void {
  const el = feedbackEl()
  if (!el) return
  el.textContent = 'Congratulations! Your garden is thriving!'
}

export function announceReset(): void {
  const el = statusEl()
  if (!el) return
  el.textContent = 'Garden cleared. Ready to grow again!'
}

export function manageFocus(screen: 'start' | 'playing' | 'celebrating'): void {
  let target: HTMLElement | null = null
  if (screen === 'start') {
    target = document.getElementById('start-btn')
  } else if (screen === 'playing') {
    target = document.querySelector('.gwm-menu-btn')
  } else if (screen === 'celebrating') {
    target = document.getElementById('replay-btn')
  }
  if (target) {
    target.focus()
  }
}