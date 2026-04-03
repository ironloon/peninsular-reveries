import { test, expect } from '@playwright/test';

const pages = [
  { name: 'homepage', path: '/', expectedFavicon: '/favicon.svg' },
  { name: 'game page', path: '/super-word/', expectedFavicon: '/favicon-game-super-word.svg' },
  { name: '404 page', path: '/404.html', expectedFavicon: '/favicon.svg' },
];

test.describe('SITE-05: SVG favicon', () => {
  for (const { name, path, expectedFavicon } of pages) {
    test(`${name} has SVG favicon link`, async ({ page }) => {
      await page.goto(path);
      const favicon = page.locator('link[rel="icon"][type="image/svg+xml"]');
      await expect(favicon).toBeAttached();
      await expect(favicon).toHaveAttribute('href', expectedFavicon);
    });

    test(`${name} favicon resolves`, async ({ page }) => {
      await page.goto(path);
      const favicon = page.locator('link[rel="icon"][type="image/svg+xml"]');
      const href = await favicon.getAttribute('href');
      const response = await page.request.get(new URL(href!, page.url()).href);
      expect(response.status()).toBe(200);
    });

    test(`${name} has apple-touch-icon`, async ({ page }) => {
      await page.goto(path);
      const icon = page.locator('link[rel="apple-touch-icon"]');
      await expect(icon).toBeAttached();
      const href = await icon.getAttribute('href');
      expect(href).toBeTruthy();
    });
  }

  test('homepage does not advertise a site-wide install manifest', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(0);
  });

  test('game page advertises a game-scoped install manifest', async ({ page }) => {
    await page.goto('/super-word/');
    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toBeAttached();
    await expect(manifest).toHaveAttribute('href', '/super-word/manifest.json');
  });
});
