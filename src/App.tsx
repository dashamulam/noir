import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, AudioLines, Check, Compass, Disc3, Headphones, Heart, History, Library, ListMusic, ListPlus, Play, Plus, Search, Settings2, Sparkles, Trash2, X } from 'lucide-react';
import { Artwork } from './components/Artwork';
import { Dialog } from './components/Dialog';
import { Player } from './components/Player';
import { SongList } from './components/SongList';
import { NowPlaying } from './components/NowPlaying';
import { Queue } from './components/Queue';
import { useCatalog } from './hooks/useCatalog';
import { useMobileViewport } from './hooks/useMobileViewport';
import { useNavigation } from './hooks/useNavigation';
import { usePlayer } from './hooks/usePlayer';
import { artwork, artistName, isSong, text } from './lib/api';
import { channels, moods } from './lib/catalog';
import { useStoredState } from './lib/storage';
import type { Playlist, Quality, Song } from './types';

type Modal = 'settings' | 'create' | 'now-playing' | { name: 'playlist'; song: Song } | { name: 'song-actions'; song: Song; removable: boolean } | null;
const validSongs = (value: unknown): value is Song[] => Array.isArray(value) && value.every(isSong);
const validPlaylists = (value: unknown): value is Playlist[] => Array.isArray(value) && value.every(p => typeof p?.id === 'string' && typeof p?.name === 'string' && validSongs(p?.songs));

export default function App() {
  const { view, navigate } = useNavigation();
  useMobileViewport();
  const [query, setQuery] = useState('');
  const [channel, setChannel] = useState(0);
  const [likes, setLikes] = useStoredState<Song[]>('noir-likes', [], validSongs);
  const [recent, setRecent] = useStoredState<Song[]>('noir-recent', [], validSongs);
  const [playlists, setPlaylists] = useStoredState<Playlist[]>('noir-playlists', [], validPlaylists);
  const [quality, setQuality] = useStoredState<Quality>('noir-quality', '320', (v): v is Quality => v === '320' || v === '160' || v === '96');
  const [modal, setModal] = useState<Modal>(null);
  const [queueOpen, setQueueOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [toast, setToast] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const notify = useCallback((message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 5500);
  }, []);
  const player = usePlayer(quality, notify);
  const catalogQuery = view.name === 'discover' ? channels[channel].query : view.name === 'search' ? query.trim() : view.name === 'mood' ? view.mood.query : '';
  const catalog = useCatalog(catalogQuery);
  const selectedPlaylist = view.name === 'playlist' ? playlists.find(p => p.id === view.id) : undefined;
  const closeModal = useCallback(() => setModal(null), []);
  const openQueue = useCallback(() => { setModal(null); setQueueOpen(true); }, []);

  useEffect(() => {
    if (player.current) setRecent(old => [player.current!, ...old.filter(song => song.id !== player.current!.id)].slice(0, 30));
  // History updates once per selected track, rather than on queue changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.current?.id, setRecent]);

  useEffect(() => {
    const onStorageError = () => notify('Your browser storage is full or unavailable. Library changes may not survive a refresh.');
    window.addEventListener('noir-storage-error', onStorageError);
    return () => { window.removeEventListener('noir-storage-error', onStorageError); clearTimeout(toastTimer.current); };
  }, [notify]);

  useEffect(() => {
    const closeOverlay = () => { setModal(null); setQueueOpen(false); };
    window.addEventListener('popstate', closeOverlay);
    return () => window.removeEventListener('popstate', closeOverlay);
  }, []);

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (modal || queueOpen || /INPUT|TEXTAREA|SELECT|BUTTON/.test(target.tagName) || target.isContentEditable || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === '/') { event.preventDefault(); searchRef.current?.focus(); }
      if (event.code === 'Space') { event.preventDefault(); player.toggle(); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [player.toggle, modal, queueOpen]);

  const like = (song: Song) => {
    const exists = likes.some(item => item.id === song.id);
    setLikes(old => exists ? old.filter(item => item.id !== song.id) : [song, ...old]);
    notify(exists ? 'Removed from liked songs.' : 'Saved to your liked songs.');
  };
  const createPlaylist = (event: FormEvent) => {
    event.preventDefault();
    const name = playlistName.trim();
    if (!name) return;
    const song = modal && typeof modal === 'object' && modal.name === 'playlist' ? modal.song : undefined;
    const playlist: Playlist = { id: globalThis.crypto?.randomUUID?.() || `playlist-${Date.now()}-${Math.random().toString(36).slice(2)}`, name, songs: song ? [song] : [], createdAt: Date.now() };
    setPlaylists(old => [...old, playlist]); setPlaylistName(''); setModal(null);
    notify(song ? `Added to ${name}.` : `${name} is ready for your music.`);
    if (!song) navigate({ name: 'playlist', id: playlist.id });
  };
  const addToPlaylist = (playlist: Playlist, song: Song) => {
    if (playlist.songs.some(item => item.id === song.id)) { notify('This song is already in that playlist.'); return; }
    setPlaylists(old => old.map(p => p.id === playlist.id ? { ...p, songs: [...p.songs, song] } : p));
    setModal(null); notify(`Added to ${playlist.name}.`);
  };
  const removeSong = (song: Song) => {
    if (!selectedPlaylist) return;
    setPlaylists(old => old.map(p => p.id === selectedPlaylist.id ? { ...p, songs: p.songs.filter(item => item.id !== song.id) } : p));
    notify('Removed from playlist.');
  };
  const songProps = {
    player, likes, like,
    addToPlaylist: (song: Song) => { setPlaylistName(''); setModal({ name: 'playlist', song }); },
    openActions: (song: Song, removable: boolean) => setModal({ name: 'song-actions', song, removable }),
  };
  const playlistSong = modal && typeof modal === 'object' && modal.name === 'playlist' ? modal.song : undefined;
  const actionSheet = modal && typeof modal === 'object' && modal.name === 'song-actions' ? modal : undefined;
  const collectionSongs = view.name === 'liked' ? likes : view.name === 'recent' ? recent : view.name === 'playlist' ? selectedPlaylist?.songs || [] : catalog.songs;
  const collectionTitle = view.name === 'liked' ? 'Liked songs' : view.name === 'recent' ? 'Recently played' : view.name === 'playlist' ? selectedPlaylist?.name || 'Playlist not found' : view.name === 'mood' ? view.mood.name : '';
  const navItems = [
    { name: 'discover' as const, label: 'Discover', icon: Compass },
    { name: 'search' as const, label: 'Search', icon: Search },
    { name: 'library' as const, label: 'Your library', icon: Library },
  ];
  const mobileItems = [...navItems, { name: 'liked' as const, label: 'Favorites', icon: Heart }];

  return <div className={`app-shell ${player.current ? 'has-track' : ''}`}>
    <a className="skip-link" href="#main" onClick={event => { event.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to music</a>
    <audio ref={player.audioRef} preload="metadata" playsInline />
    <aside className="sidebar" aria-label="Main navigation">
      <button className="brand" aria-label="NOIR home" onClick={() => navigate({ name: 'discover' })}><AudioLines size={31} strokeWidth={2} /><span>noir<span className="brand-dot">.</span></span></button>
      <span className="brand-caption">SOUND. IN ITS PUREST FORM.</span>
      <div className="nav-label">YOUR SPACE</div>
      <nav className="main-nav">{navItems.map(item => <button className={`nav-item ${view.name === item.name ? 'active' : ''}`} key={item.name} onClick={() => { navigate({ name: item.name }); if (item.name === 'search') searchRef.current?.focus(); }} aria-current={view.name === item.name ? 'page' : undefined}><item.icon size={19} /><span>{item.label}</span>{view.name === item.name && <span className="nav-active-dot" />}</button>)}</nav>
      <div className="sidebar-rule" />
      <div className="nav-label collections-label">YOUR COLLECTION<button className="icon-button" aria-label="Create playlist" onClick={() => { setPlaylistName(''); setModal('create'); }}><Plus size={16} /></button></div>
      <nav className="collection-nav">
        <button className={`nav-item ${view.name === 'liked' ? 'active' : ''}`} onClick={() => navigate({ name: 'liked' })}><Heart size={18} /><span>Liked songs</span><small>{likes.length || ''}</small></button>
        <button className={`nav-item ${view.name === 'recent' ? 'active' : ''}`} onClick={() => navigate({ name: 'recent' })}><History size={18} /><span>Recently played</span></button>
        {playlists.map(playlist => <button key={playlist.id} className={`nav-item ${view.name === 'playlist' && view.id === playlist.id ? 'active' : ''}`} onClick={() => navigate({ name: 'playlist', id: playlist.id })}><ListMusic size={18} /><span className="truncate">{playlist.name}</span></button>)}
      </nav>
      <button className="new-playlist" onClick={() => { setPlaylistName(''); setModal('create'); }}><span><Plus size={16} /></span> Create a playlist</button>
      <div className="sidebar-bottom"><div className="listening-card"><Headphones size={24} /><h3>A world of your own.</h3><p>Put your headphones on.<br />Let everything else fade.</p><span>JUST YOU & THE MUSIC <ArrowDownLeft size={14} /></span></div><div className="sidebar-footer"><span className="status-dot" /> POWERED BY JIOSAAVN</div></div>
    </aside>

    <div className="main-shell">
      <header className="topbar">
        <button className="mobile-brand" aria-label="NOIR home" onClick={() => navigate({ name: 'discover' })}><AudioLines size={27} /><span>noir.</span></button>
        <form className="search-box" role="search" onSubmit={event => { event.preventDefault(); navigate({ name: 'search' }); searchRef.current?.blur(); }}>
          <Search size={18} /><input ref={searchRef} aria-label="Search music" placeholder="Songs, artists, or a feeling…" enterKeyHint="search" autoComplete="off" autoCapitalize="none" spellCheck={false} value={query} onFocus={() => { if (query.trim() && view.name !== 'search') navigate({ name: 'search' }); }} onChange={event => { setQuery(event.target.value); if (view.name !== 'search') navigate({ name: 'search' }); }} />
          {query ? <button className="icon-button" type="button" aria-label="Clear search" onClick={() => { setQuery(''); searchRef.current?.focus(); }}><X size={15} /></button> : <kbd>/</kbd>}
        </form>
        <div className="topbar-right"><span className="topbar-note"><span className="status-dot" /> A GOOD DAY FOR GOOD MUSIC</span><button className="icon-button settings-button" aria-label="Open settings" onClick={() => setModal('settings')}><Settings2 size={19} /></button><button className="avatar" aria-label="Open your library" onClick={() => navigate({ name: 'library' })}>N<span /></button></div>
      </header>

      <main id="main" className="main-content" tabIndex={-1}>
        {view.name === 'discover' && <>
          <section className="page-intro"><div><span className="eyebrow">A SOUNDTRACK FOR EVERY VERSION OF YOU</span><h1>Find your frequency<span>.</span></h1><p>Your favorites. Your next discoveries. Your own little universe.</p></div><span className="intro-symbol"><Sparkles size={24} strokeWidth={1} /></span></section>
          <section className="mood-section"><div className="section-heading"><div><h2>Made for your mood<span className="tiny-dot">.</span></h2><p>Whatever you’re feeling, there’s a mix for that.</p></div><span className="section-kicker">PICK A FEELING <ArrowDownLeft size={14} /></span></div>
            <div className="mood-grid">{moods.map((mood, i) => <button className="mood-card" key={mood.id} onClick={() => navigate({ name: 'mood', mood })}><div className="mood-image"><Artwork src={mood.image} /><div className="mood-image-shade" /><span className="mood-number">NOIR / 0{i + 1}</span><span className="mood-art-title">{mood.name}</span><span className="mood-play"><ArrowUpRight size={22} /></span><span className="mood-tag">{mood.tag}</span></div><h3>{mood.name}</h3><p>{mood.description}</p></button>)}</div>
          </section>
          <section className="rotation-section"><div className="section-heading"><div><h2>On repeat<span className="tiny-dot">.</span></h2><p>Some songs just deserve another listen.</p></div><button className="text-button" onClick={() => { setQuery(channels[channel].query); navigate({ name: 'search' }); }}>View all <ArrowRight size={15} /></button></div>
            <div className="filter-chips" aria-label="Music languages">{channels.map((item, i) => <button key={item.name} className={channel === i ? 'active' : ''} aria-pressed={channel === i} onClick={() => setChannel(i)}>{item.name}</button>)}</div>
            <SongList {...songProps} songs={catalog.songs.slice(0, 6)} loading={catalog.loading} error={catalog.error} retry={catalog.retry} />
          </section>
          <section className="bottom-banner"><span className="banner-icon"><Disc3 size={28} strokeWidth={1.2} /></span><div><h3>Good music doesn’t need a reason.</h3><p>Stay a little longer. Find something new.</p></div><button className="button secondary" onClick={() => { navigate({ name: 'search' }); searchRef.current?.focus(); }}>Find your next favorite <ArrowUpRight size={16} /></button></section>
        </>}

        {view.name === 'search' && <>
          <section className="page-intro"><div><span className="eyebrow">FOLLOW YOUR CURIOSITY</span><h1>{query.trim() ? 'A little more your style.' : 'What moves you?'}</h1><p>{query.trim() ? <>Results for <strong>“{query.trim()}”</strong></> : 'A song, an artist, a feeling. Start anywhere.'}</p></div></section>
          {!query.trim() ? <><div className="search-suggestions"><span className="eyebrow">TRY SOMETHING GOOD</span><div className="filter-chips">{['Arijit Singh', 'The Weeknd', 'Anuv Jain', 'Billie Eilish', 'Diljit Dosanjh', 'A. R. Rahman', 'lofi', 'jazz'].map(term => <button key={term} onClick={() => setQuery(term)}><Search size={14} />{term}</button>)}</div></div><div className="mood-grid search-moods">{moods.map(mood => <button className="mood-card" key={mood.id} onClick={() => navigate({ name: 'mood', mood })}><div className="mood-image"><Artwork src={mood.image} /><div className="mood-image-shade" /><span className="mood-art-title">{mood.name}</span><span className="mood-play"><ArrowUpRight size={22} /></span></div><h3>{mood.name}</h3><p>{mood.description}</p></button>)}</div></> : <><SongList {...songProps} {...catalog} /><div className="load-more">{catalog.hasMore && <button className="button secondary" disabled={catalog.loading} onClick={catalog.more}>Discover more <Plus size={16} /></button>}</div></>}
        </>}

        {view.name === 'library' && <>
          <section className="page-intro"><div><span className="eyebrow">YOUR OWN LITTLE UNIVERSE</span><h1>A collection of you.</h1><p>The songs you love, in one beautiful place. Saved on this device.</p></div><button className="button primary" onClick={() => { setPlaylistName(''); setModal('create'); }}><Plus size={17} /> New playlist</button></section>
          <div className="library-grid"><button className="library-card liked-card" onClick={() => navigate({ name: 'liked' })}><div className="library-art"><Heart size={50} strokeWidth={1} fill="rgba(255,255,255,.12)" /><ArrowUpRight size={22} /></div><h3>Liked songs</h3><p>{likes.length} songs · Your forever favorites</p></button><button className="library-card" onClick={() => navigate({ name: 'recent' })}><div className="library-art recent-art"><History size={50} strokeWidth={1} /><ArrowUpRight size={22} /></div><h3>Recently played</h3><p>{recent.length} songs · Worth another listen</p></button>{playlists.map(p => <button className="library-card" key={p.id} onClick={() => navigate({ name: 'playlist', id: p.id })}><div className="library-art"><Artwork image={p.songs[0]?.image} /><span className="library-play"><Play size={24} /></span></div><h3>{p.name}</h3><p>{p.songs.length} songs · Made by you</p></button>)}<button className="library-create" onClick={() => { setPlaylistName(''); setModal('create'); }}><Plus size={32} strokeWidth={1} /><h3>Make room for more.</h3><p>Create a new playlist</p></button></div>
        </>}

        {['liked', 'recent', 'playlist', 'mood'].includes(view.name) && <>
          <button className="back-button" onClick={() => navigate({ name: view.name === 'mood' ? 'discover' : 'library' })}><ArrowLeft size={16} /> {view.name === 'mood' ? 'Back to discover' : 'Back to your library'}</button>
          <section className="collection-hero"><div className={`collection-cover ${view.name === 'liked' ? 'liked-cover' : ''}`}>{view.name === 'liked' ? <Heart size={85} strokeWidth={1} fill="rgba(255,255,255,.1)" /> : view.name === 'recent' ? <History size={85} strokeWidth={1} /> : <Artwork src={view.name === 'mood' ? view.mood.image : artwork(collectionSongs[0]?.image)} />}</div><div className="collection-details"><span className="eyebrow">{view.name === 'mood' ? 'A NOIR COLLECTION' : 'YOUR PERSONAL COLLECTION'}</span><h1>{collectionTitle}</h1><p>{view.name === 'mood' ? view.mood.description : 'A little piece of your world, one song at a time.'}</p><span className="collection-meta"><AudioLines size={14} /> {view.name === 'mood' ? 'NOIR' : 'Made by you'} <span>·</span> {collectionSongs.length} songs</span><div className="collection-actions"><button className="button primary" disabled={!collectionSongs.length} onClick={() => player.play(collectionSongs[0], collectionSongs)}><Play size={16} fill="currentColor" /> Play collection</button>{selectedPlaylist && <button className="icon-button" aria-label="Delete playlist" onClick={() => { if (window.confirm(`Delete “${selectedPlaylist.name}”? This removes the playlist from this device.`)) { setPlaylists(old => old.filter(p => p.id !== selectedPlaylist.id)); navigate({ name: 'library' }); notify('Playlist deleted.'); } }}><Trash2 size={18} /></button>}</div></div></section>
          <SongList {...songProps} songs={collectionSongs} loading={view.name === 'mood' && catalog.loading} error={view.name === 'mood' ? catalog.error : undefined} retry={catalog.retry} remove={selectedPlaylist ? removeSong : undefined} emptyTitle={view.name === 'liked' ? 'Your favorites start here.' : view.name === 'recent' ? 'Your story is still unwritten.' : 'Every great playlist starts with one song.'} emptyText={view.name === 'liked' ? 'Tap the heart beside any song to keep it close.' : view.name === 'recent' ? 'Play something you love. You’ll find it here when you come back.' : 'Find a song you love, then use the + button to add it here.'} />
          {view.name === 'mood' && catalog.hasMore && <div className="load-more"><button className="button secondary" disabled={catalog.loading} onClick={catalog.more}>More from this mood <Plus size={16} /></button></div>}
        </>}
        <footer className="content-footer"><span>noir.</span><p>Less noise. More music.</p><span>BUILT FOR LISTENING <Headphones size={13} /></span></footer>
      </main>
    </div>

    {queueOpen && <Queue player={player} close={() => setQueueOpen(false)} />}
    <Player player={player} likes={likes} like={like} openQueue={openQueue} openNowPlaying={() => setModal('now-playing')} queueOpen={queueOpen} />
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {mobileItems.map(item => {
        const active = view.name === item.name || (item.name === 'discover' && view.name === 'mood') || (item.name === 'library' && (view.name === 'playlist' || view.name === 'recent'));
        return <button key={item.name} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} onClick={() => { navigate({ name: item.name }); if (item.name === 'search') searchRef.current?.focus(); else searchRef.current?.blur(); }}><item.icon size={22} strokeWidth={active ? 2.1 : 1.7} /><span>{item.label}</span></button>;
      })}
    </nav>
    {toast && <div className="toast" role="status"><span>{toast}</span><button className="icon-button" aria-label="Dismiss notification" onClick={() => setToast('')}><X size={16} /></button></div>}

    {modal === 'settings' && <Dialog title="Make yourself at home." close={closeModal}><p className="dialog-description">Small details. A better listening experience.</p><label className="field-label" htmlFor="quality">STREAMING QUALITY</label><select id="quality" value={quality} onChange={event => setQuality(event.target.value as Quality)}><option value="320">High quality · up to 320 kbps</option><option value="160">Balanced · up to 160 kbps</option><option value="96">Data saver · up to 96 kbps</option></select><p className="field-hint">Uses the best available stream up to your selection. Changing quality restarts the current track.</p><div className="settings-info"><Headphones size={20} /><div><strong>Your music, your space.</strong><p>Liked songs, playlists, history, and preferences are saved in this browser. No account needed.</p></div></div><div className="keyboard-hints"><span><kbd>Space</kbd> Play / pause</span><span><kbd>/</kbd> Find music</span></div><a className="api-credit" href="https://github.com/sumitkolhe/jiosaavn-api" target="_blank" rel="noreferrer">Powered by sumitkolhe / jiosaavn-api <ArrowUpRight size={15} /></a></Dialog>}
    {(modal === 'create' || playlistSong) && <Dialog title={playlistSong ? 'Keep this one close.' : 'Give your playlist a name.'} close={closeModal}>
      <p className="dialog-description">{playlistSong ? `Add “${text(playlistSong.name)}” to your collection.` : 'For a mood, a moment, or absolutely no reason.'}</p>
      {playlistSong && <div className="playlist-options">{playlists.map(p => <button key={p.id} onClick={() => addToPlaylist(p, playlistSong)}><span className="playlist-option-icon"><ListMusic size={19} /></span><span><strong>{p.name}</strong><small>{p.songs.length} songs</small></span>{p.songs.some(s => s.id === playlistSong.id) ? <Check size={18} /> : <Plus size={18} />}</button>)}</div>}
      <form onSubmit={createPlaylist}><label className="field-label" htmlFor="playlist-name">{playlistSong ? 'OR CREATE SOMETHING NEW' : 'PLAYLIST NAME'}</label><input id="playlist-name" className="text-input" placeholder="e.g. Somewhere after midnight" autoFocus={!playlistSong || !playlists.length} enterKeyHint="done" autoComplete="off" maxLength={60} required value={playlistName} onChange={event => setPlaylistName(event.target.value)} /><button className="button primary dialog-submit" disabled={!playlistName.trim()} type="submit"><Plus size={16} />{playlistSong ? 'Create & add song' : 'Create playlist'}</button></form>
    </Dialog>}
    {actionSheet && <Dialog title="Song options" close={closeModal} className="song-action-dialog">
      <div className="action-track"><Artwork image={actionSheet.song.image} /><div><h3>{text(actionSheet.song.name)}</h3><p>{artistName(actionSheet.song)}</p></div></div>
      <div className="song-action-buttons">
        <button onClick={() => { like(actionSheet.song); closeModal(); }}><Heart size={21} fill={likes.some(song => song.id === actionSheet.song.id) ? 'currentColor' : 'none'} />{likes.some(song => song.id === actionSheet.song.id) ? 'Remove from liked songs' : 'Add to liked songs'}</button>
        <button onClick={() => songProps.addToPlaylist(actionSheet.song)}><Plus size={22} /> Add to playlist</button>
        <button onClick={() => { player.add(actionSheet.song); openQueue(); }}><ListPlus size={22} /> Add to queue</button>
        {actionSheet.removable && <button onClick={() => { removeSong(actionSheet.song); closeModal(); }}><Trash2 size={21} /> Remove from this playlist</button>}
      </div>
    </Dialog>}
    {modal === 'now-playing' && <NowPlaying player={player} liked={!!player.current && likes.some(song => song.id === player.current.id)} like={like} close={closeModal} openQueue={openQueue} addToPlaylist={songProps.addToPlaylist} />}
  </div>;
}
