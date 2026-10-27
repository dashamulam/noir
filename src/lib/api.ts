import type { MediaLink, SearchResult, Song } from '../types';

export function text(value: string | null | undefined): string {
  if (!value) return '';
  const element = document.createElement('textarea');
  element.innerHTML = value;
  return element.value;
}

export function safeUrl(value: string | undefined): string {
  if (!value) return '';
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

export function artwork(links?: MediaLink[]): string {
  const sorted = [...(links || [])].sort((a, b) => parseInt(b.quality) - parseInt(a.quality));
  return sorted.map(link => safeUrl(link.url)).find(Boolean) || '/cover.svg';
}

export function artistName(song: Song): string {
  return song.artists.primary.map(artist => text(artist.name)).join(', ') || 'Unknown artist';
}

export function duration(seconds: number | null | undefined): string {
  const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds!)) : 0;
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

export function isSong(value: unknown): value is Song {
  if (!value || typeof value !== 'object') return false;
  const song = value as Song;
  return typeof song.id === 'string' && typeof song.name === 'string'
    && !!song.album && Array.isArray(song.artists?.primary)
    && song.artists.primary.every(a => typeof a?.name === 'string')
    && Array.isArray(song.image) && Array.isArray(song.downloadUrl)
    && [...song.image, ...song.downloadUrl].every(link => typeof link?.url === 'string' && typeof link?.quality === 'string');
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = window.setTimeout(() => { timedOut = true; controller.abort(); }, 22000);
  try {
    const response = await fetch(`/api${path}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`The music service returned ${response.status}. Please try again shortly.`);
    const body = await response.json();
    if (!body.success || body.data == null) throw new Error('The music service could not complete this request. Please try again.');
    return body.data as T;
  } catch (error) {
    if (signal?.aborted) throw error;
    if (timedOut) throw new Error('The music service is taking a little longer. Please try again.');
    if (error instanceof TypeError || error instanceof SyntaxError) throw new Error('Cannot reach the music service. Check your connection or the configured API address.');
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

export async function searchSongs(query: string, page = 0, signal?: AbortSignal): Promise<SearchResult> {
  const data = await request<SearchResult>(`/search/songs?${new URLSearchParams({ query, page: String(page), limit: '24' })}`, signal);
  if (!Array.isArray(data.results)) throw new Error('The music service returned an unexpected response.');
  return { ...data, results: data.results.filter(isSong) };
}

export async function getSong(id: string, signal?: AbortSignal): Promise<Song> {
  const data = await request<Song[]>(`/songs/${encodeURIComponent(id)}`, signal);
  if (!Array.isArray(data) || !isSong(data[0])) throw new Error('This song is currently unavailable. Try another track.');
  return data[0];
}
