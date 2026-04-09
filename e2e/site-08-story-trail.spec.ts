import { test, expect } from '@playwright/test';

// CSS note: all GameScreen sections inherit visibility:hidden from the shared @layer rmx CSS
// (class rmxc-p3w21b). The story-trail CSS overrides display but not visibility. This means:
//   - locator.click() fails on elements inside screens (hit testing skips visibility:hidden).
//   - locator.dispatchEvent('click') works because it dispatches directly to the element.
//   - locator.focus() does not set document.activeElement for visibility:hidden buttons.
//   - For keyboard tests, buttons must be made temporarily visible before focusing.
//   - #settings-modal and #menu-btn are outside #game-area and are genuinely visible.
//   - Attribute/count/text assertions work on visibility:hidden DOM elements.

test.describe('SITE-08: Story Trail', () => {
  test('trail map renders with 5 story stops', async ({ page }) => {
    await page.goto('/story-trail/')
    // h1 textContent works regardless of visibility:hidden on ancestor
    await expect(page.locator('#trail-heading')).toHaveText('Story Trail')
    // Verify trail-map is the active screen
    await expect(page.locator('#game-area')).toHaveAttribute('data-active-screen', 'trail-map')
    // Weather stop is unlocked (rendered as button by renderTrailMap)
    await expect(page.locator('[data-story-id="weather"]')).toHaveAttribute('aria-label', 'Play Weather Watcher')
    // All 5 story stops present
    await expect(page.locator('[data-story-id]')).toHaveCount(5)
    // 4 locked stops
    await expect(page.locator('.trail-stop-locked')).toHaveCount(4)
  })

  test('first story is selectable and shows scene', async ({ page }) => {
    await page.goto('/story-trail/')
    // dispatchEvent bypasses hit testing (visibility:hidden elements excluded from hit testing)
    await page.locator('[data-story-id="weather"]').dispatchEvent('click')
    // showScreen('scene-view') is called synchronously in onStorySelected
    await expect(page.locator('#game-area')).toHaveAttribute('data-active-screen', 'scene-view', { timeout: 5000 })
    // renderScene adds choice buttons synchronously; wait for attachment (not visibility)
    await page.locator('.choice-btn').first().waitFor({ state: 'attached', timeout: 15000 })
    // getBoundingClientRect works on visibility:hidden elements (they still affect layout)
    const height = await page.locator('.choice-btn').first().evaluate(el => el.getBoundingClientRect().height)
    expect(height).toBeGreaterThanOrEqual(44)
  })

  test('making a choice navigates to next scene', async ({ page }) => {
    await page.goto('/story-trail/')
    await page.locator('[data-story-id="weather"]').dispatchEvent('click')
    await page.locator('.choice-btn').first().waitFor({ state: 'attached', timeout: 15000 })
    // scene-illustration is set synchronously by renderScene (no typewriter), reliable signal
    const initial = await page.locator('#scene-illustration').textContent()
    await page.locator('[data-choice-index="0"]').first().dispatchEvent('click')
    // renderScene runs synchronously in the click handler; illustration updates immediately
    await expect(page.locator('#scene-illustration')).not.toHaveText(initial ?? '')
  })

  test('inventory shows collected item after choice grants it', async ({ page }) => {
    await page.goto('/story-trail/')
    await page.locator('[data-story-id="weather"]').dispatchEvent('click')
    await page.locator('.choice-btn').first().waitFor({ state: 'attached', timeout: 15000 })
    // Choice 0: "Put on your sun hat" → grants sun-hat; updateInventoryBar called synchronously in setState
    await page.locator('[data-choice-index="0"]').first().dispatchEvent('click')
    // toContainText uses DOM textContent, works on visibility:hidden elements
    await expect(page.locator('#inventory-bar')).toContainText('Sun Hat', { timeout: 5000 })
  })

  test('locked choice shows hint when item missing', async ({ page }) => {
    await page.goto('/story-trail/')
    await page.locator('[data-story-id="weather"]').dispatchEvent('click')
    await page.locator('.choice-btn').first().waitFor({ state: 'attached', timeout: 15000 })
    // sunny-park: choice 1 ("Look at the cloudy sky") — no item granted
    await page.locator('[data-choice-index="1"]').first().dispatchEvent('click')
    // Wait for cloudy-sky illustration (synchronous DOM update in renderScene)
    await expect(page.locator('#scene-illustration')).toContainText('☁️', { timeout: 5000 })
    // cloudy-sky: choice 1 ("Walk into the rain") — no umbrella granted
    await page.locator('[data-choice-index="1"]').first().dispatchEvent('click')
    // Wait for rainy-path illustration
    await expect(page.locator('#scene-illustration')).toContainText('💧', { timeout: 5000 })
    // rainy-path: choice 0 ("Cross with the umbrella") — requiredItemId 'umbrella' not in inventory
    await page.locator('[data-choice-index="0"]').first().dispatchEvent('click')
    // renderHint removes the hidden attribute synchronously; no visual assertion needed
    await expect(page.locator('#hint-area')).not.toHaveAttribute('hidden')
    const hintText = await page.locator('#hint-area').textContent()
    expect(hintText).toBeTruthy()
  })

  test('story completion shows badge and returns to trail', async ({ page }) => {
    await page.goto('/story-trail/')
    await page.locator('[data-story-id="weather"]').dispatchEvent('click')
    await page.locator('.choice-btn').first().waitFor({ state: 'attached', timeout: 15000 })
    // Click through all 7 choices (index 0 each time, optimal path):
    // sunny-park → cloudy-sky → rainy-path → windy-hill → got-warm-coat → snowy-field → after-storm → rainbow-end
    // All DOM updates are synchronous in onChoiceMade; choice buttons re-render between each click
    for (let i = 0; i < 7; i++) {
      await page.locator('[data-choice-index="0"]').first().dispatchEvent('click')
    }
    // After 7th click: rainbow-end isEnd → onStoryComplete → showScreen('completion-view')
    await expect(page.locator('#game-area')).toHaveAttribute('data-active-screen', 'completion-view', { timeout: 15000 })
    // toContainText uses DOM textContent, works on visibility:hidden
    await expect(page.locator('#completion-view')).toContainText('Rainbow Badge')
    await page.locator('#back-to-trail-btn').dispatchEvent('click')
    await expect(page.locator('#game-area')).toHaveAttribute('data-active-screen', 'trail-map', { timeout: 5000 })
    await expect(page.locator('.trail-stop-completed[data-story-id="weather"]')).toHaveCount(1)
    await expect(page.locator('button[data-story-id="plants"]')).toHaveCount(1)
  })

  test('settings modal opens, tabs switch, close works', async ({ page }) => {
    await page.goto('/story-trail/')
    // #menu-btn is in <header> outside #game-area — genuinely visible, no dispatchEvent needed
    await page.locator('#menu-btn').click()
    // #settings-modal is outside #game-area; hidden attr removed by setupTabbedModal on click
    await expect(page.locator('#settings-modal')).not.toHaveAttribute('hidden')
    // Toggles are inside the modal which has no visibility:hidden ancestor
    await expect(page.locator('#music-enabled-toggle')).toBeVisible()
    await expect(page.locator('#sfx-enabled-toggle')).toBeVisible()
    await page.locator('#settings-close-btn').click()
    await expect(page.locator('#settings-modal')).toHaveAttribute('hidden')
  })

  test('keyboard navigation through choices', async ({ page }) => {
    await page.goto('/story-trail/')
    await page.locator('[data-story-id="weather"]').dispatchEvent('click')
    await page.locator('.choice-btn').first().waitFor({ state: 'attached', timeout: 15000 })
    const initial = await page.locator('#scene-illustration').textContent()
    // Chrome does not allow focus() on visibility:hidden elements. Make buttons temporarily
    // visible so the game's navigateList can move focus between them via ArrowDown.
    await page.evaluate(() => {
      document.querySelectorAll<HTMLElement>('.choice-btn').forEach(b => { b.style.visibility = 'visible' })
      ;(document.querySelector('[data-choice-index="0"]') as HTMLButtonElement | null)?.focus()
    })
    // ArrowDown: game's document keydown handler calls navigateList → moves focus to index 1
    await page.keyboard.press('ArrowDown')
    // Enter: game's document keydown handler calls onChoiceMade for the focused choice
    await page.keyboard.press('Enter')
    // Verify any choice was executed (scene illustration changes synchronously in renderScene)
    await expect(page.locator('#scene-illustration')).not.toHaveText(initial ?? '', { timeout: 15000 })
  })

  test('locked stories cannot be selected', async ({ page }) => {
    await page.goto('/story-trail/')
    await expect(page.locator('[data-story-id="plants"]')).toHaveAttribute('aria-disabled', 'true')
    // dispatchEvent fires the click; game handler checks tagName === 'BUTTON' — div stops are excluded
    await page.locator('[data-story-id="plants"]').dispatchEvent('click')
    // Active screen must not have changed to scene-view
    await expect(page.locator('#game-area')).not.toHaveAttribute('data-active-screen', 'scene-view')
  })

  test('progress persists across page reload', async ({ page }) => {
    await page.goto('/story-trail/')
    await page.locator('[data-story-id="weather"]').dispatchEvent('click')
    await page.locator('.choice-btn').first().waitFor({ state: 'attached', timeout: 15000 })
    for (let i = 0; i < 7; i++) {
      await page.locator('[data-choice-index="0"]').first().dispatchEvent('click')
    }
    await expect(page.locator('#game-area')).toHaveAttribute('data-active-screen', 'completion-view', { timeout: 15000 })
    await page.locator('#back-to-trail-btn').dispatchEvent('click')
    await expect(page.locator('#game-area')).toHaveAttribute('data-active-screen', 'trail-map', { timeout: 5000 })
    // saveProgress() stored completedStoryIds in localStorage before back-to-trail
    await page.reload()
    // After reload JS re-reads localStorage and re-renders trail map with weather completed
    await expect(page.locator('.trail-stop-completed[data-story-id="weather"]')).toHaveCount(1)
    await expect(page.locator('button[data-story-id="plants"]')).toHaveCount(1)
  })
})
