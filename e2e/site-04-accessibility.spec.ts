import AxeBuilder from '@axe-core/playwright'
import { test, expect, type Page } from '@playwright/test'

const staticPages = [
  { name: 'homepage', path: '/' },
  { name: 'attributions page', path: '/attributions/' },
  { name: 'game start screen', path: '/super-word/' },
  { name: 'Squares start screen', path: '/squares/' },
  { name: '404 page', path: '/404.html' },
]

const gamePath = '/super-word/'
const squaresGamePath = '/squares/'

async function startGame(page: Page): Promise<void> {
  await page.goto(gamePath)

  const startButton = page.getByRole('button', { name: /let's go/i })
  await startButton.focus()
  await page.keyboard.press('Enter')

  const firstSceneItem = page.locator('#scene-a11y .sr-overlay-btn[tabindex="0"]').first()
  await expect(firstSceneItem).toBeAttached()
  await expect(firstSceneItem).toBeFocused()
}

async function startSquaresGame(page: Page, rulesetId: 'classic-hybrid' | 'easy-plus' = 'classic-hybrid'): Promise<void> {
  await page.goto(squaresGamePath)

  if (rulesetId !== 'classic-hybrid') {
    await page.getByRole('button', { name: 'Menu' }).click()
    await page.locator('#ruleset-select').selectOption(rulesetId)
    await page.keyboard.press('Escape')
  }

  await page.getByRole('button', { name: 'Start puzzle' }).click()
  await expect(page.locator('#game-screen')).toHaveClass(/active/)
  await expect(page.locator('#squares-board')).toBeVisible()
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
    await startGame(page)

    const settingsButton = page.getByRole('button', { name: 'Menu' })
    await settingsButton.focus()
    await page.keyboard.press('Enter')

    const dialog = page.getByRole('dialog', { name: 'Menu' })
    await expect(dialog).toBeVisible()
    await expect(page.locator('#settings-close-btn')).toBeFocused()

    await page.keyboard.press('Escape')

    await expect(dialog).toBeHidden()
    await expect(settingsButton).toBeFocused()
  })

  test('settings dialog shows expected sections and defaults', async ({ page }) => {
    await startGame(page)

    await page.getByRole('button', { name: 'Menu' }).click()
    const dialog = page.getByRole('dialog', { name: 'Menu' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Audio')
    await expect(dialog).toContainText('Level')
    await expect(page.locator('#difficulty-select')).toHaveValue('hero')
    await expect(page.locator('#music-enabled-toggle')).toBeChecked()
  })

  test('settings music toggle is discoverable and controls audio preference', async ({ page }) => {
    await startGame(page)

    await page.getByRole('button', { name: 'Menu' }).click()

    const toggle = page.locator('#music-enabled-toggle')
    await expect(toggle).toBeChecked()

    await toggle.click()
    await expect(toggle).not.toBeChecked()

    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Menu' }).click()
    await expect(toggle).not.toBeChecked()
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

  test('keyboard tile selection and immediate movement keep focus stable before swapping', async ({ page }) => {
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
    const secondTile = page.locator('#letter-slots .letter-tile').nth(1)
    await firstTile.focus()
    await page.keyboard.press('Enter')
    await page.keyboard.press('ArrowRight')

    await expect(page.locator('#game-status')).toContainText('Selected letter')
    await expect(secondTile).toBeFocused()
  await expect(page.locator('#letter-slots .letter-tile.selected')).toContainText(firstBefore)
    await expect(page.locator('#letter-slots .letter-tile').nth(0)).toContainText(firstBefore)
    await expect(page.locator('#letter-slots .letter-tile').nth(1)).toContainText(secondBefore)

    await page.keyboard.press('Enter')

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

  test('Squares settings dialog is keyboard accessible and restores focus when closed', async ({ page }) => {
    await startSquaresGame(page)

    const settingsButton = page.locator('#game-screen').getByRole('button', { name: 'Menu' }).first()
    await settingsButton.focus()
    await page.keyboard.press('Enter')

    const dialog = page.getByRole('dialog', { name: 'Menu' })
    await expect(dialog).toBeVisible()
    await expect(page.locator('#settings-close-btn')).toBeFocused()

    await page.keyboard.press('Escape')

    await expect(dialog).toBeHidden()
    await expect(settingsButton).toBeFocused()
  })

  test('Squares move announcements update the polite live region', async ({ page }) => {
    await startSquaresGame(page)

    await page.locator('#squares-cell-r0-c0').focus()
    await page.keyboard.press('Enter')

    await expect(page.locator('#hud-move-count')).toHaveText('1')
    await expect(page.locator('#game-status')).toContainText('Move 1.')
  })

  test('Squares pattern changes announce in the polite live region', async ({ page }) => {
    await startSquaresGame(page)

    const patternToggle = page.locator('[data-squares-pattern-toggle="true"]')
    await expect(patternToggle).toHaveText(/Pattern: Plus/)
    await patternToggle.click()

    await expect(patternToggle).toHaveText(/Pattern: X/)
    await expect(page.locator('#game-status')).toContainText('X on.')
  })

  test('Squares active gameplay state has no critical accessibility violations in the rendered build', async ({ page }) => {
    await startSquaresGame(page)

    const results = await new AxeBuilder({ page })
      .include('#game-screen')
      .include('#game-status')
      .include('#game-feedback')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('Squares solving updates the win context and assertive live region', async ({ page }) => {
    await startSquaresGame(page, 'easy-plus')

    await page.locator('#squares-cell-r1-c1').click()
    await page.locator('#squares-cell-r0-c2').click()

    await expect(page.locator('#win-screen')).toHaveClass(/active/)
    await expect(page.locator('#game-feedback')).toContainText('Solved in 2 moves.')
    await expect(page.locator('#win-summary')).toContainText('Solved in 2 moves.')
    await expect(page.locator('#win-high-score-context')).toContainText('Easy Plus')
  })
})