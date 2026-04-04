import { test, expect } from '@playwright/test';

test.describe('SITE-02: Navigation', () => {
  test('homepage has link to Super Word game', async ({ page }) => {
    await page.goto('/');
    const gameLink = page.getByRole('link', { name: 'Open Super Word' });
    await expect(gameLink).toBeVisible();
  });

  test('homepage has link to attributions page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'View attributions for Super Word' })).toBeVisible();
  });

  test('clicking game link navigates to /super-word/', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Open Super Word' }).click();
    await page.waitForURL('**/super-word/**');
    expect(page.url()).toContain('super-word');
  });

  test('game page exposes Home inside the Menu', async ({ page }) => {
    await page.goto('/super-word/');
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
  });

  test('back button returns to previous page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Open Super Word' }).click();
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

  test('attributions page is directly URL-addressable', async ({ page }) => {
    const response = await page.goto('/attributions/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('main')).toContainText('Attributions');
  });

  test('404 page is directly URL-addressable', async ({ page }) => {
    const response = await page.goto('/404.html');
    expect(response?.status()).toBe(200);
    await expect(page.locator('main')).toBeVisible();
  });
});
