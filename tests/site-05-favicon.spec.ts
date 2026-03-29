import { test, expect } from '@playwright/test';

const pages = [
  { name: 'homepage', path: '/' },
  { name: 'game page', path: '/super-word/' },
  { name: '404 page', path: '/404.html' },
];

test.describe('SITE-05: SVG favicon', () => {
  for (const { name, path } of pages) {
    test(`${name} has SVG favicon link`, async ({ page }) => {
      await page.goto(path);
      const favicon = page.locator('link[rel="icon"][type="image/svg+xml"]');
      await expect(favicon).toBeAttached();
      const href = await favicon.getAttribute('href');
      expect(href).toBeTruthy();
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
});
