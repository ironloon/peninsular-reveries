function announce(message: string): void {
  const el = document.getElementById('sr-announcer')
  if (el) {
    el.textContent = ''
    requestAnimationFrame(() => {
      el.textContent = message
    })
  }
}

export function announcePhase(sceneIndex: number, phase: string): void {
  announce(`Scene ${sceneIndex + 1}, ${phase} phase.`)
}

export function announceInteractionResult(message: string): void {
  announce(message)
}

export function announceSceneComplete(sceneName: string): void {
  announce(`${sceneName} complete.`)
}

export function announceMissionComplete(): void {
  announce('Mission complete! The crew has returned safely.')
}