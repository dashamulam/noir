import { useCallback, useEffect, useState } from 'react';
import { moods } from '../lib/catalog';
import type { Mood } from '../types';

export type View = { name: 'discover' | 'search' | 'library' | 'liked' | 'recent' }
  | { name: 'mood'; mood: Mood } | { name: 'playlist'; id: string };

function readView(): View {
  const [name, value] = location.hash.slice(1).split('/');
  if (name === 'mood') {
    const mood = moods.find(item => item.id === value);
    if (mood) return { name, mood };
  }
  if (name === 'playlist' && value) {
    try { return { name, id: decodeURIComponent(value) }; } catch { /* Fall back to Discover for malformed links. */ }
  }
  if (name === 'search' || name === 'library' || name === 'liked' || name === 'recent') return { name };
  return { name: 'discover' };
}

export function useNavigation() {
  const [view, setView] = useState<View>(readView);
  useEffect(() => {
    const restore = () => setView(readView());
    window.addEventListener('popstate', restore);
    window.addEventListener('hashchange', restore);
    return () => {
      window.removeEventListener('popstate', restore);
      window.removeEventListener('hashchange', restore);
    };
  }, []);
  const navigate = useCallback((next: View) => {
    const hash = next.name === 'mood' ? `mood/${next.mood.id}` : next.name === 'playlist' ? `playlist/${encodeURIComponent(next.id)}` : next.name;
    if (location.hash !== `#${hash}`) history.pushState(null, '', `#${hash}`);
    setView(next);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  return { view, navigate };
}
