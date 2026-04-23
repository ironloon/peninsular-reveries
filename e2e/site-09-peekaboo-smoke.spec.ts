import { test, expect, type Page } from '@playwright/test'

async function startPeekaboo(page: Page): Promise<void> {
  await page.goto('/peekaboo/')
  await expect(page.locator('#peekaboo-meet-screen.active')).toBeVisible()
}

/** Click the proceed button in whatever screen is currently active */
async function clickProceed(page: Page): Promise<void> {
  const activeProceedBtn = page.locator('.screen.active .peekaboo-proceed-btn')
  await expect(activeProceedBtn).toBeVisible()
  await activeProceedBtn.click()
}

test.describe('SITE-09: Peekaboo smoke tests', () => {
  test('Peekaboo — meet screen is visible', async ({ page }) => {
    await page.goto('/peekaboo/')
    await expect(page.locator('#peekaboo-meet-screen.active')).toBeVisible()
    await expect(page.locator('#peekaboo-meet-heading')).toBeVisible()
  })

  test('Peekaboo — clicking Ready advances to enter screen', async ({ page }) => {
    await startPeekaboo(page)
    await clickProceed(page)

    await expect(page.locator('#peekaboo-enter-screen.active')).toBeVisible()
    await expect(page.locator('#peekaboo-meet-screen.active')).not.toBeVisible()
  })

  test('Peekaboo — advancing through screens reaches playing grid', async ({ page }) => {
    await startPeekaboo(page)

    // Meet → Enter
    await clickProceed(page)
    await expect(page.locator('#peekaboo-enter-screen.active')).toBeVisible()

    // Enter → Playing (fog rolls in automatically, no separate fog screen)
    await clickProceed(page)
    await expect(page.locator('#peekaboo-playing-screen.active')).toBeVisible()

    await expect(page.locator('#peekaboo-fog-grid')).toBeVisible()
  })

  test('Peekaboo — clicking a fog cell reveals it', async ({ page }) => {
    await startPeekaboo(page)

    // Advance to playing screen
    await clickProceed(page)
    await expect(page.locator('#peekaboo-enter-screen.active')).toBeVisible()
    await clickProceed(page)
    await expect(page.locator('#peekaboo-playing-screen.active')).toBeVisible()

    // Click first fog cell
    const firstCell = page.locator('[data-peekaboo-row="0"][data-peekaboo-col="0"]')
    await expect(firstCell).toBeVisible()
    await firstCell.click()

    await expect(firstCell).toHaveAttribute('data-revealed', 'true')
  })

  test('Peekaboo — enter screen shows scene', async ({ page }) => {
    await startPeekaboo(page)
    await clickProceed(page)

    await expect(page.locator('#peekaboo-enter-screen.active')).toBeVisible()
    await expect(page.locator('#peekaboo-enter-scene')).toBeVisible()
  })

  test('Peekaboo — controller opens menu', async ({ page }) => {
    await startPeekaboo(page)

    const menuBtn = page.locator('.screen.active .peekaboo-menu-btn')
    await menuBtn.click()
    await expect(page.locator('#settings-modal')).toBeVisible()
  })
})