import { test, expect } from '@playwright/test';

test.describe('SITE-02: Navigation', () => {
  test('homepage has link to Super Word game', async ({ page }) => {
    await page.goto('/');
    const gameLink = page.locator('a[href*="super-word"]').first();
    await expect(gameLink).toBeVisible();
  });

  test('clicking game link navigates to /super-word/', async ({ page }) => {
    await page.goto('/');
    await page.locator('a[href*="super-word"]').first().click();
    await page.waitForURL('**/super-word/**');
    expect(page.url()).toContain('super-word');
  });

  test('game page has navigation back to homepage', async ({ page }) => {
    await page.goto('/super-word/');
    // shell.ts injects nav with Home link
    const homeLink = page.locator('nav a[href*="/"]').first();
    await expect(homeLink).toBeVisible();
  });

  test('back button returns to previous page', async ({ page }) => {
    await page.goto('/');
    await page.locator('a[href*="super-word"]').first().click();
    await page.waitForURL('**/super-word/**');
    await page.goBack();
    await expect(page.locator('h1')).toContainText('Peninsular Reveries');
  });

  test('homepage is directly URL-addressable', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('main')).toBeVisible();
  });

  test('game page is directly URL-addressable', async ({ page }) => {
    const response = await page.goto('/super-word/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('main')).toBeVisible();
  });

  test('404 page is directly URL-addressable', async ({ page }) => {
    const response = await page.goto('/404.html');
    expect(response?.status()).toBe(200);
    await expect(page.locator('main')).toBeVisible();
  });
});
