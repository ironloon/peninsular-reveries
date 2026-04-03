import { expect, test } from '@playwright/test'

test.describe('SITE-07: Mission Orbit', () => {
  test('homepage exposes the Mission: Orbit card', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href*="mission-orbit"]').first()).toBeVisible()
  })

  test('mission page loads and starts from the countdown screen', async ({ page }) => {
    await page.goto('/mission-orbit/')

    await expect(page.getByRole('heading', { name: 'Mission: Orbit' })).toBeVisible()
    await page.getByRole('button', { name: 'Begin countdown' }).click()

    await expect(page.locator('#mission-screen')).toHaveClass(/active/)
    await expect(page.locator('#mission-phase-label')).toContainText('Final countdown')
    await expect(page.locator('#mission-action-btn')).toBeDisabled()
    await expect(page.locator('#game-status')).toBeAttached()
    await expect(page.locator('#phase-description')).toBeAttached()
  })

  test('settings modal opens and exposes the audio toggle', async ({ page }) => {
    await page.goto('/mission-orbit/')

    await page.getByRole('button', { name: 'Mission settings' }).click()
    await expect(page.locator('#settings-modal')).toBeVisible()
    await expect(page.getByLabel('Space ambience')).toBeVisible()

    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.locator('#settings-modal')).toBeHidden()
  })
})