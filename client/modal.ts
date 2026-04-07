export function setupTabbedModal(modalId: string = 'settings-modal'): { open(): void; close(): void; toggle(): void } {
  const maybeModal = document.getElementById(modalId)
  const closeBtn = document.getElementById('settings-close-btn')
  const openButtons = Array.from(document.querySelectorAll<HTMLElement>('[data-settings-open="true"]'))

  if (!maybeModal) return { open: () => {}, close: () => {}, toggle: () => {} }

  // Re-bind after guard so TypeScript narrows the type in closures
  const modal: HTMLElement = maybeModal
  const tabBtns = Array.from(modal.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
  const panels = Array.from(modal.querySelectorAll<HTMLElement>('[role="tabpanel"]'))

  let previousFocus: HTMLElement | null = null

  function getFocusableElements(): HTMLElement[] {
    return Array.from(
      modal.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter(el => !el.closest('[hidden]'))
  }

  function activateTab(tabBtn: HTMLButtonElement): void {
    for (const btn of tabBtns) {
      const isActive = btn === tabBtn
      btn.setAttribute('aria-selected', String(isActive))
      btn.classList.toggle('tab-btn--active', isActive)
    }
    for (const panel of panels) {
      const isActive = panel.getAttribute('aria-labelledby') === tabBtn.id
      if (isActive) {
        panel.removeAttribute('hidden')
      } else {
        panel.hidden = true
      }
    }
  }

  function open(): void {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    modal.hidden = false
    for (const openButton of openButtons) {
      openButton.setAttribute('aria-expanded', 'true')
    }
    requestAnimationFrame(() => {
      const [firstFocusable] = getFocusableElements()
      ;(firstFocusable ?? modal).focus()
    })
  }

  function close(): void {
    modal.hidden = true
    for (const openButton of openButtons) {
      openButton.setAttribute('aria-expanded', 'false')
    }
    ;(previousFocus ?? (openButtons[0] as HTMLElement | undefined))?.focus()
  }

  function toggle(): void {
    if (modal.hidden) open()
    else close()
  }

  // Tab keyboard navigation (arrow keys)
  for (const btn of tabBtns) {
    btn.addEventListener('click', () => activateTab(btn))
    btn.addEventListener('keydown', (e: KeyboardEvent) => {
      const idx = tabBtns.indexOf(btn)
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        const next = tabBtns[(idx + 1) % tabBtns.length]
        next.focus()
        activateTab(next)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        const prev = tabBtns[(idx - 1 + tabBtns.length) % tabBtns.length]
        prev.focus()
        activateTab(prev)
      }
    })
  }

  // Focus trap
  modal.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
      return
    }
    if (e.key !== 'Tab') return
    const focusable = getFocusableElements()
    if (focusable.length === 0) { e.preventDefault(); modal.focus(); return }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  })

  // Backdrop click closes
  modal.addEventListener('click', (e: MouseEvent) => {
    if (e.target === modal) close()
  })

  // Close button
  closeBtn?.addEventListener('click', close)

  // Open buttons
  for (const btn of openButtons) {
    btn.addEventListener('click', open)
  }

  // Restart button
  const restartBtn = modal.querySelector<HTMLButtonElement>('#restart-btn')
  restartBtn?.addEventListener('click', () => {
    close()
    document.dispatchEvent(new CustomEvent('restart'))
  })

  // Expose for gamepad integration
  window.__settingsToggle = toggle

  return { open, close, toggle }
}

// Extend Window with __settingsToggle
declare global {
  interface Window {
    __settingsToggle?: () => void
  }
}
