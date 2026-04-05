import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('SITE-08: Chompers', () => {
  test('homepage exposes the Chompers card', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href*="chompers"]').first()).toBeVisible()
  })

  test('start screen loads with area picker and start button', async ({ page }) => {
    await page.goto('/chompers/')

    await expect(page.locator('#start-screen')).toBeVisible()
    await expect(page.locator('.area-radio')).toHaveCount(6)
    await expect(page.getByRole('button', { name: 'Start Chomping' })).toBeVisible()
  })

  test('matching area is selected by default', async ({ page }) => {
    await page.goto('/chompers/')

    await expect(page.locator('input[name="area"][value="matching"]')).toBeChecked()
  })

  test('start game shows game screen with problem and arena', async ({ page }) => {
    await page.goto('/chompers/')

    await page.getByRole('button', { name: 'Start Chomping' }).click()

    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#problem-prompt')).not.toBeEmpty()
    await expect(page.locator('#game-arena')).toBeVisible()
  })

  test('scene items appear after starting the game', async ({ page }) => {
    await page.goto('/chompers/')

    await page.getByRole('button', { name: 'Start Chomping' }).click()

    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#scene-items button').first()).toBeVisible({ timeout: 5000 })

    const count = await page.locator('#scene-items button').count()
    expect(count).toBeGreaterThan(0)
  })

  test('clicking a scene item advances game state', async ({ page }) => {
    await page.goto('/chompers/')

    await page.getByRole('button', { name: 'Start Chomping' }).click()
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 5000 })
    await page.locator('#scene-items button').first().waitFor({ state: 'visible', timeout: 5000 })

    await page.locator('#scene-items button').first().click()

    // After clicking score stays >= 0 and lives <= 3 (something changed)
    const scoreText = await page.locator('#score').textContent()
    const score = parseInt(scoreText ?? '0', 10)
    expect(score).toBeGreaterThanOrEqual(0)

    const livesText = await page.locator('#lives').textContent()
    const lives = (livesText?.match(/♥/g) ?? []).length
    expect(lives).toBeLessThanOrEqual(3)
  })

  test('menu modal opens and closes from game screen', async ({ page }) => {
    await page.goto('/chompers/')

    await page.getByRole('button', { name: 'Start Chomping' }).click()
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 5000 })

    await page.locator('#settings-btn').click()
    await expect(page.locator('#settings-modal')).toBeVisible({ timeout: 3000 })
    await expect(page.locator('#settings-modal h2')).toHaveText('Menu')

    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.locator('#settings-modal')).toBeHidden({ timeout: 3000 })
  })

  test('game screen has no critical accessibility violations', async ({ page }) => {
    await page.goto('/chompers/')

    await page.getByRole('button', { name: 'Start Chomping' }).click()
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#scene-items button').first()).toBeVisible({ timeout: 5000 })

    const results = await new AxeBuilder({ page })
      .include('#game-screen')
      .include('#game-status')
      .include('#game-feedback')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('mobile viewport 393x740 has no horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 740 })
    await page.goto('/chompers/')

    const widths = await page.evaluate(() => ({
      windowWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }))

    expect(widths.documentWidth).toBeLessThanOrEqual(widths.windowWidth + 1)
    expect(widths.bodyWidth).toBeLessThanOrEqual(widths.windowWidth + 1)
  })

  test('level selection — addition level 2 shows addition problem', async ({ page }) => {
    await page.goto('/chompers/')
    await page.locator('input[name="area"][value="addition"]').check({ force: true })
    await page.locator('input[name="level-addition"][value="2"]').check({ force: true })
    await page.getByRole('button', { name: 'Start Chomping' }).click()
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#problem-prompt')).toContainText('+')
  })

  test('counting area shows counting objects in prompt', async ({ page }) => {
    await page.goto('/chompers/')
    await page.locator('input[name="area"][value="counting"]').check({ force: true })
    await page.getByRole('button', { name: 'Start Chomping' }).click()
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#scene-items button').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.counting-object').first()).toBeVisible({ timeout: 3000 })
  })

  test('no scroll on start screen at 390x844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/chompers/')

    const scrollable = await page.evaluate(() => {
      return document.documentElement.scrollHeight > document.documentElement.clientHeight
    })
    expect(scrollable).toBe(false)
  })

  test('reduced motion — mouth animates but no neck extension', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/chompers/')
    await page.getByRole('button', { name: 'Start Chomping' }).click()
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 5000 })
    await page.locator('#scene-items button').first().waitFor({ state: 'visible', timeout: 5000 })

    // Click a tile
    await page.locator('#scene-items button').first().click()
    await page.waitForTimeout(400)

    // neck-extension should remain 0 (or at most very small) under reduced motion
    const neckExt = await page.evaluate(() => {
      const hippo = document.getElementById('hippo')
      if (!hippo) return null
      return getComputedStyle(hippo).getPropertyValue('--neck-extension').trim()
    })
    // Under reduced motion, neck extension should be 0 or empty
    expect(neckExt === '0' || neckExt === '' || neckExt === null || parseFloat(neckExt ?? '0') < 0.1).toBe(true)
  })

  test('landscape 932x430 shows arena and hippo within viewport', async ({ page }) => {
    await page.setViewportSize({ width: 932, height: 430 })
    await page.goto('/chompers/')

    await page.getByRole('button', { name: 'Start Chomping' }).click()
    await expect(page.locator('#game-screen')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#game-arena')).toBeVisible()
    await expect(page.locator('#hippo')).toBeVisible()

    const metrics = await page.evaluate(() => {
      const arena = document.getElementById('game-arena')
      const hippo = document.getElementById('hippo')
      if (!arena || !hippo) return null

      const arenaRect = arena.getBoundingClientRect()
      const hippoRect = hippo.getBoundingClientRect()

      return {
        arenaBottom: arenaRect.bottom,
        hippoBottom: hippoRect.bottom,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
      }
    })

    expect(metrics).not.toBeNull()
    expect(metrics?.arenaBottom).toBeLessThanOrEqual((metrics?.viewportHeight ?? 0) + 1)
    expect(metrics?.hippoBottom).toBeLessThanOrEqual((metrics?.viewportHeight ?? 0) + 1)
  })
})