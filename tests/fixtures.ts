import type { Page } from '@playwright/test';

function tone() {
  const rate = 8000;
  const samples = rate * 24;
  const buffer = Buffer.alloc(44 + samples * 2);
  buffer.write('RIFF', 0); buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write('WAVEfmt ', 8); buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24); buffer.writeUInt32LE(rate * 2, 28);
  buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36); buffer.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++) buffer.writeInt16LE(Math.round(Math.sin(i / rate * Math.PI * 440 * 2) * 200), 44 + i * 2);
  return buffer;
}

const names = ['Midnight Signal', 'Glasshouse', 'Quiet Hours'];
export function songs(query = '', count = 3, offset = 0) {
  return Array.from({ length: count }, (_, i) => ({
    id: `song-${i + offset}`,
    name: query === 'fast' || query === 'slow' ? `${query} result ${i}` : names[(i + offset) % 3] + (count > 3 || offset ? ` ${i + offset}` : ''),
    duration: 24, album: { name: 'The Monochrome Sessions' },
    artists: { primary: [{ id: 'artist-1', name: 'NOIR Test Artist' }] },
    image: [{ quality: '500x500', url: 'http://127.0.0.1:5174/test-cover.svg' }],
    downloadUrl: [{ quality: '320kbps', url: 'http://127.0.0.1:5174/test-tone.wav' }],
  }));
}

export async function fixtures(page: Page) {
  await page.route('**/test-tone.wav', route => route.fulfill({ contentType: 'audio/wav', body: tone() }));
  await page.route('**/test-cover.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#d1456c"/><circle cx="50" cy="50" r="30" fill="#4e9aeb"/></svg>' }));
  await page.route(/https:\/\/(images\.unsplash\.com|fonts\.(googleapis|gstatic)\.com)\//, route => route.abort());
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get('query') || '';
    if (query === 'slow') await new Promise(resolve => setTimeout(resolve, 900));
    if (query === 'broken') { await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }); return; }
    const pageNumber = Number(url.searchParams.get('page') || 0);
    const results = query === 'empty' ? [] : query === 'many' ? songs('', pageNumber ? 3 : 24, pageNumber * 24) : songs(query);
    await route.fulfill({ json: { success: true, data: { total: query === 'many' ? 27 : results.length, start: pageNumber * 24, results } } });
  });
}
