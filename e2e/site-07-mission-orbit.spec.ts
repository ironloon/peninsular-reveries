import { expect, test } from '@playwright/test'

test.describe('SITE-07: Mission Orbit', () => {
  test('homepage exposes the Mission: Orbit card', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href*="mission-orbit"]').first()).toBeVisible()
  })

  test('mission page loads on the start screen', async ({ page }) => {
    await page.goto('/mission-orbit/')

    await expect(page.getByRole('heading', { name: 'Mission: Orbit' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Artemis II crew' })).toBeVisible()
    // Start screen shows 4 crew cards
    await expect(page.locator('#start-screen .crew-option-static')).toHaveCount(4)
    await expect(page.getByRole('button', { name: 'Begin Mission' })).toBeVisible()
  })

  test('settings modal opens and exposes controls', async ({ page }) => {
    await page.goto('/mission-orbit/')

    await page.getByRole('button', { name: 'Menu' }).click()
    await expect(page.locator('#settings-modal')).toBeVisible()
    await expect(page.getByLabel('Reduce motion')).toBeVisible()
    await expect(page.getByText(/View full credits/)).toBeVisible()

    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.locator('#settings-modal')).toBeHidden()
  })

  test('Begin Mission transitions to game screen', async ({ page }) => {
    await page.goto('/mission-orbit/')

    await page.getByRole('button', { name: 'Begin Mission' }).click()

    await expect(page.locator('#game-screen')).toHaveClass(/active/)
    await expect(page.locator('#cinematic-pane')).toBeAttached()
    await expect(page.locator('#narrative-pane')).toBeVisible()
    await expect(page.locator('#scene-progress-label')).toBeAttached()
  })

  test('tap button is present and responds to taps in game screen', async ({ page }) => {
    test.slow()
    await page.goto('/mission-orbit/')

    await page.getByRole('button', { name: 'Begin Mission' }).click()
    await expect(page.locator('#game-screen')).toHaveClass(/active/)

    // Wait for interaction phase — tap-btn becomes visible
    await page.waitForFunction(
      () => {
        const btn = document.getElementById('tap-btn')
        return btn && !btn.hasAttribute('hidden')
      },
      { timeout: 8000 }
    )
    await expect(page.locator('#tap-btn')).toBeVisible()
    await page.locator('#tap-btn').click()
    // tap-count-display shows progress
    await expect(page.locator('#tap-count-display')).toBeAttached()
  })

  test('narrow mobile layout keeps mission controls reachable', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 844 })
    await page.goto('/mission-orbit/')

    await page.getByRole('button', { name: 'Begin Mission' }).click()
    await expect(page.locator('#game-screen')).toHaveClass(/active/)

    const widths = await page.evaluate(() => ({
      windowWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
    }))

    expect(widths.documentWidth).toBeLessThanOrEqual(widths.windowWidth + 1)
    await expect(page.locator('#cinematic-pane')).toBeVisible()
    await expect(page.locator('#narrative-pane')).toBeVisible()
  })

  test('settings Quit link navigates home', async ({ page }) => {
    await page.goto('/mission-orbit/')

    await page.getByRole('button', { name: 'Menu' }).click()
    await expect(page.locator('#settings-modal')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Quit' })).toBeVisible()
  })

  test('start screen shows the fixed Artemis II roster', async ({ page }) => {
    await page.goto('/mission-orbit/')

    const startScreen = page.locator('#start-screen')
    await expect(startScreen.locator('.crew-option-static')).toHaveCount(4)
    await expect(startScreen.getByText('Reid Wiseman', { exact: true })).toBeVisible()
    await expect(startScreen.getByText('Victor Glover', { exact: true })).toBeVisible()
    await expect(startScreen.getByText('Christina Koch', { exact: true })).toBeVisible()
    await expect(startScreen.getByText('Jeremy Hansen', { exact: true })).toBeVisible()
  })
})

