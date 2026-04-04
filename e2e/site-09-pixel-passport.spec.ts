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
    await expect(page.getByLabel('Sound')).toBeVisible()
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

  test('short landscape layout keeps the globe and room button visible', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 })
    await page.goto('/pixel-passport/')
    await page.getByRole('button', { name: /Explore!/i }).click()

    await expect(page.locator('#globe-screen')).toHaveClass(/active/)
    await expect(page.getByRole('button', { name: /Room/i })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Paris' })).toBeVisible()

    const widths = await page.evaluate(() => ({
      windowWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }))

    expect(widths.documentWidth).toBeLessThanOrEqual(widths.windowWidth + 1)
    expect(widths.bodyWidth).toBeLessThanOrEqual(widths.windowWidth + 1)
  })
})