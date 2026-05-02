import { test, expect, type Page } from '@playwright/test'

async function injectMockCamera(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const fakeStream = new MediaStream()
    Object.defineProperty(navigator, 'mediaDevices', {
      get() {
        return { getUserMedia: async () => fakeStream }
      },
      configurable: true,
    })
  })
}

async function installMockGamepad(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const state = {
      connected: true,
      id: 'Mock Gamepad',
      index: 0,
      mapping: 'standard',
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 16 }, () => ({ pressed: false, touched: false, value: 0 })),
      timestamp: Date.now(),
    }

    Object.defineProperty(window, '__mockGamepadState', {
      value: state,
      configurable: true,
    })

    Object.defineProperty(navigator, 'getGamepads', {
      configurable: true,
      value: () => [state, null, null, null],
    })
  })
}

async function setGamepadButton(page: Page, index: number, pressed: boolean): Promise<void> {
  await page.evaluate(({ index, pressed }) => {
    const gamepadWindow = window as unknown as Window & {
      __mockGamepadState: {
        buttons: Array<{ pressed: boolean; touched: boolean; value: number }>
        timestamp: number
      }
    }

    const state = gamepadWindow.__mockGamepadState
    state.buttons[index] = {
      ...state.buttons[index],
      pressed,
      touched: pressed,
      value: pressed ? 1 : 0,
    }
    state.timestamp = Date.now()
  }, { index, pressed })
}

async function tapGamepadButton(page: Page, index: number): Promise<void> {
  await setGamepadButton(page, index, true)
  await page.waitForTimeout(60)
  await setGamepadButton(page, index, false)
  await page.waitForTimeout(260)
}

async function blockServiceWorker(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      configurable: true,
    })
  })
}

test.describe('Copycat', () => {
  test('start screen is visible', async ({ page }) => {
    await blockServiceWorker(page)
    await page.goto('/copycat/')
    await expect(page.locator('#start-screen')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Copycat' })).toBeVisible()
  })

  test('game screen and canvas render on start', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await injectMockCamera(page)
    await blockServiceWorker(page)

    await page.goto('/copycat/')
    await expect(page.locator('#start-screen')).toBeVisible()
    await expect(page.locator('#camera-denied-msg')).toHaveText('Camera access granted. Press Start to begin!')

    await page.locator('#start-btn').click()
    await expect(page.locator('#game-screen')).toBeVisible()

    // Wait for CSS transition + rAF settle (same as game code)
    await page.waitForTimeout(700)

    const canvas = page.locator('#pixi-stage canvas')
    await expect(canvas).toBeAttached()
    const box = await canvas.boundingBox()
    expect(box?.width).toBeGreaterThan(0)
    expect(box?.height).toBeGreaterThan(0)
    await expect(canvas).toBeInViewport()
  })

  test('canvas has rendered pixel content after start', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await injectMockCamera(page)
    await blockServiceWorker(page)

    await page.goto('/copycat/')
    await expect(page.locator('#camera-denied-msg')).toHaveText('Camera access granted. Press Start to begin!')

    await page.locator('#start-btn').click()
    await expect(page.locator('#game-screen')).toBeVisible()

    // Wait for CSS transition + rAF settle (same as game code)
    await page.waitForTimeout(700)

    // WebGPU canvases may not support toDataURL(), so we read back pixels
    // via a temporary 2D canvas drawImage (the same technique the game
    // health-check uses).
    const hasPixels = await page.evaluate(() => {
      const canvas = document.querySelector('#pixi-stage canvas') as HTMLCanvasElement | null
      if (!canvas) return false
      const w = canvas.width || 1
      const h = canvas.height || 1
      const temp = document.createElement('canvas')
      temp.width = w
      temp.height = h
      const ctx = temp.getContext('2d', { willReadFrequently: true })
      if (!ctx) return false
      try {
        ctx.drawImage(canvas, 0, 0)
        const d = ctx.getImageData(0, 0, w, h).data
        for (let i = 3; i < d.length; i += 4) {
          if (d[i] > 0) return true
        }
      } catch {
        return false
      }
      return false
    })

    expect(hasPixels).toBe(true)
  })

  test('controller opens menu', async ({ page }) => {
    await injectMockCamera(page)
    await installMockGamepad(page)
    await blockServiceWorker(page)
    await page.goto('/copycat/')

    await expect(page.locator('#start-screen')).toBeVisible()
    await expect(page.locator('#camera-denied-msg')).toHaveText('Camera access granted. Press Start to begin!')
    await tapGamepadButton(page, 9)
    await expect(page.locator('#settings-modal')).toBeVisible()
  })

  test('asset 404 gate', async ({ page }) => {
    const notFoundAssets: string[] = []

    page.on('response', (response) => {
      const url = response.url()
      if (
        (url.endsWith('/client/copycat/main.js') || url.endsWith('/styles/copycat.css'))
        && response.status() === 404
      ) {
        notFoundAssets.push(url)
      }
    })

    await blockServiceWorker(page)
    await page.goto('/copycat/')
    await page.waitForLoadState('networkidle')

    expect(notFoundAssets).toEqual([])
  })
})
