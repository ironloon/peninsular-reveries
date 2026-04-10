import { test, expect, type Page } from '@playwright/test';

import { findNearestDirectionalTarget } from '../client/spatial-navigation';

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

async function holdGamepadButton(page: Page, index: number, holdMs: number): Promise<void> {
  await setGamepadButton(page, index, true)
  await page.waitForTimeout(holdMs)
  await setGamepadButton(page, index, false)
  await page.waitForTimeout(260)
}

async function completePixelPassportStop(page: Page): Promise<void> {
  const memoryScreen = page.locator('#memory-screen')

  for (let step = 0; step < 6; step++) {
    if (await memoryScreen.isVisible()) {
      break
    }

    const nextButton = page.locator('#explore-next-btn')
    await expect(nextButton).toBeVisible()
    await expect(nextButton).toBeInViewport()
    await tapGamepadButton(page, 0)
  }

  await expect(memoryScreen).toBeVisible()

  const continueButton = page.locator('#memory-continue-btn')
  await expect(continueButton).toBeVisible()
  await expect(continueButton).toBeInViewport()
  await tapGamepadButton(page, 0)
  await expect(page.locator('#globe-screen')).toBeVisible()
}

async function advanceMissionOrbitSceneToInteraction(page: Page): Promise<void> {
  const continueButton = page.locator('#continue-btn')

  await expect(continueButton).toBeVisible()
  await expect(continueButton).toBeInViewport()
  await tapGamepadButton(page, 0)
  await expect(page.locator('#cinematic-pane')).toHaveAttribute('data-phase', 'cinematic')
  await expect(continueButton).toBeVisible()
  await expect(continueButton).toBeInViewport()
  await tapGamepadButton(page, 0)

  const actionButton = page.locator('#tap-btn')
  await expect(actionButton).toBeVisible()
  await expect(actionButton).toBeInViewport()
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

    await expect.poll(async () => page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('.destination-marker')).filter((marker) => {
        const rect = marker.getBoundingClientRect()
        return rect.bottom > 0
          && rect.right > 0
          && rect.top < window.innerHeight
          && rect.left < window.innerWidth
      }).length,
    )).toBeGreaterThan(0)
  })

  test('Pixel Passport — controller revisits the current place, takes a new trip, and clears memories on restart', async ({ page }) => {
    await installMockGamepad(page)
    await page.goto('/pixel-passport/')

    await expect(page.locator('#start-screen')).toBeVisible()
    await expect(page.locator('#start-explore-btn')).toBeInViewport()

    await tapGamepadButton(page, 0)
    await expect(page.locator('#globe-screen')).toBeVisible()
    await expect(page.locator('#globe-room-btn')).toBeInViewport()

    const selectedMarker = page.locator('#globe-screen .destination-marker.is-selected')
    await expect(selectedMarker).toBeVisible()
    await expect(selectedMarker).toHaveAttribute('data-destination-id', 'paris')

    await tapGamepadButton(page, 15)
    await expect(selectedMarker).toBeVisible()
    await expect(page.locator('#globe-room-btn')).toBeInViewport()
    await expect(selectedMarker).toHaveAttribute('data-destination-id', 'cairo')

    await tapGamepadButton(page, 14)
    await expect(selectedMarker).toBeVisible()
    await expect(page.locator('#globe-room-btn')).toBeInViewport()
    await expect(selectedMarker).toHaveAttribute('data-destination-id', 'paris')

    await tapGamepadButton(page, 0)
    await expect(page.locator('#travel-screen')).toBeVisible()
    await expect(page.locator('#travel-stage')).toBeInViewport()
    await expect(page.locator('#travel-to')).toHaveText('Paris')
    await expect(page.locator('#explore-screen')).toBeVisible({ timeout: 6000 })
    await expect(page.locator('#explore-next-btn')).toBeVisible()
    await expect(page.locator('#explore-next-btn')).toBeInViewport()

    await completePixelPassportStop(page)

    const currentMarker = page.locator('#globe-screen .destination-marker[aria-current="location"]')
    await expect(currentMarker).toBeVisible()
    await expect(page.locator('#globe-room-btn')).toBeInViewport()
    await expect(currentMarker).toHaveAttribute('data-destination-id', 'paris')
    await expect(page.locator('#globe-memory-pill')).toHaveText('1 memory')

    await tapGamepadButton(page, 0)
    await expect(page.locator('#explore-screen')).toBeVisible()
    await expect(page.locator('#explore-next-btn')).toBeVisible()
    await expect(page.locator('#explore-next-btn')).toBeInViewport()
    await expect(page.locator('#travel-screen')).toBeHidden()
    await expect(page.locator('#explore-heading')).toContainText('Paris')

    await completePixelPassportStop(page)
    await expect(currentMarker).toHaveAttribute('data-destination-id', 'paris')

    await tapGamepadButton(page, 15)
    await expect(selectedMarker).toBeVisible()
    await expect(page.locator('#globe-room-btn')).toBeInViewport()
    await expect(selectedMarker).toHaveAttribute('data-destination-id', 'cairo')

    await tapGamepadButton(page, 0)
    await expect(page.locator('#travel-screen')).toBeVisible()
    await expect(page.locator('#travel-stage')).toBeInViewport()
    await expect(page.locator('#travel-to')).toHaveText('Cairo')
    await expect(page.locator('#explore-screen')).toBeVisible({ timeout: 6000 })
    await expect(page.locator('#explore-next-btn')).toBeVisible()
    await expect(page.locator('#explore-next-btn')).toBeInViewport()

    await completePixelPassportStop(page)
    await expect(currentMarker).toHaveAttribute('data-destination-id', 'cairo')
    await expect(page.locator('#globe-memory-pill')).toHaveText('2 memories')

    await tapGamepadButton(page, 9)
    await expect(page.locator('#settings-modal')).toBeVisible()
    await expect(page.locator('#restart-btn')).toBeVisible()
    await expect(page.locator('#restart-btn')).toBeInViewport()

    await page.locator('#restart-btn').click()
    await expect(page.locator('#start-screen')).toBeVisible()
    await expect(page.locator('#title-memory-count')).toBeVisible()
    await expect(page.locator('#title-memory-count')).toHaveText('0 memories')
    await expect(page.locator('#start-explore-btn')).toBeInViewport()
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

  test('Mission Orbit — controller completes tap and hold scenes and opens the menu', async ({ page }) => {
    await installMockGamepad(page)
    await page.goto('/mission-orbit/')

    await expect(page.locator('#start-screen')).toBeVisible()
    await expect(page.locator('#start-btn')).toBeInViewport()

    await tapGamepadButton(page, 0)
    await expect(page.locator('#game-screen')).toBeVisible()
    await expect(page.locator('#continue-btn')).toBeVisible()
    await expect(page.locator('#continue-btn')).toBeInViewport()

    await advanceMissionOrbitSceneToInteraction(page)

    const actionButton = page.locator('#tap-btn')
    await expect(actionButton).toHaveAttribute('data-controller-hint', 'Press A')
    await expect(page.locator('#tap-count-display')).toBeVisible()
    await expect(page.locator('#tap-count-display')).toBeInViewport()

    await tapGamepadButton(page, 0)
    await expect(page.locator('#tap-count-display')).toHaveText(/^1\s*\/\s*20$/)

    for (let tapCount = 1; tapCount < 20; tapCount++) {
      await tapGamepadButton(page, 0)
    }

    await expect(page.locator('#scene-progress-label')).toHaveText('Scene 2 of 8', { timeout: 5000 })
    await expect(page.locator('#continue-btn')).toBeVisible()
    await expect(page.locator('#continue-btn')).toBeInViewport()

    await advanceMissionOrbitSceneToInteraction(page)

    await expect(actionButton).toHaveAttribute('data-controller-hint', 'Hold A')
    await expect(page.locator('#hold-progress')).toBeVisible()
    await expect(page.locator('#hold-progress')).toBeInViewport()

    await setGamepadButton(page, 0, true)
    await expect.poll(async () => page.evaluate(() => {
      const bar = document.getElementById('hold-progress-bar') as HTMLElement | null
      return parseFloat(bar?.style.width ?? '0')
    })).toBeGreaterThan(0)
    await holdGamepadButton(page, 0, 3400)

    await expect(page.locator('#scene-progress-label')).toHaveText('Scene 3 of 8', { timeout: 5000 })
    await expect(page.locator('#continue-btn')).toBeVisible()
    await expect(page.locator('#continue-btn')).toBeInViewport()

    await tapGamepadButton(page, 9)
    await expect(page.locator('#settings-modal')).toBeVisible()
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

  test('Super Word — controller drops to the scorer-selected downward tile', async ({ page }) => {
    await installMockGamepad(page)
    await page.goto('/super-word/')

    await tapGamepadButton(page, 0)
    await expect(page.locator('#game-screen')).toBeVisible()

    for (let collected = 1; collected <= 3; collected++) {
        const availableLetters = page.locator('#scene-a11y .sr-overlay-btn[data-item-type="letter"]')
        await expect(availableLetters.first()).toBeVisible()
        await availableLetters.first().click()
      await expect(page.locator('#letters-count')).toHaveText(new RegExp(`^${collected}\\s*\\/\\s*\\d+$`))
    }

    await expect.poll(async () => page.evaluate(() =>
      document.querySelectorAll('#letter-slots .letter-tile:not(.pending-flight)').length,
    )).toBe(3)

    const geometry = await page.evaluate(() => {
      const tiles = Array.from(document.querySelectorAll<HTMLElement>('#letter-slots .letter-tile:not(.pending-flight)'))
      const sceneItems = Array.from(document.querySelectorAll<HTMLElement>('#scene-a11y .sr-overlay-btn'))
      if (tiles.length === 0 || sceneItems.length === 0) return null

      const tileCenters = tiles.map((tile) => ({
        index: parseInt(tile.dataset.index ?? '-1', 10),
        x: tile.getBoundingClientRect().left + tile.getBoundingClientRect().width / 2,
        y: tile.getBoundingClientRect().top + tile.getBoundingClientRect().height / 2,
      }))

      const candidates = sceneItems
        .map((item) => {
          const rect = item.getBoundingClientRect()
          const x = rect.left + rect.width / 2
          const y = rect.top + rect.height / 2

          const hasLowerSceneItem = sceneItems.some((other) => {
            if (other === item) return false
            const otherRect = other.getBoundingClientRect()
            const otherY = otherRect.top + otherRect.height / 2
            return otherY > y + 10
          })

          if (!item.dataset.itemId || hasLowerSceneItem) return null

          return {
            itemId: item.dataset.itemId,
            x,
            y,
          }
        })
        .filter((candidate): candidate is { itemId: string; x: number; y: number } => candidate !== null)

      return { tiles: tileCenters, candidates }
    })

    expect(geometry).not.toBeNull()
    if (!geometry) throw new Error('Expected scene and tile geometry to exist')

    const target = geometry.candidates
      .map((candidate) => ({
        itemId: candidate.itemId,
        expectedTileIndex: findNearestDirectionalTarget(candidate, geometry.tiles, 'ArrowDown')?.index ?? -1,
        x: candidate.x,
      }))
      .filter((candidate) => candidate.expectedTileIndex >= 0)
      .sort((a, b) => b.expectedTileIndex - a.expectedTileIndex || b.x - a.x)[0] ?? null

    expect(target).not.toBeNull()
    if (!target) throw new Error('Expected a scene item with a nearest tile target')

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

  test('Super Word — controller keeps left and right within the collected letter row', async ({ page }) => {
    await installMockGamepad(page)
    await page.goto('/super-word/')

    await tapGamepadButton(page, 0)
    await expect(page.locator('#game-screen')).toBeVisible()

    for (let collected = 1; collected <= 3; collected++) {
      const availableLetters = page.locator('#scene-a11y .sr-overlay-btn[data-item-type="letter"]')
      await expect(availableLetters.first()).toBeVisible()
      await availableLetters.first().click()
      await expect(page.locator('#letters-count')).toHaveText(new RegExp(`^${collected}\\s*\\/\\s*\\d+$`))
    }

    await expect.poll(async () => page.evaluate(() =>
      document.querySelectorAll('#letter-slots .letter-tile:not(.pending-flight)').length,
    )).toBe(3)

    await page.evaluate(() => {
      document.body.classList.add('gamepad-active')
      const tile = document.querySelector<HTMLElement>('#letter-slots .letter-tile[data-index="1"]')
      if (!tile) throw new Error('Expected middle tile to exist')
      tile.focus()
    })

    await tapGamepadButton(page, 0)

    await expect.poll(async () => page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null
      if (!active?.classList.contains('letter-tile')) return -1
      return parseInt(active.dataset.index ?? '-1', 10)
    })).toBe(1)

    await tapGamepadButton(page, 15)

    await expect.poll(async () => page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null
      if (!active?.classList.contains('letter-tile')) return -1
      return parseInt(active.dataset.index ?? '-1', 10)
    })).toBe(2)

    await tapGamepadButton(page, 14)

    await expect.poll(async () => page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null
      if (!active?.classList.contains('letter-tile')) return -1
      return parseInt(active.dataset.index ?? '-1', 10)
    })).toBe(1)
  })

  test('Super Word — controller keeps the source tile selected until a different tile is activated', async ({ page }) => {
    await installMockGamepad(page)
    await page.goto('/super-word/')

    await tapGamepadButton(page, 0)
    await expect(page.locator('#game-screen')).toBeVisible()

    for (let collected = 1; collected <= 3; collected++) {
      const availableLetters = page.locator('#scene-a11y .sr-overlay-btn[data-item-type="letter"]')
      await expect(availableLetters.first()).toBeVisible()
      await availableLetters.first().click()
      await expect(page.locator('#letters-count')).toHaveText(new RegExp(`^${collected}\\s*\\/\\s*\\d+$`))
    }

    await expect.poll(async () => page.evaluate(() =>
      document.querySelectorAll('#letter-slots .letter-tile:not(.pending-flight)').length,
    )).toBe(3)

    const beforeSwap = await page.evaluate(() => {
      const source = document.querySelector<HTMLElement>('#letter-slots .letter-tile[data-index="1"]')
      const destination = document.querySelector<HTMLElement>('#letter-slots .letter-tile[data-index="2"]')
      if (!source || !destination) throw new Error('Expected source and destination tiles to exist')

      document.body.classList.add('gamepad-active')
      source.focus()

      return {
        sourceText: source.textContent?.trim() ?? '',
        destinationText: destination.textContent?.trim() ?? '',
      }
    })

    await tapGamepadButton(page, 0)

    await expect.poll(async () => page.evaluate(() =>
      document.querySelector<HTMLElement>('#letter-slots .letter-tile.selected')?.dataset.index ?? null,
    )).toBe('1')

    await tapGamepadButton(page, 0)

    await expect.poll(async () => page.evaluate(() =>
      document.querySelector<HTMLElement>('#letter-slots .letter-tile.selected')?.dataset.index ?? null,
    )).toBe('1')

    await tapGamepadButton(page, 15)

    await expect.poll(async () => page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null
      if (!active?.classList.contains('letter-tile')) return -1
      return parseInt(active.dataset.index ?? '-1', 10)
    })).toBe(2)

    await tapGamepadButton(page, 0)

    await expect.poll(async () => page.evaluate(() =>
      document.querySelectorAll('#letter-slots .letter-tile.selected').length,
    )).toBe(0)

    await expect(page.locator('#letter-slots .letter-tile').nth(1)).toContainText(beforeSwap.destinationText)
    await expect(page.locator('#letter-slots .letter-tile').nth(2)).toContainText(beforeSwap.sourceText)
  })
})
