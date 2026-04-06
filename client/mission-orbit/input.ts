export interface InputCallbacks {
  onStart: () => void
  onTap: () => void
  onHoldStart: () => void
  onHoldEnd: () => void
  onSettings: () => void
  onPlayAgain: () => void
}

type Listener = {
  target: EventTarget
  type: string
  fn: EventListenerOrEventListenerObject
}

let listeners: Listener[] = []
let tapDebounceTimer: ReturnType<typeof setTimeout> | null = null

function addListener(target: EventTarget, type: string, fn: EventListenerOrEventListenerObject): void {
  target.addEventListener(type, fn)
  listeners.push({ target, type, fn })
}

function makeTap(callbacks: InputCallbacks): () => void {
  return () => {
    if (tapDebounceTimer !== null) return
    callbacks.onTap()
    tapDebounceTimer = setTimeout(() => {
      tapDebounceTimer = null
    }, 50)
  }
}

export function setupInput(callbacks: InputCallbacks): void {
  const startBtn = document.getElementById('start-btn')
  const tapBtn = document.getElementById('tap-btn')
  const playAgainBtn = document.getElementById('play-again-btn')
  const restartBtn = document.getElementById('restart-btn')
  const settingsCloseBtn = document.getElementById('settings-close-btn')
  const settingsBtns = document.querySelectorAll('[data-settings-open]')

  const tap = makeTap(callbacks)

  if (startBtn) {
    addListener(startBtn, 'click', () => callbacks.onStart())
  }

  if (tapBtn) {
    addListener(tapBtn, 'pointerdown', () => callbacks.onHoldStart())
    addListener(tapBtn, 'pointerup', () => callbacks.onHoldEnd())
    addListener(tapBtn, 'pointerleave', () => callbacks.onHoldEnd())
    addListener(tapBtn, 'pointercancel', () => callbacks.onHoldEnd())
    addListener(tapBtn, 'click', tap)
  }

  for (const btn of settingsBtns) {
    addListener(btn, 'click', () => callbacks.onSettings())
  }

  if (playAgainBtn) {
    addListener(playAgainBtn, 'click', () => callbacks.onPlayAgain())
  }

  if (restartBtn) {
    addListener(restartBtn, 'click', () => callbacks.onPlayAgain())
  }

  if (settingsCloseBtn) {
    addListener(settingsCloseBtn, 'click', () => {
      document.getElementById('settings-modal')?.setAttribute('hidden', '')
    })
  }

  const handleKeydown = (event: Event): void => {
    const e = event as KeyboardEvent
    const target = e.target
    if (target instanceof HTMLElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return

    // Space/Enter on #tap-btn → tap
    if ((e.key === ' ' || e.key === 'Enter') && target instanceof HTMLElement && target.id === 'tap-btn') {
      e.preventDefault()
      tap()
      return
    }

    // Z key → tap (fast-tapping accessibility)
    if (e.key === 'z' || e.key === 'Z') {
      e.preventDefault()
      tap()
    }
  }

  addListener(document, 'keydown', handleKeydown)
}

export function teardownInput(): void {
  for (const { target, type, fn } of listeners) {
    target.removeEventListener(type, fn)
  }
  listeners = []
  if (tapDebounceTimer !== null) {
    window.clearTimeout(tapDebounceTimer)
    tapDebounceTimer = null
  }
}