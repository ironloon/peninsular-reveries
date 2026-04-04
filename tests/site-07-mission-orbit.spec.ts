import { expect, test } from '@playwright/test'

test.describe('SITE-07: Mission Orbit', () => {
  test('homepage exposes the Mission: Orbit card', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href*="mission-orbit"]').first()).toBeVisible()
  })

  test('mission page loads and starts from the countdown screen', async ({ page }) => {
    await page.goto('/mission-orbit/')

    await expect(page.getByRole('heading', { name: 'Mission: Orbit' })).toBeVisible()
    await page.getByRole('button', { name: 'Begin countdown' }).click()

    await expect(page.locator('#mission-screen')).toHaveClass(/active/)
    await expect(page.locator('#mission-phase-label')).toContainText('Final countdown')
    await expect(page.locator('#mission-action-btn')).toBeDisabled()
    await expect(page.locator('#game-status')).toBeAttached()
    await expect(page.locator('#phase-description')).toBeAttached()
  })

  test('settings modal opens and exposes the audio toggle', async ({ page }) => {
    await page.goto('/mission-orbit/')

    await page.getByRole('button', { name: 'Mission settings' }).click()
    await expect(page.locator('#settings-modal')).toBeVisible()
    await expect(page.getByLabel('Space ambience')).toBeVisible()

    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.locator('#settings-modal')).toBeHidden()
  })

  test('spacecraft hit area can drive the launch phase directly', async ({ page }) => {
    await page.goto('/mission-orbit/')

    await page.getByRole('button', { name: 'Begin countdown' }).click()
    await expect(page.locator('#mission-screen')).toHaveClass(/active/)
    await page.waitForFunction(() => document.getElementById('mission-phase-label')?.textContent?.includes('Ascent to orbit'))

    const hitArea = page.locator('#mission-rocket-hit-area')
    await hitArea.dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch', isPrimary: true })
    await page.waitForTimeout(2100)
    await hitArea.dispatchEvent('pointerup', { pointerId: 1, pointerType: 'touch', isPrimary: true })

    await expect(page.locator('#mission-outcome')).toContainText('Main engine cutoff')
    await page.waitForFunction(() => document.getElementById('mission-phase-label')?.textContent?.includes('Orbit raise burn'))
  })

  test('narrow mobile layout keeps the mission controls reachable', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 740 })
    await page.goto('/mission-orbit/')

    await page.getByRole('button', { name: 'Begin countdown' }).click()
    await expect(page.locator('#mission-screen')).toHaveClass(/active/)

    const widths = await page.evaluate(() => ({
      windowWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }))

    expect(widths.documentWidth).toBeLessThanOrEqual(widths.windowWidth + 1)
    expect(widths.bodyWidth).toBeLessThanOrEqual(widths.windowWidth + 1)

    await page.locator('.mission-toolbar').scrollIntoViewIfNeeded()
    await expect(page.locator('.mission-stage-shell')).toBeVisible()
    await expect(page.locator('.mission-toolbar')).toBeVisible()
    await expect(page.locator('#mission-stage-target')).toContainText(/spacecraft|clock/i)
  })
})