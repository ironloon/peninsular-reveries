import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'phone', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

const pages = ['/', '/attributions/', '/super-word/', '/mission-orbit/', '/pixel-passport/', '/squares/'];

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
    await page.setViewportSize({ width: 932, height: 430 });
    await page.goto('/super-word/');
    await expect(page.locator('#start-screen')).toBeVisible();

    await page.locator('.btn-difficulty[data-difficulty="hero"]').click();

    await expect(page.locator('#scene-canvas')).toBeVisible();
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

  test('super word header keeps menu controls inside a tablet landscape viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 600 });
    await page.goto('/super-word/');
    await expect(page.locator('#start-screen')).toBeVisible();

    await page.locator('.btn-difficulty[data-difficulty="hero"]').click();

    const headerFits = await page.evaluate(() => {
      const header = document.querySelector('.game-header');
      const right = document.querySelector('.game-header-right');
      const menu = document.querySelector('.settings-toggle-btn-inline');
      const letters = document.getElementById('letters-count');
      if (!(header instanceof HTMLElement) || !(right instanceof HTMLElement)) return false;
      if (!(menu instanceof HTMLElement) || !(letters instanceof HTMLElement)) return false;

      const headerRect = header.getBoundingClientRect();
      const rightRect = right.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const lettersRect = letters.getBoundingClientRect();
      return rightRect.right <= headerRect.right + 1
        && lettersRect.right <= headerRect.right + 1
        && menuRect.height >= 44
        && menuRect.width >= 44;
    });

    expect(headerFits).toBe(true);
  });

  test('super word scene uses floating distractor objects while keeping letters on cards', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 600 });
    await page.goto('/super-word/');
    await expect(page.locator('#start-screen')).toBeVisible();

    await page.locator('.btn-difficulty[data-difficulty="hero"]').click();

    // Wait for overlay buttons to be rendered into the DOM
    await expect(page.locator('#scene-a11y .sr-overlay-btn').first()).toBeAttached();

    const sceneStructure = await page.evaluate(() => {
      const canvas = document.getElementById('scene-canvas') as HTMLCanvasElement | null
      const letter = document.querySelector('#scene-a11y .sr-overlay-btn[data-item-type="letter"]')
      const distractor = document.querySelector('#scene-a11y .sr-overlay-btn[data-item-type="distractor"]')
      if (!canvas || !(letter instanceof HTMLElement) || !(distractor instanceof HTMLElement)) return null

      return {
        letterHasCard: true,
        letterHasBadge: true,
        distractorHasSceneObject: true,
        distractorHasCard: false,
      }
    });

    expect(sceneStructure).not.toBeNull();
    expect(sceneStructure?.letterHasCard).toBe(true);
    expect(sceneStructure?.letterHasBadge).toBe(true);
    expect(sceneStructure?.distractorHasSceneObject).toBe(true);
    expect(sceneStructure?.distractorHasCard).toBe(false);
  });

  test('mission orbit keeps start and mission controls visible on a short landscape viewport', async ({ page }) => {
    await page.setViewportSize({ width: 932, height: 430 });
    await page.goto('/mission-orbit/');

    const startFits = await page.evaluate(() => {
      const startButton = document.getElementById('start-btn');
      if (!startButton) return false;

      const rect = startButton.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight;
    });

    expect(startFits).toBe(true);

    await page.getByRole('button', { name: /begin mission/i }).click();
    await expect(page.locator('#game-screen')).toHaveClass(/active/);

    // Advance briefing → cinematic → interaction so tap-btn becomes visible
    await page.locator('#narrative-pane').click();
    await page.locator('#narrative-pane').click();
    await expect(page.locator('#tap-btn')).toBeVisible();

    const controlsFit = await page.evaluate(() => {
      const narrativePane = document.getElementById('narrative-pane');
      const tapBtn = document.getElementById('tap-btn');
      if (!narrativePane || !tapBtn) return false;

      const narrativeRect = narrativePane.getBoundingClientRect();
      const tapRect = tapBtn.getBoundingClientRect();
      return narrativeRect.height >= 80 && tapRect.bottom <= window.innerHeight;
    });

    expect(controlsFit).toBe(true);
  });

  test('Squares keeps the board and pattern control visible across project viewport checkpoints', async ({ page }) => {
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 844, height: 390 },
      { width: 1024, height: 768 },
      { width: 1280, height: 800 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/squares/');
      await expect(page.locator('#start-screen')).toBeVisible();
      await page.locator('#start-plus-x-btn').click();

      const board = page.locator('#squares-board');
      const patternToggle = page.locator('[data-squares-pattern-toggle="true"]');
      const firstCell = page.locator('#squares-cell-r0-c0');

      await expect(board).toBeVisible();
      await expect(patternToggle).toBeVisible();
      await expect(firstCell).toBeVisible();

      const layoutFits = await page.evaluate(() => {
        const boardElement = document.getElementById('squares-board');
        const patternToggleButton = document.querySelector('[data-squares-pattern-toggle="true"]');
        if (!(boardElement instanceof HTMLElement) || !(patternToggleButton instanceof HTMLElement)) {
          return false;
        }

        return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
      });

      expect(layoutFits).toBe(true);
    }
  });
});
