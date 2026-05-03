export function setupAllAboardInput(): void {
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'W') {
      document.dispatchEvent(new CustomEvent('all-aboard:whistle'))
    }
    if (e.key === 'c' || e.key === 'C') {
      document.dispatchEvent(new CustomEvent('all-aboard:chug'))
    }
    if (e.key === 'Escape') {
      const modal = document.getElementById('settings-modal')
      if (modal) {
        const isHidden = modal.hasAttribute('hidden')
        modal.toggleAttribute('hidden', !isHidden)
      }
    }
  })

  document.addEventListener('keyup', (e) => {
    if (e.key === 'c' || e.key === 'C') {
      document.dispatchEvent(new CustomEvent('all-aboard:chug-stop'))
    }
  })
}