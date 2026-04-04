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