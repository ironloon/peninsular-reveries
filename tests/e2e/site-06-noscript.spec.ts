import { test, expect } from '@playwright/test';

test.describe('SITE-06: Noscript fallback', () => {
  test('homepage shows noscript message with JS disabled', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    const noscript = page.locator('.noscript-message');
    await expect(noscript).toBeVisible();
    const text = await noscript.textContent();
    expect(text).toContain('JavaScript');
    await context.close();
  });

  test('homepage loads without errors with JS disabled', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('main')).toBeVisible();
    await context.close();
  });

  test('game page loads without errors with JS disabled', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    const response = await page.goto('/super-word/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('main')).toBeVisible();
    await context.close();
  });

  test('404 page loads without errors with JS disabled', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    const response = await page.goto('/404.html');
    expect(response?.status()).toBe(200);
    await expect(page.locator('main')).toBeVisible();
    await context.close();
  });
});
