import { test, expect, type Page } from '@playwright/test';

async function startWeatherStory(page: Page): Promise<void> {
  const weatherStop = page.getByRole('button', { name: 'Play Weather Watcher' })

  await expect(page.locator('#game-area')).toHaveAttribute('data-active-screen', 'trail-map')
  await expect(weatherStop).toBeVisible()
  await expect(weatherStop).toBeInViewport()
  await weatherStop.click()
  await expect(page.locator('#game-area')).toHaveAttribute('data-active-screen', 'scene-view', { timeout: 5000 })
  await expect(page.locator('.choice-btn').first()).toBeVisible()
  await expect(page.locator('.choice-btn').first()).toBeInViewport()
}

test.describe('SITE-08: Story Trail', () => {
  test('trail map renders with 5 story stops', async ({ page }) => {
    await page.goto('/story-trail/')
    await expect(page.getByRole('heading', { name: 'Story Trail' })).toBeVisible()
    await expect(page.locator('#game-area')).toHaveAttribute('data-active-screen', 'trail-map')
    await expect(page.getByRole('button', { name: 'Play Weather Watcher' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Play Weather Watcher' })).toBeInViewport()
    await expect(page.locator('[data-story-id]')).toHaveCount(5)
    await expect(page.locator('.trail-stop-locked')).toHaveCount(4)
  })

  test('first story is selectable and shows scene', async ({ page }) => {
    await page.goto('/story-trail/')
    await startWeatherStory(page)
    const height = await page.locator('.choice-btn').first().evaluate(el => el.getBoundingClientRect().height)
    expect(height).toBeGreaterThanOrEqual(44)
  })

  test('making a choice navigates to next scene', async ({ page }) => {
    await page.goto('/story-trail/')
    await startWeatherStory(page)
    const initial = await page.locator('#scene-illustration').textContent()
    await page.locator('[data-choice-index="0"]').first().click()
    await expect(page.locator('#scene-illustration')).not.toHaveText(initial ?? '')
  })

  test('inventory shows collected item after choice grants it', async ({ page }) => {
    await page.goto('/story-trail/')
    await startWeatherStory(page)
    await page.locator('[data-choice-index="0"]').first().click()
    await expect(page.locator('#inventory-bar')).toContainText('Sun Hat', { timeout: 5000 })
  })

  test('locked choice shows hint when item missing', async ({ page }) => {
    await page.goto('/story-trail/')
    await startWeatherStory(page)
    await page.locator('[data-choice-index="1"]').first().click()
    await expect(page.locator('#scene-illustration')).toContainText('☁️', { timeout: 5000 })
    await page.locator('[data-choice-index="1"]').first().click()
    await expect(page.locator('#scene-illustration')).toContainText('💧', { timeout: 5000 })
    await page.locator('[data-choice-index="0"]').first().click()
    await expect(page.locator('#hint-area')).toBeVisible()
    const hintText = await page.locator('#hint-area').textContent()
    expect(hintText).toBeTruthy()
  })

  test('story completion shows badge and returns to trail', async ({ page }) => {
    await page.goto('/story-trail/')
    await startWeatherStory(page)
    for (let i = 0; i < 7; i++) {
      await page.locator('[data-choice-index="0"]').first().click()
    }
    await expect(page.locator('#game-area')).toHaveAttribute('data-active-screen', 'completion-view', { timeout: 15000 })
    await expect(page.locator('#completion-view')).toBeVisible()
    await expect(page.locator('#completion-view')).toContainText('Rainbow Badge')
    await page.locator('#back-to-trail-btn').click()
    await expect(page.locator('#game-area')).toHaveAttribute('data-active-screen', 'trail-map', { timeout: 5000 })
    await expect(page.locator('.trail-stop-completed[data-story-id="weather"]')).toHaveCount(1)
    await expect(page.locator('button[data-story-id="plants"]')).toBeVisible()
  })

  test('settings modal opens, tabs switch, close works', async ({ page }) => {
    await page.goto('/story-trail/')
    await page.locator('#menu-btn').click()
    await expect(page.locator('#settings-modal')).not.toHaveAttribute('hidden')
    await expect(page.locator('#music-enabled-toggle')).toBeVisible()
    await expect(page.locator('#sfx-enabled-toggle')).toBeVisible()
    await expect(page.locator('#settings-modal')).toContainText('Controls')
    await expect(page.locator('#settings-modal')).toContainText('Tap any trail stop to start a story.')
    await page.locator('#settings-close-btn').click()
    await expect(page.locator('#settings-modal')).toHaveAttribute('hidden')
  })

  test('keyboard navigation through choices', async ({ page }) => {
    await page.goto('/story-trail/')
    await startWeatherStory(page)
    const initial = await page.locator('#scene-illustration').textContent()
    await page.locator('[data-choice-index="0"]').first().focus()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(page.locator('#scene-illustration')).not.toHaveText(initial ?? '', { timeout: 15000 })
  })

  test('locked stories cannot be selected', async ({ page }) => {
    await page.goto('/story-trail/')
    await expect(page.locator('[data-story-id="plants"]')).toHaveAttribute('aria-disabled', 'true')
    await expect(page.locator('[data-story-id="plants"]')).toBeVisible()
    await expect(page.locator('button[data-story-id="plants"]')).toHaveCount(0)
    await expect(page.locator('#game-area')).toHaveAttribute('data-active-screen', 'trail-map')
  })

  test('progress persists across page reload', async ({ page }) => {
    await page.goto('/story-trail/')
    await startWeatherStory(page)
    for (let i = 0; i < 7; i++) {
      await page.locator('[data-choice-index="0"]').first().click()
    }
    await expect(page.locator('#game-area')).toHaveAttribute('data-active-screen', 'completion-view', { timeout: 15000 })
    await page.locator('#back-to-trail-btn').click()
    await expect(page.locator('#game-area')).toHaveAttribute('data-active-screen', 'trail-map', { timeout: 5000 })
    await page.reload()
    await expect(page.locator('.trail-stop-completed[data-story-id="weather"]')).toHaveCount(1)
    await expect(page.locator('button[data-story-id="plants"]')).toBeVisible()
  })
})
