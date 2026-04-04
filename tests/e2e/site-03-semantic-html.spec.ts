import { test, expect } from '@playwright/test';

const pages = [
  { name: 'homepage', path: '/', role: 'link', text: 'Open Super Word' },
  { name: 'game page', path: '/super-word/', role: 'button', text: 'Menu' },
  { name: '404 page', path: '/404.html', role: 'link', text: 'Back to the homepage →' },
];

test.describe('SITE-03: Semantic HTML', () => {
  for (const { name, path, role, text } of pages) {
    test(`${name} has <main> element`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('main')).toBeAttached();
    });

    test(`${name} keeps its primary interactive affordance accessible`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole(role as 'button' | 'link', { name: text })).toBeAttached();
    });

    test(`${name} has meta description`, async ({ page }) => {
      await page.goto(path);
      const metaDesc = page.locator('meta[name="description"]');
      await expect(metaDesc).toBeAttached();
      const content = await metaDesc.getAttribute('content');
      expect(content).toBeTruthy();
    });

    test(`${name} has non-empty title`, async ({ page }) => {
      await page.goto(path);
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
    });
  }

  test('homepage has h1 heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeAttached();
  });

  test('game page has heading hierarchy', async ({ page }) => {
    await page.goto('/super-word/');
    // Game page uses h2 headings for complete/win screens
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeAttached();
  });
});
