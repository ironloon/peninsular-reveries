import { test, expect, type Page } from '@playwright/test'

async function injectMockCamera(page: Page): Promise<void> {
  await page.route('**/client/copycat/main.js', async (route) => {
    const response = await route.fetch()
    const original = await response.text()
    const injected = `
      (function() {
        var fakeStream = new MediaStream();
        Object.defineProperty(navigator, 'mediaDevices', {
          get: function() {
            return { getUserMedia: async () => fakeStream };
          },
          configurable: true,
        });
      })();
      ${original}
    `
    await route.fulfill({
      status: response.status(),
      headers: { ...response.headers(), 'content-type': 'application/javascript' },
      body: injected,
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

test.describe('Copycat', () => {
  test('start screen is visible', async ({ page }) => {
    await page.goto('/copycat/')
    await expect(page.locator('#start-screen')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Copycat' })).toBeVisible()
  })

  test('game screen and canvas render on start', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await injectMockCamera(page)

    await page.goto('/copycat/')
    await expect(page.locator('#start-screen')).toBeVisible()
    await expect(page.locator('#camera-denied-msg')).toHaveText('Camera access granted. Press Start to begin!')

    await page.locator('#start-btn').click()
    await expect(page.locator('#game-screen')).toBeVisible()

    const canvas = page.locator('#pixi-stage canvas')
    await expect(canvas).toBeVisible()
    const box = await canvas.boundingBox()
    expect(box?.width).toBeGreaterThan(0)
    expect(box?.height).toBeGreaterThan(0)
    await canvas.scrollIntoViewIfNeeded()
    await expect(canvas).toBeInViewport()
  })

  test('canvas has rendered pixel content after start', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await injectMockCamera(page)

    await page.goto('/copycat/')
    await expect(page.locator('#camera-denied-msg')).toHaveText('Camera access granted. Press Start to begin!')

    await page.locator('#start-btn').click()
    await expect(page.locator('#game-screen')).toBeVisible()

    // Wait for PixiJS to render at least one frame
    await page.waitForTimeout(600)

    const dataUrl = await page.evaluate(() => {
      const canvas = document.querySelector('#pixi-stage canvas') as HTMLCanvasElement | null
      return canvas?.toDataURL() ?? ''
    })

    // A truly blank canvas is either empty or produces a tiny transparent PNG.
    // A rendered scene with background + cat produces a much larger data URL.
    expect(dataUrl.length).toBeGreaterThan(5000)
  })

  test('controller opens menu', async ({ page }) => {
    await injectMockCamera(page)
    await installMockGamepad(page)
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

    await page.goto('/copycat/')
    await page.waitForLoadState('networkidle')

    expect(notFoundAssets).toEqual([])
  })
})
