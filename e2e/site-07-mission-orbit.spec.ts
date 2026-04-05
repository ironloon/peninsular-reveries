import { expect, test } from '@playwright/test'

test.describe('SITE-07: Mission Orbit', () => {
  test('homepage exposes the Mission: Orbit card', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('a[href*="mission-orbit"]').first()).toBeVisible()
  })

  test('mission page loads and starts from the countdown screen', async ({ page }) => {
    await page.goto('/mission-orbit/')

    await expect(page.getByRole('heading', { name: 'Mission: Orbit' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Artemis II crew' })).toBeVisible()
    await expect(page.locator('.crew-option-static')).toHaveCount(4)
    await expect(page.locator('input[name="mission-crew"]')).toHaveCount(0)
    await page.getByRole('button', { name: 'Begin countdown' }).click()

    await expect(page.locator('#mission-screen')).toHaveClass(/active/)
    await expect(page.locator('#mission-phase-label')).toContainText('Final countdown')
    await expect(page.locator('#mission-action-btn')).toBeDisabled()
    await expect(page.locator('#mission-crew-overlay')).toHaveCount(0)
    await expect(page.locator('#game-status')).toBeAttached()
    await expect(page.locator('#phase-description')).toBeAttached()
  })

  test('settings modal opens and exposes the audio controls', async ({ page }) => {
    await page.goto('/mission-orbit/')

    await page.getByRole('button', { name: 'Menu' }).click()
    await expect(page.locator('#settings-modal')).toBeVisible()
    await expect(page.getByLabel('Space ambience')).toBeVisible()
    await expect(page.getByLabel('Physical sound effects')).toBeVisible()
    await expect(page.locator('#sound-intensity-select')).toHaveValue('heavy')
    await expect(page.locator('#sound-intensity-select option')).toHaveCount(3)
    await page.locator('#sound-intensity-select').selectOption('off')
    await expect(page.locator('#sound-intensity-select')).toHaveValue('off')
    await expect(page.getByText(/Off mutes menu, countdown, launch, burn, reentry, parachute, splashdown, and celebration sound effects\./)).toBeVisible()
    await expect(page.getByText(/Source details \(\d+\)/)).toBeVisible()
    await expect(page.locator('.settings-attribution-card').first()).toBeHidden()

    await page.getByText(/Source details \(\d+\)/).click()
    await expect(page.getByText('Mission ambience and interface synth bed')).toBeVisible()

    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.locator('#settings-modal')).toBeHidden()

    await page.reload()
    await page.getByRole('button', { name: 'Menu' }).click()
    await expect(page.locator('#sound-intensity-select')).toHaveValue('off')
  })

  test('spacecraft hit area can drive the launch phase directly', async ({ page }) => {
    test.slow()

    await page.goto('/mission-orbit/')

    await page.getByRole('button', { name: 'Begin countdown' }).click()
    await expect(page.locator('#mission-screen')).toHaveClass(/active/)
    await page.waitForFunction(() => document.getElementById('mission-phase-label')?.textContent?.includes('Ascent to orbit'))
    await expect(page.locator('#mission-action-btn')).toHaveText('Hold to launch')
    await expect(page.locator('#timing-panel #mission-prompt')).toBeVisible()

    const hitArea = page.locator('#mission-rocket-hit-area')
    await hitArea.dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch', isPrimary: true })
    await page.waitForFunction(() => document.getElementById('mission-phase-label')?.textContent?.includes('Orbit raise burn'))
    await hitArea.dispatchEvent('pointerup', { pointerId: 1, pointerType: 'touch', isPrimary: true })

    await expect(page.locator('#mission-action-btn')).toHaveText('Continue')
    await expect(page.locator('#timing-mode-chip')).toContainText('Mission log')

    await page.getByRole('button', { name: 'Continue' }).click()
    await page.waitForFunction(() => document.getElementById('mission-phase-label')?.textContent?.includes('Trans-lunar injection'))
    const actionButton = page.locator('#mission-action-btn')
    await expect(actionButton).toHaveText('Hold transfer burn')
    await expect(page.locator('#timing-mode-chip')).toContainText('Mission brief')

    await actionButton.click()
    await actionButton.hover()
    await page.mouse.down()
    await expect(actionButton).toHaveText('Keep the burn steady')
    await expect(page.locator('#timing-mode-chip')).toContainText('Hold burn')
    await page.waitForFunction(() => document.getElementById('mission-phase-label')?.textContent?.includes('Lunar flyby'))
    await page.mouse.up()
  })

  test('portrait orbit animation stays on-stage and moves smoothly', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 })
    await page.goto('/mission-orbit/')

    await page.getByRole('button', { name: 'Begin countdown' }).click()
    await page.waitForFunction(() => document.getElementById('mission-phase-label')?.textContent?.includes('Ascent to orbit'))
    await expect(page.locator('#mission-action-btn')).toHaveText('Hold to launch')

    const hitArea = page.locator('#mission-rocket-hit-area')
    await hitArea.dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch', isPrimary: true })
    await page.waitForTimeout(2600)
    await hitArea.dispatchEvent('pointerup', { pointerId: 1, pointerType: 'touch', isPrimary: true })

    await page.waitForFunction(() => document.getElementById('mission-phase-label')?.textContent?.includes('Orbit raise burn'))

    const motion = await page.evaluate(async () => {
      const stage = document.getElementById('mission-stage-shell')
      const rocket = document.getElementById('mission-rocket')
      if (!(stage instanceof HTMLElement) || !(rocket instanceof SVGGElement)) {
        return []
      }

      const samples: Array<{ centerX: number; centerY: number; stageWidth: number; stageHeight: number }> = []

      for (let index = 0; index < 34; index += 1) {
        const stageRect = stage.getBoundingClientRect()
        const rocketMatrix = rocket.getScreenCTM()
        if (!rocketMatrix) {
          return []
        }

        samples.push({
          centerX: rocketMatrix.e - stageRect.left,
          centerY: rocketMatrix.f - stageRect.top,
          stageWidth: stageRect.width,
          stageHeight: stageRect.height,
        })
        await new Promise((resolve) => window.setTimeout(resolve, 180))
      }

      return samples
    })

    expect(motion.length).toBeGreaterThan(20)

    for (const sample of motion) {
      expect(sample.centerX).toBeGreaterThanOrEqual(-12)
      expect(sample.centerX).toBeLessThanOrEqual(sample.stageWidth + 12)
      expect(sample.centerY).toBeGreaterThanOrEqual(-12)
      expect(sample.centerY).toBeLessThanOrEqual(sample.stageHeight + 12)
    }

    for (let index = 1; index < motion.length; index += 1) {
      const previous = motion[index - 1]
      const current = motion[index]
      const jump = Math.hypot(current.centerX - previous.centerX, current.centerY - previous.centerY)
      expect(jump).toBeLessThan(Math.max(current.stageWidth, current.stageHeight) * 0.22)
    }
  })

  test('narrow mobile layout keeps the mission controls reachable', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 740 })
    await page.goto('/mission-orbit/')

    await page.getByRole('button', { name: 'Begin countdown' }).click()
    await expect(page.locator('#mission-screen')).toHaveClass(/active/)

    const widths = await page.evaluate(() => ({
      windowWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }))

    expect(widths.documentWidth).toBeLessThanOrEqual(widths.windowWidth + 1)
    expect(widths.bodyWidth).toBeLessThanOrEqual(widths.windowWidth + 1)

    await page.locator('.mission-toolbar').scrollIntoViewIfNeeded()
    await expect(page.locator('.mission-stage-shell')).toBeVisible()
    await expect(page.locator('.mission-toolbar')).toBeVisible()
    await expect(page.locator('#timing-panel #mission-status-line')).toBeVisible()
    await expect(page.locator('#mission-stage-target')).toContainText(/continue|spacecraft|clock|recovery/i)

    const selectionGuard = await page.evaluate(() => ({
      shell: getComputedStyle(document.querySelector('.mission-shell') as Element).userSelect,
      panel: getComputedStyle(document.getElementById('timing-panel') as Element).userSelect,
    }))

    expect(selectionGuard.shell).toBe('none')
    expect(selectionGuard.panel).toBe('none')
  })

  test('start screen shows the fixed Artemis II roster', async ({ page }) => {
    await page.goto('/mission-orbit/')

    const roster = page.locator('.crew-picker-grid')
    await expect(page.locator('.crew-option-static')).toHaveCount(4)
    await expect(roster.getByText('Reid Wiseman', { exact: true })).toBeVisible()
    await expect(roster.getByText('Victor Glover', { exact: true })).toBeVisible()
    await expect(roster.getByText('Christina Koch', { exact: true })).toBeVisible()
    await expect(roster.getByText('Jeremy Hansen', { exact: true })).toBeVisible()
    await expect(page.locator('#crew-picker-help')).toContainText(/Crew is locked in/i)
  })
})