import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('SITE-09: Pixel Passport', () => {
  test('homepage exposes the Pixel Passport card', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href*="pixel-passport"]').first()).toBeVisible()
  })

  test('game page loads with explore and mystery start options', async ({ page }) => {
    await page.goto('/pixel-passport/')

    await expect(page.getByRole('heading', { name: 'Pixel Passport' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Explore!/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Mystery!/i })).toBeVisible()
  })

  test('explore mode travels to Paris and saves a room memory', async ({ page }) => {
    await page.goto('/pixel-passport/')
    await page.getByRole('button', { name: /Explore!/i }).click()

    await expect(page.locator('#globe-screen')).toHaveClass(/active/)
    await page.getByRole('button', { name: 'Paris' }).click()

    await expect(page.locator('#travel-screen')).toHaveClass(/active/)
    await expect(page.locator('#explore-screen')).toHaveClass(/active/, { timeout: 8000 })
    await expect(page.locator('#explore-heading')).toContainText('Paris, France')

    await page.getByRole('button', { name: /Next fact/i }).click()
    await page.getByRole('button', { name: /Next fact/i }).click()
    await page.getByRole('button', { name: /Find memory/i }).click()

    await expect(page.locator('#memory-screen')).toHaveClass(/active/)
    await expect(page.locator('#memory-copy')).toContainText('beret')
    await page.getByRole('button', { name: /Back to globe/i }).click()

    await expect(page.locator('#globe-screen')).toHaveClass(/active/)
    await page.getByRole('button', { name: /Room/i }).click()
    await expect(page.locator('#room-screen')).toHaveClass(/active/)
    await expect(page.locator('[data-memory-slot="paris"]')).toHaveClass(/is-filled/)
  })

  test('mystery mode advances after a wrong guess and then travels on a correct guess', async ({ page }) => {
    await page.goto('/pixel-passport/')
    await page.getByRole('button', { name: /Mystery!/i }).click()

    await expect(page.locator('#mystery-screen')).toHaveClass(/active/)
    await expect(page.locator('#mystery-clue-text')).toContainText('iron tower')

    await page.getByRole('button', { name: 'Cairo' }).click()
    await expect(page.locator('#mystery-result-screen')).toHaveClass(/active/)
    await expect(page.locator('#mystery-result-heading')).toContainText('Not yet')
    await page.getByRole('button', { name: /Next clue/i }).click()

    await expect(page.locator('#mystery-screen')).toHaveClass(/active/)
    await expect(page.locator('#mystery-clue-text')).toContainText('bonjour')

    await page.getByRole('button', { name: 'Paris' }).click()
    await expect(page.locator('#mystery-result-heading')).toContainText('You got it')
    await page.getByRole('button', { name: /Ride there/i }).click()

    await expect(page.locator('#travel-screen')).toHaveClass(/active/)
    await expect(page.locator('#explore-screen')).toHaveClass(/active/, { timeout: 8000 })
    await expect(page.locator('#explore-heading')).toContainText('Paris, France')
  })

  test('settings modal opens from the title screen', async ({ page }) => {
    await page.goto('/pixel-passport/')

    await page.getByRole('button', { name: 'Menu' }).click()
    await expect(page.locator('#settings-modal')).toBeVisible()
    await expect(page.getByLabel('Music')).toBeVisible()
    await expect(page.getByLabel('Reduce motion')).toBeVisible()

    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.locator('#settings-modal')).toBeHidden()
  })

  test('globe screen has no critical accessibility violations', async ({ page }) => {
    await page.goto('/pixel-passport/')
    await page.getByRole('button', { name: /Explore!/i }).click()

    const results = await new AxeBuilder({ page })
      .include('#globe-screen')
      .include('#game-status')
      .include('#game-feedback')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('short landscape layout keeps core Pixel Passport screens inside the viewport', async ({ page }) => {
    const viewportSlack = 2

    await page.setViewportSize({ width: 844, height: 390 })
    await page.goto('/pixel-passport/')

    const titleMetrics = await page.evaluate(() => {
      const titlePanel = document.querySelector('#start-screen .passport-panel')
      const startButton = document.getElementById('start-explore-btn')
      if (!(titlePanel instanceof HTMLElement) || !(startButton instanceof HTMLElement)) {
        return null
      }

      return {
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        documentHeight: document.documentElement.scrollHeight,
        panelBottom: titlePanel.getBoundingClientRect().bottom,
        startBottom: startButton.getBoundingClientRect().bottom,
      }
    })

    expect(titleMetrics).not.toBeNull()
    expect(titleMetrics?.documentWidth).toBeLessThanOrEqual((titleMetrics?.windowWidth ?? 0) + viewportSlack)
    expect(titleMetrics?.documentHeight).toBeLessThanOrEqual((titleMetrics?.windowHeight ?? 0) + viewportSlack)
    expect(titleMetrics?.panelBottom).toBeLessThanOrEqual((titleMetrics?.windowHeight ?? 0) + viewportSlack)
    expect(titleMetrics?.startBottom).toBeLessThanOrEqual((titleMetrics?.windowHeight ?? 0) + viewportSlack)

    await page.getByRole('button', { name: /Explore!/i }).click()

    await expect(page.locator('#globe-screen')).toHaveClass(/active/)
    await expect(page.getByRole('button', { name: /Room/i })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Paris' })).toBeVisible()

    const globeMetrics = await page.evaluate(() => {
      const panel = document.querySelector('#globe-screen .passport-panel')
      const roomButton = document.getElementById('globe-room-btn')
      if (!(panel instanceof HTMLElement) || !(roomButton instanceof HTMLElement)) {
        return null
      }

      return {
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        documentHeight: document.documentElement.scrollHeight,
        panelBottom: panel.getBoundingClientRect().bottom,
        roomBottom: roomButton.getBoundingClientRect().bottom,
      }
    })

    expect(globeMetrics).not.toBeNull()
    expect(globeMetrics?.documentWidth).toBeLessThanOrEqual((globeMetrics?.windowWidth ?? 0) + viewportSlack)
    expect(globeMetrics?.documentHeight).toBeLessThanOrEqual((globeMetrics?.windowHeight ?? 0) + viewportSlack)
    expect(globeMetrics?.panelBottom).toBeLessThanOrEqual((globeMetrics?.windowHeight ?? 0) + viewportSlack)
    expect(globeMetrics?.roomBottom).toBeLessThanOrEqual((globeMetrics?.windowHeight ?? 0) + viewportSlack)

    await page.getByRole('button', { name: /Room/i }).click()
    await expect(page.locator('#room-screen')).toHaveClass(/active/)
    await expect(page.getByRole('button', { name: /Back to globe/i })).toBeVisible()

    const roomMetrics = await page.evaluate(() => {
      const panel = document.querySelector('#room-screen .passport-panel')
      const backButton = document.getElementById('room-back-btn')
      const shelf = document.querySelector('#room-screen .room-shelf-grid')
      if (!(panel instanceof HTMLElement) || !(backButton instanceof HTMLElement) || !(shelf instanceof HTMLElement)) {
        return null
      }

      return {
        windowHeight: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight,
        panelBottom: panel.getBoundingClientRect().bottom,
        backBottom: backButton.getBoundingClientRect().bottom,
        shelfBottom: shelf.getBoundingClientRect().bottom,
      }
    })

    expect(roomMetrics).not.toBeNull()
    expect(roomMetrics?.documentHeight).toBeLessThanOrEqual((roomMetrics?.windowHeight ?? 0) + viewportSlack)
    expect(roomMetrics?.panelBottom).toBeLessThanOrEqual((roomMetrics?.windowHeight ?? 0) + viewportSlack)
    expect(roomMetrics?.backBottom).toBeLessThanOrEqual((roomMetrics?.windowHeight ?? 0) + viewportSlack)
    expect(roomMetrics?.shelfBottom).toBeLessThanOrEqual((roomMetrics?.windowHeight ?? 0) + viewportSlack)

    await page.getByRole('button', { name: /Back to globe/i }).click()
    await page.getByRole('button', { name: 'Paris' }).click()
    await expect(page.locator('#explore-screen')).toHaveClass(/active/, { timeout: 8000 })
    await expect(page.getByRole('button', { name: /Next fact/i })).toBeVisible()

    const exploreMetrics = await page.evaluate(() => {
      const panel = document.querySelector('#explore-screen .passport-panel')
      const nextButton = document.getElementById('explore-next-btn')
      if (!(panel instanceof HTMLElement) || !(nextButton instanceof HTMLElement)) {
        return null
      }

      return {
        windowHeight: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight,
        panelBottom: panel.getBoundingClientRect().bottom,
        nextBottom: nextButton.getBoundingClientRect().bottom,
      }
    })

    expect(exploreMetrics).not.toBeNull()
    expect(exploreMetrics?.documentHeight).toBeLessThanOrEqual((exploreMetrics?.windowHeight ?? 0) + viewportSlack)
    expect(exploreMetrics?.panelBottom).toBeLessThanOrEqual((exploreMetrics?.windowHeight ?? 0) + viewportSlack)
    expect(exploreMetrics?.nextBottom).toBeLessThanOrEqual((exploreMetrics?.windowHeight ?? 0) + viewportSlack)
  })

  test('travel stage exposes layered motion during a ride', async ({ page }) => {
    await page.goto('/pixel-passport/')
    await page.getByRole('button', { name: /Explore!/i }).click()
    await page.getByRole('button', { name: 'Tokyo' }).click()

    await expect(page.locator('#travel-screen')).toHaveClass(/active/)

    const initial = await page.evaluate(() => {
      const stage = document.getElementById('travel-stage')
      const background = document.getElementById('travel-background')
      const shadow = document.getElementById('travel-vehicle-shadow')
      if (!(stage instanceof HTMLElement) || !(background instanceof HTMLElement) || !(shadow instanceof HTMLElement)) {
        return null
      }

      return {
        layerCount: stage.querySelectorAll('.travel-layer').length,
        progress: Number.parseFloat(getComputedStyle(stage).getPropertyValue('--travel-eased-progress')),
        backgroundTransform: getComputedStyle(background).transform,
        shadowOpacity: Number.parseFloat(getComputedStyle(shadow).opacity),
      }
    })

    expect(initial).not.toBeNull()
    expect(initial?.layerCount).toBe(3)
    expect(initial?.shadowOpacity).toBeGreaterThan(0)

    await page.waitForTimeout(450)

    const midRide = await page.evaluate(() => {
      const stage = document.getElementById('travel-stage')
      const vehicle = document.getElementById('travel-vehicle')
      const shadow = document.getElementById('travel-vehicle-shadow')
      if (!(stage instanceof HTMLElement) || !(vehicle instanceof HTMLElement) || !(shadow instanceof HTMLElement)) {
        return null
      }

      return {
        progress: Number.parseFloat(getComputedStyle(stage).getPropertyValue('--travel-eased-progress')),
        vehicleTransform: getComputedStyle(vehicle).transform,
        shadowTransform: getComputedStyle(shadow).transform,
      }
    })

    expect(midRide).not.toBeNull()
    expect(midRide?.progress).toBeGreaterThan(initial?.progress ?? 0)
    expect(midRide?.vehicleTransform).not.toBe('none')
    expect(midRide?.shadowTransform).not.toBe('none')
  })
})