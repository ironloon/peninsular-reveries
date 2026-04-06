import { bindReduceMotionToggle } from '../preferences.js'

export function setupSettingsModal(): void {
  const modal = document.getElementById('settings-modal')
  const closeBtn = document.getElementById('settings-close-btn')
  const openButtons = Array.from(document.querySelectorAll<HTMLElement>('[data-settings-open="true"]'))
  const reduceMotionToggle = document.getElementById('reduce-motion-toggle') as HTMLInputElement | null
  const reduceMotionHelp = document.getElementById('reduce-motion-help') as HTMLElement | null

  if (!modal || !closeBtn || openButtons.length === 0) return

  const modalEl = modal
  let previousFocus: HTMLElement | null = null

  function getFocusableElements(): HTMLElement[] {
    return Array.from(
      modalEl.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hasAttribute('hidden'))
  }

  function openModal(): void {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : openButtons[0]
    modalEl.hidden = false
    for (const openButton of openButtons) {
      openButton.setAttribute('aria-expanded', 'true')
    }
    requestAnimationFrame(() => {
      const [firstFocusable] = getFocusableElements()
      ;(firstFocusable ?? modalEl).focus()
    })
  }

  function closeModal(): void {
    modalEl.hidden = true
    for (const openButton of openButtons) {
      openButton.setAttribute('aria-expanded', 'false')
    }
    ;(previousFocus ?? openButtons[0]).focus()
  }

  window.__settingsToggle = () => {
    if (modalEl.hidden) openModal()
    else closeModal()
  }

  for (const openButton of openButtons) {
    openButton.addEventListener('click', openModal)
  }

  closeBtn.addEventListener('click', closeModal)

  const restartBtn = document.getElementById('restart-btn')
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      closeModal()
      document.dispatchEvent(new CustomEvent('restart'))
    })
  }

  bindReduceMotionToggle(reduceMotionToggle, reduceMotionHelp)

  modalEl.addEventListener('click', (event) => {
    if (event.target === modalEl) closeModal()
  })

  modalEl.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeModal()
      return
    }

    if (event.key !== 'Tab') return

    const focusable = getFocusableElements()
    if (focusable.length === 0) {
      event.preventDefault()
      modalEl.focus()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement

    if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  })
}