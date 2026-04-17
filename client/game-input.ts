export type DpadDirection = 'up' | 'down' | 'left' | 'right'

export interface GamepadCallbacks {
  onDpad(direction: DpadDirection): void
  onButtonA(): void
  onButtonStart(): void
  onDisconnect?(): void
  onRawAxis?(axes: readonly number[]): void
  onButtonAHold?(durationMs: number): void
  onButtonARelease?(): void
}

export interface GamepadPoller {
  start(): void
  stop(): void
  isConnected(): boolean
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function isModalOpen(modalId: string = 'settings-modal'): boolean {
  const modal = document.getElementById(modalId)
  return modal !== null && !modal.hasAttribute('hidden')
}

export function focusableElements(root: ParentNode | null): HTMLElement[] {
  if (!root) return []
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.closest('[hidden]') && el.getClientRects().length > 0,
  )
}

export function createGamepadPoller(callbacks: GamepadCallbacks): GamepadPoller {
  let frameHandle: number | null = null
  let lastActionTime = 0
  let connected = false

  let prevDpadUp = false
  let prevDpadDown = false
  let prevDpadLeft = false
  let prevDpadRight = false
  let prevBtnA = false
  let prevBtnStart = false

  const DEAD_ZONE = 0.5
  const DEBOUNCE_MS = 200
  const HOLD_THRESHOLD_MS = 300
  let buttonADownSince: number | null = null
  let buttonAHoldFired = false

  function onConnected(): void {
    connected = true
  }

  function onDisconnected(): void {
    connected = false
    callbacks.onDisconnect?.()
  }

  function poll(): void {
    if (document.visibilityState !== 'visible') {
      frameHandle = requestAnimationFrame(poll)
      return
    }

    const pads = navigator.getGamepads?.()
    const pad = pads ? pads[0] : null

    if (pad) {
      const now = Date.now()

      const dpadUp = pad.buttons[12]?.pressed ?? false
      const dpadDown = pad.buttons[13]?.pressed ?? false
      const dpadLeft = pad.buttons[14]?.pressed ?? false
      const dpadRight = pad.buttons[15]?.pressed ?? false
      const btnA = pad.buttons[0]?.pressed ?? false
      const btnStart = pad.buttons[9]?.pressed ?? false
      const axis0 = pad.axes[0] ?? 0
      const axis1 = pad.axes[1] ?? 0

      if (callbacks.onRawAxis) {
        callbacks.onRawAxis(pad.axes)
      }

      if (callbacks.onButtonAHold) {
        if (btnA && !prevBtnA) {
          buttonADownSince = now
          buttonAHoldFired = false
        }

        if (btnA && buttonADownSince !== null && !buttonAHoldFired) {
          const holdDuration = now - buttonADownSince
          if (holdDuration >= HOLD_THRESHOLD_MS) {
            buttonAHoldFired = true
            callbacks.onButtonAHold(holdDuration)
          }
        }

        if (!btnA && prevBtnA) {
          if (!buttonAHoldFired) {
            callbacks.onButtonA()
          }
          callbacks.onButtonARelease?.()
          buttonADownSince = null
          buttonAHoldFired = false
        }
      }

      if (now - lastActionTime >= DEBOUNCE_MS) {
        let dpad: DpadDirection | null = null

        if (dpadUp && !prevDpadUp) dpad = 'up'
        else if (dpadDown && !prevDpadDown) dpad = 'down'
        else if (dpadLeft && !prevDpadLeft) dpad = 'left'
        else if (dpadRight && !prevDpadRight) dpad = 'right'
        else if (axis1 < -DEAD_ZONE) dpad = 'up'
        else if (axis1 > DEAD_ZONE) dpad = 'down'
        else if (axis0 < -DEAD_ZONE) dpad = 'left'
        else if (axis0 > DEAD_ZONE) dpad = 'right'

        if (dpad) {
          lastActionTime = now
          callbacks.onDpad(dpad)
        }

        if (!callbacks.onButtonAHold && btnA && !prevBtnA) {
          lastActionTime = now
          callbacks.onButtonA()
        }

        if (btnStart && !prevBtnStart) {
          lastActionTime = now
          callbacks.onButtonStart()
        }
      }

      prevDpadUp = dpadUp
      prevDpadDown = dpadDown
      prevDpadLeft = dpadLeft
      prevDpadRight = dpadRight
      prevBtnA = btnA
      prevBtnStart = btnStart
    }

    frameHandle = requestAnimationFrame(poll)
  }

  return {
    start(): void {
      if (frameHandle !== null) return
      window.addEventListener('gamepadconnected', onConnected)
      window.addEventListener('gamepaddisconnected', onDisconnected)
      frameHandle = requestAnimationFrame(poll)
    },
    stop(): void {
      if (frameHandle !== null) {
        cancelAnimationFrame(frameHandle)
        frameHandle = null
      }
      window.removeEventListener('gamepadconnected', onConnected)
      window.removeEventListener('gamepaddisconnected', onDisconnected)
    },
    isConnected(): boolean {
      return connected
    },
  }
}
