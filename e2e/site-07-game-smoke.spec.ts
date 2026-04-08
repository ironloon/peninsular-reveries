import { test, expect } from '@playwright/test';

test.describe('SITE-07: Game smoke tests', () => {
  // Chompers
  test('Chompers — start screen is visible', async ({ page }) => {
    await page.goto('/chompers/')
    await expect(page.locator('#start-screen')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Chompers' })).toBeVisible()
  })

  test('Chompers — game loads and renders hippo on start', async ({ page }) => {
    await page.goto('/chompers/')
    await page.getByRole('button', { name: 'Start Chomping' }).click()
    await expect(page.locator('#game-screen')).toBeVisible()
    await expect(page.locator('#hippo')).toBeVisible()
    await expect(page.locator('#scene-items button').first()).toBeVisible()

    await expect(page.locator('#hippo')).toBeInViewport()
    await expect(page.locator('#scene-items button').first()).toBeInViewport()
  })

  // Pixel Passport
  test('Pixel Passport — start screen is visible', async ({ page }) => {
    await page.goto('/pixel-passport/')
    await expect(page.locator('#start-screen')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Pixel Passport' })).toBeVisible()
  })

  test('Pixel Passport — globe screen loads on explore', async ({ page }) => {
    await page.goto('/pixel-passport/')
    await page.getByRole('button', { name: /explore/i }).click()
    await expect(page.locator('#globe-screen')).toBeVisible()
    await expect(page.locator('.destination-marker').first()).toBeVisible()

    await expect(page.locator('.destination-marker').first()).toBeInViewport()
  })

  // Mission Orbit
  test('Mission Orbit — start screen is visible', async ({ page }) => {
    await page.goto('/mission-orbit/')
    await expect(page.locator('#start-screen')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Mission: Orbit' })).toBeVisible()
  })

  test('Mission Orbit — game screen and continue prompt appear on start', async ({ page }) => {
    await page.goto('/mission-orbit/')
    await page.getByRole('button', { name: 'Begin Mission' }).click()
    await expect(page.locator('#game-screen')).toBeVisible()
    await expect(page.locator('.continue-prompt')).toBeVisible()

    await expect(page.locator('.continue-prompt')).toBeInViewport()
  })

  // Super Word
  test('Super Word — start screen is visible', async ({ page }) => {
    await page.goto('/super-word/')
    await expect(page.locator('#start-screen')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Super Word' })).toBeVisible()
  })

  test('Super Word — canvas renders with non-zero dimensions on start', async ({ page }) => {
    await page.goto('/super-word/')
    await page.getByRole('button', { name: /let's go/i }).click()
    const canvas = page.locator('#scene-canvas')
    await expect(canvas).toBeVisible()
    const box = await canvas.boundingBox()
    expect(box?.width).toBeGreaterThan(0)
    expect(box?.height).toBeGreaterThan(0)

    await expect(canvas).toBeInViewport()
  })
})
