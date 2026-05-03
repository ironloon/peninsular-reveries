export interface MudskipperInputCallbacks {
  onStart: () => void
  onReplay: () => void
  onMenu: () => void
}

export function setupMudskipperInput(
  callbacks: MudskipperInputCallbacks,
  elements: {
    startBtn: HTMLElement
    replayBtn: HTMLElement
    menuBtns: HTMLElement[]
  },
): void {
  const { startBtn, replayBtn, menuBtns } = elements

  startBtn.addEventListener('click', () => {
    callbacks.onStart()
  })

  replayBtn.addEventListener('click', () => {
    callbacks.onReplay()
  })

  for (const btn of menuBtns) {
    btn.addEventListener('click', () => {
      callbacks.onMenu()
    })
  }

  // Keyboard: Escape opens menu during game
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      callbacks.onMenu()
    }
  })
}
