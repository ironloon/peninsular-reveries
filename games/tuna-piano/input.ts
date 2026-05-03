export interface TunaPianoInputCallbacks {
  onStart: () => void
  onMenu: () => void
}

export function setupTunaPianoInput(
  callbacks: TunaPianoInputCallbacks,
  elements: {
    startBtn: HTMLElement
    menuBtns: HTMLElement[]
  },
): void {
  const { startBtn, menuBtns } = elements

  startBtn.addEventListener('click', () => {
    callbacks.onStart()
  })

  for (const btn of menuBtns) {
    btn.addEventListener('click', () => {
      callbacks.onMenu()
    })
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      callbacks.onMenu()
    }
  })
}