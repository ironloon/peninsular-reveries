import AxeBuilder from '@axe-core/playwright'
import { test, expect, type Page } from '@playwright/test'

const staticPages = [
  { name: 'homepage', path: '/' },
  { name: 'game start screen', path: '/super-word/' },
  { name: '404 page', path: '/404.html' },
]

const deterministicGamePath = '/super-word/?puzzles=CAT&count=1'

async function startDeterministicGame(page: Page): Promise<void> {
  await page.goto(deterministicGamePath)

  const startButton = page.getByRole('button', { name: /let's go/i })
  await startButton.focus()
  await page.keyboard.press('Enter')

  const firstSceneItem = page.locator('#scene .scene-item[tabindex="0"]').first()
  await expect(firstSceneItem).toBeVisible()
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

    const settingsButton = page.getByRole('button', { name: 'Settings' })
    await settingsButton.focus()
    await page.keyboard.press('Enter')

    const dialog = page.getByRole('dialog', { name: 'Settings' })
    await expect(dialog).toBeVisible()
    await expect(page.getByLabel('Words (comma-separated):')).toBeFocused()

    await page.keyboard.press('Escape')

    await expect(dialog).toBeHidden()
    await expect(settingsButton).toBeFocused()
  })

  test('starting the game moves focus into the custom-rendered puzzle scene', async ({ page }) => {
    await startDeterministicGame(page)
  })

  test('starting the game announces the current puzzle in the polite live region', async ({ page }) => {
    await startDeterministicGame(page)

    const status = page.locator('#game-status')
    await expect(status).toContainText('Puzzle 1 of 1')
    await expect(status).toContainText('meow')
  })

  test('active gameplay state has no critical accessibility violations in the rendered build', async ({ page }) => {
    await startDeterministicGame(page)

    const results = await new AxeBuilder({ page })
      .include('#game-screen')
      .include('#game-status')
      .include('#game-feedback')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('collecting a letter announces progress in the assertive live region', async ({ page }) => {
    await startDeterministicGame(page)

    await page.keyboard.press('Enter')

    await expect(page.locator('#game-feedback')).toContainText('Collected letter')
    await expect(page.locator('#letter-slots .letter-tile')).toHaveCount(1)
  })

  test('activating a distractor announces feedback without collecting a tile', async ({ page }) => {
    await startDeterministicGame(page)

    const distractor = page.locator('#scene .scene-item[data-item-type="distractor"]').first()
    await distractor.focus()
    await page.keyboard.press('Enter')

    await expect(page.locator('#game-feedback')).toContainText('distractor')
    await expect(page.locator('#letter-slots .letter-tile')).toHaveCount(0)
  })

  test('keyboard tile swapping updates the polite live region and tile order', async ({ page }) => {
    await startDeterministicGame(page)

    const remainingLetters = page.locator('#scene .scene-item[data-item-type="letter"]:not(.collected)')
    await remainingLetters.first().focus()
    await page.keyboard.press('Enter')
    await remainingLetters.first().focus()
    await page.keyboard.press('Enter')

    const firstTile = page.locator('#letter-slots .letter-tile').first()
    await firstTile.focus()
    await page.keyboard.press('ArrowRight')

    await expect(page.locator('#game-status')).toContainText('Swapped')
    await expect(page.locator('#letter-slots .letter-tile').nth(0)).toContainText('A')
    await expect(page.locator('#letter-slots .letter-tile').nth(1)).toContainText('C')
  })

  test('reduced motion keeps gameplay functional without fly-to-notepad animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await startDeterministicGame(page)

    await page.keyboard.press('Enter')

    await expect(page.locator('.flying-letter')).toHaveCount(0)
    await expect(page.locator('#game-feedback')).toContainText('Collected letter')
  })
})