export type ReduceMotionPreference = 'reduce' | 'no-preference'

const REDUCE_MOTION_STORAGE_KEY = 'reduce-motion'
const REDUCE_MOTION_EVENT = 'reveries:reduce-motion-change'

function isStoredReduceMotionPreference(value: string | null): value is ReduceMotionPreference {
  return value === 'reduce' || value === 'no-preference'
}

export function getStoredReduceMotionPreference(): ReduceMotionPreference | null {
  const stored = localStorage.getItem(REDUCE_MOTION_STORAGE_KEY)
  return isStoredReduceMotionPreference(stored) ? stored : null
}

export function applyReduceMotionPreference(preference: ReduceMotionPreference | null): void {
  if (preference) {
    document.documentElement.setAttribute('data-reduce-motion', preference)
  } else {
    document.documentElement.removeAttribute('data-reduce-motion')
  }
}

export function setReduceMotionPreference(preference: ReduceMotionPreference): void {
  localStorage.setItem(REDUCE_MOTION_STORAGE_KEY, preference)
  applyReduceMotionPreference(preference)
  window.dispatchEvent(new CustomEvent(REDUCE_MOTION_EVENT, { detail: preference }))
}

export function isReducedMotionEnabled(): boolean {
  const override = document.documentElement.dataset.reduceMotion

  if (override === 'reduce') return true
  if (override === 'no-preference') return false

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function bindReduceMotionToggle(
  toggle: HTMLInputElement | null,
  helpText: HTMLElement | null = null,
): void {
  if (!toggle) return

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

  const sync = (): void => {
    const stored = getStoredReduceMotionPreference()
    const reducedMotionEnabled = isReducedMotionEnabled()

    toggle.checked = reducedMotionEnabled

    if (helpText) {
      if (stored) {
        helpText.textContent = reducedMotionEnabled
          ? 'Motion is reduced for this game until you change it here.'
          : 'Animations are allowed for this game until you change it here.'
      } else {
        helpText.textContent = `Defaults to your device setting (${mediaQuery.matches ? 'Reduce motion is on' : 'Reduce motion is off'}) until you change it here.`
      }
    }
  }

  toggle.addEventListener('change', () => {
    setReduceMotionPreference(toggle.checked ? 'reduce' : 'no-preference')
    sync()
  })

  mediaQuery.addEventListener('change', () => {
    if (!getStoredReduceMotionPreference()) {
      sync()
    }
  })

  window.addEventListener(REDUCE_MOTION_EVENT, sync)
  sync()
}

// ── Per-game preferences ──────────────────────────────────────────────────────

const MUSIC_ENABLED_KEY = 'music-enabled'
const SFX_ENABLED_KEY = 'sfx-enabled'
const MUSIC_EVENT = 'reveries:music-change'
const SFX_EVENT = 'reveries:sfx-change'

export function getGamePreference(gameSlug: string, key: string): string | null {
  return localStorage.getItem(`${gameSlug}-${key}`)
}

export function setGamePreference(gameSlug: string, key: string, value: string): void {
  localStorage.setItem(`${gameSlug}-${key}`, value)
}

export function getMusicEnabled(gameSlug: string): boolean {
  const stored = getGamePreference(gameSlug, MUSIC_ENABLED_KEY)
  return stored === null ? true : stored === 'true'
}

export function setMusicEnabled(gameSlug: string, enabled: boolean): void {
  setGamePreference(gameSlug, MUSIC_ENABLED_KEY, String(enabled))
  window.dispatchEvent(new CustomEvent(MUSIC_EVENT, { detail: { gameSlug, enabled } }))
}

export function getSfxEnabled(gameSlug: string): boolean {
  const stored = getGamePreference(gameSlug, SFX_ENABLED_KEY)
  return stored === null ? true : stored === 'true'
}

export function setSfxEnabled(gameSlug: string, enabled: boolean): void {
  setGamePreference(gameSlug, SFX_ENABLED_KEY, String(enabled))
  window.dispatchEvent(new CustomEvent(SFX_EVENT, { detail: { gameSlug, enabled } }))
}

export function bindMusicToggle(
  gameSlug: string,
  toggleEl: HTMLInputElement | null,
  helpTextEl: HTMLElement | null = null,
): void {
  if (!toggleEl) return

  const sync = (): void => {
    const enabled = getMusicEnabled(gameSlug)
    toggleEl.checked = enabled
    if (helpTextEl) {
      helpTextEl.textContent = enabled
        ? 'Music is on for this game until you change it here.'
        : 'Music is off for this game until you change it here.'
    }
  }

  toggleEl.addEventListener('change', () => {
    setMusicEnabled(gameSlug, toggleEl.checked)
    sync()
  })

  window.addEventListener(MUSIC_EVENT, (e) => {
    const event = e as CustomEvent<{ gameSlug: string; enabled: boolean }>
    if (event.detail.gameSlug === gameSlug) sync()
  })

  sync()
}

export function bindSfxToggle(
  gameSlug: string,
  toggleEl: HTMLInputElement | null,
  helpTextEl: HTMLElement | null = null,
): void {
  if (!toggleEl) return

  const sync = (): void => {
    const enabled = getSfxEnabled(gameSlug)
    toggleEl.checked = enabled
    if (helpTextEl) {
      helpTextEl.textContent = enabled
        ? 'Sound effects are on for this game until you change it here.'
        : 'Sound effects are off for this game until you change it here.'
    }
  }

  toggleEl.addEventListener('change', () => {
    setSfxEnabled(gameSlug, toggleEl.checked)
    sync()
  })

  window.addEventListener(SFX_EVENT, (e) => {
    const event = e as CustomEvent<{ gameSlug: string; enabled: boolean }>
    if (event.detail.gameSlug === gameSlug) sync()
  })

  sync()
}