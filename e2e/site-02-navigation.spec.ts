import { test, expect } from '@playwright/test';

test.describe('SITE-02: Navigation', () => {
  test('homepage has link to Super Word game', async ({ page }) => {
    await page.goto('/');
    const gameLink = page.getByRole('link', { name: 'Open Super Word' });
    await expect(gameLink).toBeVisible();
  });

  test('homepage has link to Squares game', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Open Squares' })).toBeVisible();
  });

  test('homepage has link to the game info page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'View info for Super Word' })).toBeVisible();
  });

  test('homepage has link to the Squares info page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'View info for Squares' })).toBeVisible();
  });

  test('clicking game link navigates to /super-word/', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Open Super Word' }).click();
    await page.waitForURL('**/super-word/**');
    expect(page.url()).toContain('super-word');
  });

  test('clicking the Super Word card body navigates to /super-word/', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('heading', { name: 'Super Word' }).click();
    await page.waitForURL('**/super-word/**');
    expect(page.url()).toContain('super-word');
  });

  test('clicking Squares game link navigates to /squares/', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Open Squares' }).click();
    await page.waitForURL('**/squares/**');
    expect(page.url()).toContain('squares');
  });

  test('clicking the Squares card body navigates to /squares/', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('heading', { name: 'Squares' }).click();
    await page.waitForURL('**/squares/**');
    expect(page.url()).toContain('squares');
  });

  test('game page exposes Quit inside the Menu', async ({ page }) => {
    await page.goto('/super-word/');
    await page.getByRole('button', { name: /let's go/i }).click();
    await page.locator('#scene-a11y .sr-overlay-btn[tabindex="0"]').first().waitFor();
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByRole('link', { name: 'Quit' })).toBeVisible();
  });

  test('Squares game page exposes Quit inside the Menu', async ({ page }) => {
    await page.goto('/squares/');
    await page.getByRole('button', { name: 'Start puzzle' }).click();
    await expect(page.locator('#squares-board')).toBeVisible();
    await page.locator('#game-screen').getByRole('button', { name: 'Menu' }).first().click();
    await expect(page.getByRole('link', { name: 'Quit' })).toBeVisible();
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

  test('Squares game page is directly URL-addressable', async ({ page }) => {
    const response = await page.goto('/squares/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('main')).toBeVisible();
  });

  test('Squares info page is directly URL-addressable', async ({ page }) => {
    const response = await page.goto('/squares/info/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('main')).toContainText('Squares');
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
