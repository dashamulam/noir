import { test, expect } from '@playwright/test';
import { fixtures, songs } from './fixtures';

test.beforeEach(async ({ page }) => { await fixtures(page); });

test('search cancels stale requests, paginates, and handles empty and failed responses', async ({ page }) => {
  await page.goto('/');
  const input = page.getByRole('textbox', { name: 'Search music' });
  await input.fill('slow');
  await page.waitForRequest('**/api/search/songs?query=slow**');
  await input.fill('fast');
  await expect(page.getByRole('button', { name: 'Play track fast result 0', exact: true })).toBeVisible();
  await page.waitForTimeout(1000);
  await expect(page.getByText('slow result 0', { exact: true })).toHaveCount(0);
  await input.fill('many');
  await expect(page.locator('.song-row')).toHaveCount(24);
  await page.getByRole('button', { name: 'Discover more', exact: true }).click();
  await expect(page.locator('.song-row')).toHaveCount(27);
  await expect(page.getByRole('button', { name: 'Discover more', exact: true })).toHaveCount(0);
  await input.fill('empty');
  await expect(page.getByText('A little quiet here.')).toBeVisible();
  await input.fill('broken');
  await expect(page.getByRole('alert')).toContainText('503');
  await page.route('**/api/search/songs?query=broken**', route => route.fulfill({ json: { success: true, data: { total: 3, start: 0, results: songs() } } }));
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Play track Midnight Signal', exact: true })).toBeVisible();
});

test('likes and custom playlists persist and tracks can be removed', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Like Midnight Signal', exact: true }).click();
  await page.getByRole('button', { name: 'Add Midnight Signal to a playlist', exact: true }).click();
  await page.getByRole('textbox', { name: 'OR CREATE SOMETHING NEW' }).fill('Night drive');
  await page.getByRole('button', { name: 'Create & add song', exact: true }).click();
  const otherTab = await page.context().newPage();
  await fixtures(otherTab);
  await otherTab.goto('/');
  expect(await otherTab.evaluate(() => sessionStorage.getItem('noir-likes'))).toBeNull();
  await otherTab.close();
  await page.reload();
  await page.getByRole('button', { name: 'Night drive', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Night drive', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Unlike Midnight Signal', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Remove Midnight Signal from playlist' }).click();
  await expect(page.getByText('Every great playlist starts with one song.')).toBeVisible();
  await page.getByRole('button', { name: /Liked songs/ }).click();
  await expect(page.getByRole('button', { name: 'Play track Midnight Signal', exact: true })).toBeVisible();
});

test('real audio advances, seeks, pauses, changes tracks, repeats, and survives navigation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play track Midnight Signal', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause playback', exact: true })).toBeVisible();
  await expect.poll(() => page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Pause playback', exact: true }).click();
  await expect.poll(() => page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.paused)).toBe(true);
  await page.getByRole('slider', { name: 'Seek playback' }).fill('10');
  await expect.poll(() => page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeCloseTo(10, 0);
  await page.getByRole('slider', { name: 'Volume', exact: true }).fill('0.3');
  await expect.poll(() => page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.volume)).toBeCloseTo(0.3);
  await page.getByRole('button', { name: 'Next track', exact: true }).click();
  await expect(page.locator('.player-track strong')).toHaveText('Glasshouse');
  await page.getByRole('button', { name: 'Your library', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A collection of you.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pause playback', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Repeat: off', exact: true }).click();
  await page.getByRole('button', { name: 'Repeat: all', exact: true }).click();
  await page.locator('audio').evaluate((audio: HTMLAudioElement) => { audio.currentTime = audio.duration - 0.1; });
  await expect.poll(() => page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeLessThan(5);
  await expect(page.locator('.player-track strong')).toHaveText('Glasshouse');
  await page.getByRole('button', { name: 'Open queue', exact: true }).click();
  await page.getByRole('dialog', { name: 'Your queue' }).getByRole('button', { name: /Quiet Hours/ }).click();
  await expect(page.locator('.player-track strong')).toHaveText('Quiet Hours');
  await page.getByRole('button', { name: 'Close queue', exact: true }).click();
  await page.getByRole('button', { name: 'Repeat: one', exact: true }).click();
  await page.locator('audio').evaluate((audio: HTMLAudioElement) => { audio.currentTime = audio.duration - 0.1; });
  await expect(page.getByRole('button', { name: 'Start playback', exact: true })).toBeVisible();
});

test('keyboard-accessible settings persist and dialogs close with Escape', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open settings', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('combobox', { name: 'STREAMING QUALITY' }).selectOption('96');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: 'Open settings', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'STREAMING QUALITY' })).toHaveValue('96');
  await page.keyboard.press('Escape');
  await page.locator('body').click({ position: { x: 900, y: 100 } });
  await page.keyboard.press('/');
  await expect(page.getByRole('textbox', { name: 'Search music' })).toBeFocused();
});

test('invalid stored library data recovers without crashing', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('noir-likes', '{not-json');
    sessionStorage.setItem('noir-playlists', JSON.stringify([{ id: 'bad', name: 'Broken', songs: [{ id: 'x' }] }]));
    sessionStorage.setItem('noir-volume', '99');
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Your library', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A collection of you.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Broken', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /Liked songs.*forever favorites/ }).click();
  await expect(page.getByText('Your favorites start here.')).toBeVisible();
});
