export function showScreen(screenId: string, allScreenIds: string[]): void {
  for (const id of allScreenIds) {
    const el = document.getElementById(id)
    if (!el) continue
    if (id === screenId) {
      el.hidden = false
      el.removeAttribute('aria-hidden')
    } else {
      el.hidden = true
      el.setAttribute('aria-hidden', 'true')
    }
  }
}
