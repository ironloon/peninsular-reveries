import { test, expect, type Page } from '@playwright/test';

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

test.describe('SITE-07: Game smoke tests', () => {
  // Chompers
  test('Chompers — start screen is visible', async ({ page }) => {
    await page.goto('/chompers/')
    await expect(page.locator('#start-screen')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Chompers' })).toBeVisible()
  })

  test('Chompers — game loads and renders hippo on start', async ({ page }) => {
    await page.goto('/chompers/')
    await page.getByRole('button', { name: 'Start Chomping' }).click()
    await expect(page.locator('#game-screen')).toBeVisible()
    await expect(page.locator('#hippo')).toBeVisible()
    await expect(page.locator('#scene-items button').first()).toBeVisible()

    await expect(page.locator('#hippo')).toBeInViewport()
    await expect(page.locator('#scene-items button').first()).toBeInViewport()
  })

  test('Chompers — controller opens the menu on start and starts the game', async ({ page }) => {
    await installMockGamepad(page)
    await page.goto('/chompers/')

    await tapGamepadButton(page, 9)
    await expect(page.locator('#settings-modal')).toBeVisible()

    await tapGamepadButton(page, 9)
    await expect(page.locator('#settings-modal')).toBeHidden()

    await tapGamepadButton(page, 0)
    await expect(page.locator('#game-screen')).toBeVisible()
    await expect(page.locator('#scene-items button').first()).toBeVisible()

    await expect.poll(async () => page.evaluate(() => document.body.classList.contains('gamepad-active'))).toBe(true)

    await expect.poll(async () => page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null
      if (!active?.classList.contains('scene-item')) return 0
      return parseFloat(getComputedStyle(active).outlineWidth || '0')
    })).toBeGreaterThan(0)
  })

  // Pixel Passport
  test('Pixel Passport — start screen is visible', async ({ page }) => {
    await page.goto('/pixel-passport/')
    await expect(page.locator('#start-screen')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Pixel Passport' })).toBeVisible()
  })

  test('Pixel Passport — globe screen loads on explore', async ({ page }) => {
    await page.goto('/pixel-passport/')
    await page.getByRole('button', { name: /explore/i }).click()
    await expect(page.locator('#globe-screen')).toBeVisible()
    await expect(page.locator('.destination-marker').first()).toBeVisible()

    await expect(page.locator('.destination-marker').first()).toBeInViewport()
  })

  // Mission Orbit
  test('Mission Orbit — start screen is visible', async ({ page }) => {
    await page.goto('/mission-orbit/')
    await expect(page.locator('#start-screen')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Mission: Orbit' })).toBeVisible()
  })

  test('Mission Orbit — game screen and continue prompt appear on start', async ({ page }) => {
    await page.goto('/mission-orbit/')
    await page.getByRole('button', { name: 'Begin Mission' }).click()
    await expect(page.locator('#game-screen')).toBeVisible()
    await expect(page.locator('.continue-prompt')).toBeVisible()

    await expect(page.locator('.continue-prompt')).toBeInViewport()
  })

  // Super Word
  test('Super Word — start screen is visible', async ({ page }) => {
    await page.goto('/super-word/')
    await expect(page.locator('#start-screen')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Super Word' })).toBeVisible()
  })

  test('Super Word — canvas renders with non-zero dimensions on start', async ({ page }) => {
    await page.goto('/super-word/')
    await page.getByRole('button', { name: /let's go/i }).click()
    const canvas = page.locator('#scene-canvas')
    await expect(canvas).toBeVisible()
    const box = await canvas.boundingBox()
    expect(box?.width).toBeGreaterThan(0)
    expect(box?.height).toBeGreaterThan(0)

    await expect(canvas).toBeInViewport()
  })

  test('Super Word — controller starts, collects a letter, and toggles the menu', async ({ page }) => {
    await installMockGamepad(page)
    await page.goto('/super-word/')

    await tapGamepadButton(page, 0)
    await expect(page.locator('#game-screen')).toBeVisible()

    await expect.poll(async () => page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null
      if (!active?.classList.contains('sr-overlay-btn')) return 0
      return parseFloat(getComputedStyle(active).opacity || '0')
    })).toBeGreaterThan(0)

    await page.waitForTimeout(400)
    await tapGamepadButton(page, 0)
    await expect(page.locator('#letters-count')).toHaveText(/^1\s*\/\s*\d+$/)

    await tapGamepadButton(page, 9)
    await expect(page.locator('#settings-modal')).toBeVisible()
  })

  test('Super Word — controller drops to the nearest tile instead of the first tile', async ({ page }) => {
    await installMockGamepad(page)
    await page.goto('/super-word/')

    await tapGamepadButton(page, 0)
    await expect(page.locator('#game-screen')).toBeVisible()

    for (let collected = 1; collected <= 3; collected++) {
      await page.locator('#scene-a11y .sr-overlay-btn[data-item-type="letter"]').first().click({ force: true })
      await expect(page.locator('#letters-count')).toHaveText(new RegExp(`^${collected}\\s*\\/\\s*\\d+$`))
    }

    await expect.poll(async () => page.evaluate(() =>
      document.querySelectorAll('#letter-slots .letter-tile:not(.pending-flight)').length,
    )).toBe(3)

    const target = await page.evaluate(() => {
      const tiles = Array.from(document.querySelectorAll<HTMLElement>('#letter-slots .letter-tile:not(.pending-flight)'))
      const sceneItems = Array.from(document.querySelectorAll<HTMLElement>('#scene-a11y .sr-overlay-btn'))
      if (tiles.length === 0 || sceneItems.length === 0) return null

      const tileCenters = tiles.map((tile) => ({
        index: parseInt(tile.dataset.index ?? '-1', 10),
        center: tile.getBoundingClientRect().left + tile.getBoundingClientRect().width / 2,
        top: tile.getBoundingClientRect().top + tile.getBoundingClientRect().height / 2,
      }))

      const candidates = sceneItems
        .map((item) => {
          const rect = item.getBoundingClientRect()
          const center = rect.left + rect.width / 2
          const top = rect.top + rect.height / 2

          const nearestTile = tileCenters.reduce((best, candidate) => {
            if (!best) return candidate
            const bestDistance = Math.hypot(best.center - center, best.top - top)
            const candidateDistance = Math.hypot(candidate.center - center, candidate.top - top)
            return candidateDistance < bestDistance ? candidate : best
          }, tileCenters[0])

          const hasLowerSceneItem = sceneItems.some((other) => {
            if (other === item) return false
            const otherRect = other.getBoundingClientRect()
            const otherTop = otherRect.top + otherRect.height / 2
            return otherTop > top + 10
          })

          if (!item.dataset.itemId || hasLowerSceneItem) return null

          return {
            itemId: item.dataset.itemId,
            expectedTileIndex: nearestTile.index,
            center,
            top,
          }
        })
        .filter((candidate): candidate is { itemId: string; expectedTileIndex: number; center: number; top: number } => candidate !== null)
        .sort((a, b) => b.expectedTileIndex - a.expectedTileIndex || b.center - a.center)

      return candidates[0] ?? null
    })

    expect(target).not.toBeNull()
    if (!target) throw new Error('Expected a scene item with a nearest tile target')
    expect(target.expectedTileIndex).toBeGreaterThan(0)

    await page.evaluate(({ itemId }) => {
      const sceneItem = document.querySelector<HTMLElement>(`#scene-a11y .sr-overlay-btn[data-item-id="${itemId}"]`)
      if (!sceneItem) throw new Error('Expected scene item to exist')
      sceneItem.focus()
    }, { itemId: target.itemId })

    await tapGamepadButton(page, 13)

    await expect.poll(async () => page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null
      if (!active?.classList.contains('letter-tile')) return -1
      return parseInt(active.dataset.index ?? '-1', 10)
    })).toBe(target.expectedTileIndex)
  })
})
