import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'phone', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

const pages = ['/', '/attributions/', '/super-word/'];

test.describe('SITE-01: Responsive layout', () => {
  for (const vp of viewports) {
    for (const path of pages) {
      test(`${path} renders without errors at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });

        const errors: string[] = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') errors.push(msg.text());
        });

        await page.goto(path);
        await expect(page.locator('main')).toBeVisible();

        const hasOverflow = await page.evaluate(() =>
          document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
        );
        expect(hasOverflow, 'Page should not have horizontal overflow').toBe(false);

        expect(errors, 'No console errors').toEqual([]);
      });
    }
  }

  test('super word keeps core controls visible on a short landscape viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 600 });
    await page.goto('/super-word/');

    await page.getByRole('button', { name: /let's go/i }).click();

    await expect(page.locator('#scene .scene-item').first()).toBeVisible();
    await expect(page.locator('#check-btn')).toBeVisible();

    const controlsFit = await page.evaluate(() => {
      const scene = document.getElementById('scene-wrapper');
      const checkButton = document.getElementById('check-btn');
      if (!scene || !checkButton) return false;

      const sceneRect = scene.getBoundingClientRect();
      const buttonRect = checkButton.getBoundingClientRect();
      return sceneRect.height >= 140 && buttonRect.bottom <= window.innerHeight;
    });

    expect(controlsFit).toBe(true);
  });
});
