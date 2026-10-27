import { useEffect, useRef, useState } from 'react';
import { searchSongs } from '../lib/api';
import type { Song } from '../types';

export function useCatalog(query: string) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const activeQuery = useRef(query);

  useEffect(() => {
    const controller = new AbortController();
    const changed = activeQuery.current !== query;
    activeQuery.current = query;
    if (changed) { setSongs([]); setTotal(0); setPage(0); }
    if (!query) { setSongs([]); setLoading(false); setError(''); return; }
    if (changed && page !== 0) return;
    setLoading(true);
    setError('');
    const timer = window.setTimeout(() => {
      searchSongs(query, page, controller.signal)
        .then(data => {
          if (controller.signal.aborted) return;
          setSongs(previous => page === 0 ? data.results : [...new Map([...previous, ...data.results].map(song => [song.id, song])).values()]);
          setTotal(data.results.length < 24 ? 0 : data.total);
        })
        .catch((reason: Error) => { if (!controller.signal.aborted) setError(reason.message); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, page, revision]);

  return { songs, loading, error, hasMore: songs.length < total, more: () => setPage(p => p + 1), retry: () => setRevision(r => r + 1) };
}
