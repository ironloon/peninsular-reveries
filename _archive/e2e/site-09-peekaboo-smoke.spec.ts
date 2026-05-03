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

/** Advance from meet screen to playing screen */
async function advanceToPlaying(page: Page): Promise<void> {
  await startPeekaboo(page)
  // Meet → Enter
  await clickProceed(page)
  await expect(page.locator('#peekaboo-enter-screen.active')).toBeVisible()
  // Enter → Playing
  await clickProceed(page)
  await expect(page.locator('#peekaboo-playing-screen.active')).toBeVisible()
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
    await advanceToPlaying(page)
    await expect(page.locator('#peekaboo-fog-grid')).toBeVisible()
  })

  test('Peekaboo — clicking a fog cell reveals it', async ({ page }) => {
    await advanceToPlaying(page)

    // Click first fog cell (use .peekaboo-fog-cell to disambiguate from scenery buttons)
    const firstCell = page.locator('.peekaboo-fog-cell[data-peekaboo-row="0"][data-peekaboo-col="0"]')
    await expect(firstCell).toBeVisible()
    await firstCell.click()

    await expect(firstCell).toHaveAttribute('data-revealed', 'true')
  })

  test('Peekaboo — revealing fog cell does not transition to found', async ({ page }) => {
    await advanceToPlaying(page)

    // Reveal a few cells
    const cells = page.locator('.peekaboo-fog-cell')
    const count = Math.min(5, await cells.count())
    for (let i = 0; i < count; i++) {
      await cells.nth(i).click()
    }

    // Still on playing screen, not found
    await expect(page.locator('#peekaboo-playing-screen.active')).toBeVisible()
  })

  test('Peekaboo — scenery button becomes enabled after fog clears on that cell', async ({ page }) => {
    await advanceToPlaying(page)

    // Find a scenery button
    const scenery = page.locator('[data-scenery="true"]').first()
    if ((await scenery.count()) === 0) return // no scenery found, skip

    // Scenery should start disabled (fog covering it)
    await expect(scenery).toBeDisabled()

    // Get its row/col and reveal that fog cell
    const row = await scenery.getAttribute('data-peekaboo-row')
    const col = await scenery.getAttribute('data-peekaboo-col')
    if (row === null || col === null) return

    const fogCell = page.locator(`.peekaboo-fog-cell[data-peekaboo-row="${row}"][data-peekaboo-col="${col}"]`)
    await fogCell.click()

    // Scenery button should now be enabled
    await expect(scenery).toBeEnabled()
  })

  test('Peekaboo — full playthrough: clear fog, peek scenery, find character', async ({ page }) => {
    await advanceToPlaying(page)

    // Reveal all fog cells
    const fogCells = page.locator('.peekaboo-fog-cell')
    const fogCount = await fogCells.count()
    for (let i = 0; i < fogCount; i++) {
      await fogCells.nth(i).click()
    }

    // Click enabled scenery buttons one at a time until found.
    // Scenery sits behind the fog grid overlay, so use force:true
    // (elements are visually visible through transparent revealed fog but
    // Playwright considers them covered by the grid layer).
    for (let attempt = 0; attempt < 24; attempt++) {
      if (await page.locator('#peekaboo-found-screen.active').isVisible()) break
      const btn = page.locator('[data-scenery="true"]:not(:disabled)').first()
      if (!(await btn.count())) break
      await btn.click({ force: true })
    }

    // Should eventually reach found screen
    await expect(page.locator('#peekaboo-found-screen.active')).toBeVisible({ timeout: 5000 })
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