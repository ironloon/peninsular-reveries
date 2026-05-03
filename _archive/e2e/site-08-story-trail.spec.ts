import { test, expect, type Page } from '@playwright/test';

async function installMockGamepad(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const state = {
      connected: true,
      id: 'Mock Gamepad',
      index: 0,
      mapping: 'standard',
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 16 }, () => ({ pressed: false, touched: false, value: 0 })),
      timestamp: Date.now(),
    };

    Object.defineProperty(window, '__mockGamepadState', {
      value: state,
      configurable: true,
    });

    Object.defineProperty(navigator, 'getGamepads', {
      configurable: true,
      value: () => [state, null, null, null],
    });
  });
}

async function setGamepadButton(page: Page, index: number, pressed: boolean): Promise<void> {
  await page.evaluate(({ index, pressed }) => {
    const gamepadWindow = window as unknown as Window & {
      __mockGamepadState: {
        buttons: Array<{ pressed: boolean; touched: boolean; value: number }>
        timestamp: number
      }
    };

    const state = gamepadWindow.__mockGamepadState;
    state.buttons[index] = {
      ...state.buttons[index],
      pressed,
      touched: pressed,
      value: pressed ? 1 : 0,
    };
    state.timestamp = Date.now();
  }, { index, pressed });
}

async function tapGamepadButton(page: Page, index: number): Promise<void> {
  await setGamepadButton(page, index, true);
  await page.waitForTimeout(60);
  await setGamepadButton(page, index, false);
  await page.waitForTimeout(260);
}

async function isModalFocusContained(page: Page): Promise<boolean> {
  return page.evaluate(() => document.getElementById('settings-modal')?.contains(document.activeElement) ?? false);
}

async function beginStory(page: Page): Promise<void> {
  await page.goto('/story-trail/');
  await expect(page.locator('#game-area')).toHaveAttribute('data-active-screen', 'start-screen');
  await page.locator('#start-btn').click();
  await expect(page.locator('#game-area')).toHaveAttribute('data-active-screen', 'scene-view', { timeout: 5000 });
  await expect(page.locator('.choice-btn').first()).toBeVisible();
  await expect(page.locator('.choice-btn').first()).toBeInViewport();
}

/** Navigate the shortest item-free path to an ending: garden-gate → mossy-path → sunny-clearing → flower-patch → pond-edge → frog-log → turtle-safe → ending-haven */
async function completeStory(page: Page): Promise<void> {
  await beginStory(page);
  await page.getByRole('button', { name: 'Walk through the gate' }).click();
  await page.getByRole('button', { name: 'Go right to the sun' }).click();
  await page.getByRole('button', { name: 'Smell the tall flowers' }).click();
  await page.getByRole('button', { name: 'Walk to the pond' }).click();
  await page.getByRole('button', { name: 'Watch the frogs' }).click();
  await page.getByRole('button', { name: 'Help the turtle' }).click();
  await page.getByRole('button', { name: 'Stay by the pond' }).click();
  await expect(page.locator('#game-area')).toHaveAttribute('data-active-screen', 'completion-view', { timeout: 15000 });
}

test.describe('SITE-08: Story Trail', () => {
  test('start screen is visible with Begin button', async ({ page }) => {
    await page.goto('/story-trail/');
    await expect(page.getByRole('heading', { name: 'Story Trail' })).toBeVisible();
    await expect(page.locator('#game-area')).toHaveAttribute('data-active-screen', 'start-screen');
    await expect(page.locator('#start-btn')).toBeVisible();
    await expect(page.locator('#start-btn')).toBeInViewport();
    await expect(page.locator('#start-btn')).toHaveText('Begin');
  });

  test('clicking Begin shows scene-view with scene text and choices', async ({ page }) => {
    await beginStory(page);
    await expect(page.locator('#scene-text')).toBeVisible();
    const text = await page.locator('#scene-text').textContent();
    expect(text?.length).toBeGreaterThan(0);
    const height = await page.locator('.choice-btn').first().evaluate(el => el.getBoundingClientRect().height);
    expect(height).toBeGreaterThanOrEqual(44);
  });

  test('making a choice navigates to next scene', async ({ page }) => {
    await beginStory(page);
    const initialText = await page.locator('#scene-text').textContent();
    await page.locator('.choice-btn').first().click();
    await expect(page.locator('#scene-text')).not.toHaveText(initialText ?? '');
  });

  test('collecting an item shows it in the inventory bar', async ({ page }) => {
    await beginStory(page);
    // Pick up the gloves → grants garden-gloves
    await page.getByRole('button', { name: 'Pick up the gloves' }).click();
    const inventoryBar = page.locator('#inventory-bar');
    await expect(inventoryBar).toBeVisible();
    const gloveButton = page.locator('#inventory-bar [data-inventory-item-id="garden-gloves"]');
    await expect(gloveButton).toBeVisible();
    await expect(gloveButton).toBeInViewport();
  });

  test('equipping an item unlocks a locked choice', async ({ page }) => {
    await beginStory(page);
    // Get gloves
    await page.getByRole('button', { name: 'Pick up the gloves' }).click();
    // Walk to mossy-path → old-shed → dusty-greenhouse → found-lantern
    await page.getByRole('button', { name: 'Walk through the gate' }).click();
    await page.getByRole('button', { name: 'Go left to the shed' }).click();
    await page.getByRole('button', { name: 'Look inside the shed' }).click();
    await page.getByRole('button', { name: 'Feel around in the dark' }).click();

    // Now at found-lantern, with lantern in inventory
    // "Light the lantern" requires lantern equipped
    const gatedChoice = page.getByRole('button', { name: /Light the lantern/ });
    await expect(gatedChoice).toBeVisible();

    // Click without equipping → hint should appear
    await gatedChoice.click();
    await expect(page.locator('#hint-area')).toBeVisible();

    // Equip lantern
    const lanternBarButton = page.locator('#inventory-bar [data-inventory-item-id="lantern"]');
    await expect(lanternBarButton).toBeVisible();
    await lanternBarButton.click();
    await expect(lanternBarButton).toHaveAttribute('aria-pressed', 'true');

    // Now gated choice should work
    await gatedChoice.click();
    await expect(page.locator('#scene-text')).toContainText('Warm light fills the room');
  });

  test('story completion shows completion view', async ({ page }) => {
    await completeStory(page);
    await expect(page.locator('#completion-view')).toBeVisible();
    await expect(page.locator('#completion-view')).toContainText('The End');
    await expect(page.locator('#play-again-btn')).toBeVisible();
    await expect(page.locator('#play-again-btn')).toBeInViewport();
  });

  test('play again restarts the story', async ({ page }) => {
    await completeStory(page);
    await page.locator('#play-again-btn').click();
    await expect(page.locator('#game-area')).toHaveAttribute('data-active-screen', 'scene-view', { timeout: 5000 });
    await expect(page.locator('.choice-btn').first()).toBeVisible();
  });

  test('settings modal opens, tabs switch, close works', async ({ page }) => {
    await page.goto('/story-trail/');
    await page.locator('#menu-btn').click();
    await expect(page.locator('#settings-modal')).not.toHaveAttribute('hidden');
    await expect(page.locator('#music-enabled-toggle')).toBeVisible();
    await expect(page.locator('#sfx-enabled-toggle')).toBeVisible();
    await expect(page.locator('#settings-modal')).toContainText('Controls');
    await expect(page.locator('#settings-modal')).toContainText('Tap a choice to keep reading');
    await expect(page.locator('#settings-modal')).toContainText('Tap an item in the bar or bag to hold it');
    await page.locator('#settings-close-btn').click();
    await expect(page.locator('#settings-modal')).toHaveAttribute('hidden', '');
  });

  test('settings modal blocks interaction while open', async ({ page }) => {
    await completeStory(page);

    await page.locator('#menu-btn').click();
    await expect(page.locator('#settings-modal')).not.toHaveAttribute('hidden');
    await page.locator('#settings-modal').focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('#settings-modal')).not.toHaveAttribute('hidden');
    await expect(page.locator('#game-area')).toHaveAttribute('data-active-screen', 'completion-view');
  });

  test('gamepad navigation stays inside the settings modal', async ({ page }) => {
    await installMockGamepad(page);
    await page.goto('/story-trail/');

    await tapGamepadButton(page, 9);
    await expect(page.locator('#settings-modal')).not.toHaveAttribute('hidden');
    await expect.poll(async () => isModalFocusContained(page)).toBe(true);

    await tapGamepadButton(page, 13);
    await expect.poll(async () => isModalFocusContained(page)).toBe(true);
  });

  test('keyboard navigation through choices', async ({ page }) => {
    await beginStory(page);
    const initialText = await page.locator('#scene-text').textContent();
    await page.locator('.choice-btn').first().focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.locator('#scene-text')).not.toHaveText(initialText ?? '', { timeout: 15000 });
  });

  test('inventory overlay opens with I key and closes', async ({ page }) => {
    await beginStory(page);
    // Collect an item first
    await page.getByRole('button', { name: 'Pick up the gloves' }).click();
    await expect(page.locator('#inventory-bar [data-inventory-item-id="garden-gloves"]')).toBeVisible();

    await page.keyboard.press('KeyI');
    const inventoryOverlay = page.locator('#inventory-overlay');
    await expect(inventoryOverlay).toBeVisible();
    await expect(inventoryOverlay).toContainText('Garden Gloves');

    await inventoryOverlay.getByRole('button', { name: 'Close' }).click();
    await expect(inventoryOverlay).toBeHidden();
  });
});
