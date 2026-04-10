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

async function completeWeatherStory(page: Page): Promise<void> {
  await startWeatherStory(page)
  await page.getByRole('button', { name: 'Put on your sun hat' }).click()
  await page.getByRole('button', { name: 'Grab an umbrella' }).click()
  await page.getByRole('button', { name: /Cross with the umbrella/ }).click()
  await page.getByRole('button', { name: 'Put on the warm coat' }).click()
  await page.getByRole('button', { name: 'Walk to the snowy field' }).click()
  await page.getByRole('button', { name: /Walk through the snow/ }).click()
  await page.getByRole('button', { name: 'Look for the rainbow' }).click()
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

  test('equipped item from the scene bar mirrors into the bag and unlocks the matching choice', async ({ page }) => {
    await page.goto('/story-trail/')
    await startWeatherStory(page)

    await page.getByRole('button', { name: 'Look at the cloudy sky' }).click()
    await expect(page.getByRole('button', { name: 'Grab an umbrella' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Grab an umbrella' })).toBeInViewport()
    await page.getByRole('button', { name: 'Grab an umbrella' }).click()

    const inventoryBar = page.locator('#inventory-bar')
    const umbrellaBarButton = page.locator('#inventory-bar [data-inventory-item-id="umbrella"]')
    const gatedChoice = page.getByRole('button', { name: /Cross with the umbrella/ })

    await expect(inventoryBar).toBeVisible()
    await expect(umbrellaBarButton).toBeVisible()
    await expect(umbrellaBarButton).toBeInViewport()
    await expect(umbrellaBarButton).toHaveAttribute('aria-pressed', 'true')
    await expect(gatedChoice).toBeVisible()
    await expect(gatedChoice).toBeInViewport()

    await umbrellaBarButton.click()
    await expect(umbrellaBarButton).toHaveAttribute('aria-pressed', 'false')
    await gatedChoice.click()
    await expect(page.locator('#scene-text')).toContainText('Rain falls hard on the path ahead.')
    await expect(page.locator('#hint-area')).toBeVisible()
    await expect(page.locator('#hint-area')).toContainText('Pick it in your bag first.')

    await umbrellaBarButton.click()
    await expect(umbrellaBarButton).toHaveAttribute('aria-pressed', 'true')

    await page.keyboard.press('KeyI')
    const inventoryOverlay = page.locator('#inventory-overlay')
    const umbrellaOverlayButton = page.locator('#inventory-overlay [data-inventory-item-id="umbrella"]')
    await expect(inventoryOverlay).toBeVisible()
    await expect(umbrellaOverlayButton).toBeVisible()
    await expect(umbrellaOverlayButton).toBeInViewport()
    await expect(umbrellaOverlayButton).toHaveAttribute('aria-pressed', 'true')
    await inventoryOverlay.getByRole('button', { name: 'Close' }).click()
    await expect(inventoryOverlay).toBeHidden()

    await gatedChoice.click()
    await expect(page.locator('#scene-text')).toContainText('Cold wind blows hard on the tall hill.')
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
    await completeWeatherStory(page)
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
    await expect(page.locator('#settings-modal')).toContainText('Tap an item in the bar or bag to hold it.')
    await expect(page.locator('#settings-modal')).toContainText('Hold the right item, then tap the matching choice.')
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
    await completeWeatherStory(page)
    await expect(page.locator('#game-area')).toHaveAttribute('data-active-screen', 'completion-view', { timeout: 15000 })
    await page.locator('#back-to-trail-btn').click()
    await expect(page.locator('#game-area')).toHaveAttribute('data-active-screen', 'trail-map', { timeout: 5000 })
    await page.reload()
    await expect(page.locator('.trail-stop-completed[data-story-id="weather"]')).toHaveCount(1)
    await expect(page.locator('button[data-story-id="plants"]')).toBeVisible()
  })
})
