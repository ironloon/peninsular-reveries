import AxeBuilder from '@axe-core/playwright'
import { test, expect, type Page } from '@playwright/test'

const staticPages = [
  { name: 'homepage', path: '/' },
  { name: 'attributions page', path: '/attributions/' },
  { name: 'game start screen', path: '/super-word/' },
  { name: '404 page', path: '/404.html' },
]

const gamePath = '/super-word/'

async function startGame(page: Page): Promise<void> {
  await page.goto(gamePath)

  const startButton = page.getByRole('button', { name: /let's go/i })
  await startButton.focus()
  await page.keyboard.press('Enter')

  const firstSceneItem = page.locator('#scene-a11y .sr-overlay-btn[tabindex="0"]').first()
  await expect(firstSceneItem).toBeAttached()
  await expect(firstSceneItem).toBeFocused()
}

test.describe('SITE-04: Accessibility', () => {
  for (const { name, path } of staticPages) {
    test(`${name} has no critical accessibility violations in the rendered build`, async ({ page }) => {
      await page.goto(path)

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()

      expect(results.violations).toEqual([])
    })
  }

  test('settings dialog is keyboard accessible and restores focus when closed', async ({ page }) => {
    await page.goto('/super-word/')

    const settingsButton = page.getByRole('button', { name: 'Menu' })
    await settingsButton.focus()
    await page.keyboard.press('Enter')

    const dialog = page.getByRole('dialog', { name: 'Menu' })
    await expect(dialog).toBeVisible()
    await expect(page.locator('#settings-close-btn')).toBeFocused()
    await expect(page.locator('#difficulty-select')).toHaveValue('hero')
    await expect(page.locator('#music-enabled-toggle')).toBeChecked()
    await expect(dialog).toContainText('Audio')
    await expect(dialog).toContainText('Difficulty')

    await page.keyboard.press('Escape')

    await expect(dialog).toBeHidden()
    await expect(settingsButton).toBeFocused()
  })

  test('visible music toggle is discoverable and stays synced with settings', async ({ page }) => {
    await page.goto('/super-word/')

    const quickToggle = page.locator('#start-music-toggle')
    await expect(quickToggle).toBeVisible()
    await expect(quickToggle).toContainText('Music On')

    await quickToggle.click()

    await expect(quickToggle).toHaveAttribute('aria-pressed', 'false')
    await expect(quickToggle).toContainText('Music Off')

    await page.getByRole('button', { name: 'Menu' }).click()
    await expect(page.locator('#music-enabled-toggle')).not.toBeChecked()
  })

  test('starting the game moves focus into the custom-rendered puzzle scene', async ({ page }) => {
    await startGame(page)
  })

  test('phone-sized start button is pointer clickable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(gamePath)

    await page.getByRole('button', { name: /let's go/i }).click()

    const firstSceneItem = page.locator('#scene-a11y .sr-overlay-btn[tabindex="0"]').first()
    await expect(firstSceneItem).toBeAttached()
  })

  test('starting the game announces the current puzzle in the polite live region', async ({ page }) => {
    await startGame(page)

    const status = page.locator('#game-status')
    const prompt = (await page.locator('#prompt-text').textContent())?.trim() ?? ''

    expect(prompt.length).toBeGreaterThan(0)
    await expect(status).toContainText('Puzzle 1 of 5')
    await expect(status).toContainText(prompt)
  })

  test('active gameplay state has no critical accessibility violations in the rendered build', async ({ page }) => {
    await startGame(page)

    const results = await new AxeBuilder({ page })
      .include('#game-screen')
      .include('#game-status')
      .include('#game-feedback')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('collecting a letter announces progress in the assertive live region', async ({ page }) => {
    await startGame(page)

    await page.locator('#scene-a11y .sr-overlay-btn[data-item-type="letter"][tabindex="0"]').focus()
    await page.keyboard.press('Enter')

    await expect(page.locator('#game-feedback')).toContainText('Collected letter')
    await expect(page.locator('#letter-slots .letter-tile')).toHaveCount(1)
  })

  test('motion-enabled collection keeps the destination tile hidden until the letter lands', async ({ page }) => {
    await startGame(page)

    await page.locator('#scene-a11y .sr-overlay-btn[data-item-type="letter"][tabindex="0"]').focus()
    await page.keyboard.press('Enter')

    const tile = page.locator('#letter-slots .letter-tile').first()
    await expect(tile).toHaveClass(/pending-flight/)
    await expect(page.locator('.flying-letter')).toHaveCount(1)
    await expect(tile).not.toHaveClass(/pending-flight/)
    await expect(tile).toBeVisible()
    await expect(page.locator('.flying-letter')).toHaveCount(0)
  })

  test('activating a distractor announces feedback without collecting a tile', async ({ page }) => {
    await startGame(page)

    const distractor = page.locator('#scene-a11y .sr-overlay-btn[data-item-type="distractor"]').first()
    await distractor.focus()
    await page.keyboard.press('Enter')

    await expect(page.locator('#game-feedback')).toContainText('distractor')
    await expect(page.locator('#letter-slots .letter-tile')).toHaveCount(0)
  })

  test('keyboard tile swapping updates the polite live region and tile order', async ({ page }) => {
    await startGame(page)

    const remainingLetters = page.locator('#scene-a11y .sr-overlay-btn[data-item-type="letter"]:not(.collected)')
    await remainingLetters.first().focus()
    await page.keyboard.press('Enter')
    await remainingLetters.first().focus()
    await page.keyboard.press('Enter')

    await expect(page.locator('#letter-slots .letter-tile')).toHaveCount(2)
    await expect(page.locator('#letter-slots .letter-tile.pending-flight')).toHaveCount(0)

    const firstBefore = (await page.locator('#letter-slots .letter-tile').nth(0).textContent())?.trim() ?? ''
    const secondBefore = (await page.locator('#letter-slots .letter-tile').nth(1).textContent())?.trim() ?? ''

    expect(firstBefore.length).toBeGreaterThan(0)
    expect(secondBefore.length).toBeGreaterThan(0)

    const firstTile = page.locator('#letter-slots .letter-tile').first()
    await firstTile.focus()
    await page.keyboard.press('ArrowRight')

    await expect(page.locator('#game-status')).toContainText('Swapped')
    await expect(page.locator('#letter-slots .letter-tile').nth(0)).toContainText(secondBefore)
    await expect(page.locator('#letter-slots .letter-tile').nth(1)).toContainText(firstBefore)
  })

  test('reduced motion keeps gameplay functional without fly-to-notepad animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await startGame(page)

    await page.locator('#scene-a11y .sr-overlay-btn[data-item-type="letter"][tabindex="0"]').focus()
    await page.keyboard.press('Enter')

    await expect(page.locator('.flying-letter')).toHaveCount(0)
    await expect(page.locator('#game-feedback')).toContainText('Collected letter')
  })
})