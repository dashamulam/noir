import { test, expect } from '@playwright/test';
import { fixtures } from './fixtures';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
test.beforeEach(async ({ page }) => { await fixtures(page); });

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 430, height: 932 }, { width: 768, height: 1024 }, { width: 844, height: 390 }]) {
  test(`usable touch controls and no page overflow at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const navigation = page.getByRole('navigation', { name: 'Mobile navigation' });
    await expect(navigation).toBeVisible();
    await expect(page.locator('.hero')).toHaveCount(0);
    await expect(page.locator('.mood-card')).toHaveCount(5);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    for (const button of await navigation.getByRole('button').all()) {
      const box = await button.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    const menu = page.getByRole('button', { name: 'More options for Midnight Signal' });
    await expect(menu).toBeVisible();
    const menuBox = await menu.boundingBox();
    expect(menuBox!.width).toBeGreaterThanOrEqual(44);
    expect(menuBox!.height).toBeGreaterThanOrEqual(44);
    await page.getByRole('button', { name: 'Play track Midnight Signal', exact: true }).tap();
    await expect(page.getByRole('button', { name: 'Pause playback', exact: true })).toBeVisible();
    await expect(page.locator('.player-art .artwork')).toHaveCSS('filter', 'none');
    const playerBox = await page.locator('.player').boundingBox();
    const navBox = await navigation.boundingBox();
    expect(playerBox!.y + playerBox!.height).toBeLessThanOrEqual(navBox!.y);
    await page.getByRole('button', { name: 'Open now playing' }).tap();
    const dialog = page.getByRole('dialog', { name: 'Now playing' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Shuffle', exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Repeat: off', exact: true })).toBeVisible();
    await expect.poll(() => dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await dialog.getByRole('button', { name: 'Close now playing' }).tap();
    await navigation.getByRole('button', { name: 'Your library' }).tap();
    await expect(page.getByRole('heading', { name: 'A collection of you.' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test('mobile full player seeks, repeats, shuffles, changes tracks, and opens the queue', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play track Midnight Signal', exact: true }).tap();
  await expect.poll(() => page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Open now playing' }).tap();
  const dialog = page.getByRole('dialog', { name: 'Now playing' });
  await dialog.getByRole('button', { name: 'Pause playback', exact: true }).tap();
  await dialog.getByRole('slider', { name: 'Seek playback' }).fill('8');
  await expect.poll(() => page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeCloseTo(8, 0);
  await dialog.getByRole('button', { name: 'Shuffle', exact: true }).tap();
  await expect(dialog.getByRole('button', { name: 'Shuffle', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await dialog.getByRole('button', { name: 'Repeat: off', exact: true }).tap();
  await dialog.getByRole('button', { name: 'Repeat: all', exact: true }).tap();
  await expect.poll(() => page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.loop)).toBe(true);
  await dialog.getByRole('button', { name: 'Shuffle', exact: true }).tap();
  await dialog.getByRole('button', { name: 'Next track', exact: true }).tap();
  await expect(dialog.getByRole('heading', { name: 'Glasshouse', exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Up next', exact: true }).tap();
  const queue = page.getByRole('dialog', { name: 'Your queue' });
  await queue.getByRole('button', { name: 'Play Quiet Hours from queue' }).tap();
  await queue.getByRole('button', { name: 'Close queue' }).tap();
  await expect(page.locator('.player-track strong')).toHaveText('Quiet Hours');
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
});

test('mobile action sheets support likes, saved playlists, removal, and queueing', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'More options for Midnight Signal' }).tap();
  await page.getByRole('dialog').getByRole('button', { name: 'Add to liked songs' }).tap();
  const navigation = page.getByRole('navigation', { name: 'Mobile navigation' });
  await navigation.getByRole('button', { name: 'Favorites' }).tap();
  await page.getByRole('button', { name: 'More options for Midnight Signal' }).tap();
  await page.getByRole('dialog').getByRole('button', { name: 'Add to playlist' }).tap();
  await page.getByRole('textbox', { name: 'OR CREATE SOMETHING NEW' }).fill('Mobile favorites');
  await page.getByRole('button', { name: 'Create & add song' }).tap();
  await page.reload();
  await navigation.getByRole('button', { name: 'Your library' }).tap();
  await page.getByRole('button', { name: /Mobile favorites.*Made by you/ }).tap();
  await expect(page.getByRole('heading', { name: 'Mobile favorites', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'More options for Midnight Signal' }).tap();
  await page.getByRole('dialog').getByRole('button', { name: 'Remove from this playlist' }).tap();
  await expect(page.getByText('Every great playlist starts with one song.')).toBeVisible();
  await navigation.getByRole('button', { name: 'Favorites' }).tap();
  await page.getByRole('button', { name: 'More options for Midnight Signal' }).tap();
  await page.getByRole('dialog').getByRole('button', { name: 'Add to queue' }).tap();
  await page.getByRole('dialog', { name: 'Your queue' }).getByRole('button', { name: 'Play Midnight Signal from queue' }).tap();
  await page.getByRole('button', { name: 'Close queue' }).tap();
  await expect(page.getByRole('button', { name: 'Pause playback', exact: true })).toBeVisible();
});

test('mobile search and browser Back preserve the listening session', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play track Midnight Signal', exact: true }).tap();
  const navigation = page.getByRole('navigation', { name: 'Mobile navigation' });
  await navigation.getByRole('button', { name: 'Your library' }).tap();
  await navigation.getByRole('button', { name: 'Search', exact: true }).tap();
  const search = page.getByRole('textbox', { name: 'Search music' });
  await expect(search).toBeFocused();
  expect(await search.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
  await search.fill('fast');
  await search.press('Enter');
  await expect(search).not.toBeFocused();
  await expect(page.getByRole('button', { name: 'Play track fast result 0', exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'A collection of you.' })).toBeVisible();
  await expect(page.locator('.player-track strong')).toHaveText('Midnight Signal');
  await expect(page.getByRole('button', { name: 'Pause playback', exact: true })).toBeVisible();
});

test('mobile API requests work without newer AbortSignal helpers', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(AbortSignal, 'any', { value: undefined, configurable: true });
    Object.defineProperty(AbortSignal, 'timeout', { value: undefined, configurable: true });
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Play track Midnight Signal', exact: true })).toBeVisible();
});
