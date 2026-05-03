import { test, expect } from '@playwright/test'

const pages = [
  { path: '/', heading: 'Peninsular Reveries', checkMain: true },
  { path: '/super-word/', heading: 'Super Word' },
  { path: '/squares/', heading: 'Squares' },
  { path: '/chompers/', heading: 'Chompers' },
  { path: '/pixel-passport/', heading: 'Pixel Passport' },
  { path: '/mission-orbit/', heading: 'Mission: Orbit' },
  { path: '/story-trail/', heading: 'Story Trail' },
  { path: '/waterwall/', heading: 'Waterwall' },
  { path: '/beat-pad/', heading: 'Beat Pad' },
  { path: '/train-sounds/', heading: 'Train Sounds' },
  { path: '/spot-on/', heading: 'Spot On' },
  { path: '/peekaboo/' },
  { path: '/copycat/', heading: 'Copycat' },
  { path: '/all-aboard/', heading: 'All Aboard' },
  { path: '/attributions/', heading: 'Attributions', checkMain: true },
  { path: '/404.html' },
]

test.describe('SITE-00: Smoke tests', () => {
  for (const { path, heading, checkMain } of pages) {
    test(`${path} loads and renders`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)

      if (checkMain) {
        await expect(page.locator('main')).toBeVisible()
      } else {
        await expect(page.locator('body')).toBeAttached()
      }

      if (heading) {
        await expect(page.getByRole('heading', { name: heading })).toBeAttached()
      }
    })
  }
})
