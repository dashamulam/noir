import { Clock3, Heart, ListPlus, LoaderCircle, MoreHorizontal, Music2, Pause, Play, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { artistName, duration, text } from '../lib/api';
import type { Song } from '../types';
import type { PlayerState } from '../hooks/usePlayer';
import { Artwork } from './Artwork';

type Props = {
  songs: Song[]; player: PlayerState; likes: Song[]; like: (song: Song) => void;
  addToPlaylist: (song: Song) => void; loading?: boolean; error?: string; retry?: () => void;
  openActions: (song: Song, removable: boolean) => void;
  remove?: (song: Song) => void; compact?: boolean; emptyTitle?: string; emptyText?: string;
};

export function SongList({ songs, player, likes, like, addToPlaylist, openActions, loading, error, retry, remove, compact, emptyTitle = 'A little quiet here.', emptyText = 'Try a different song, artist, or mood.' }: Props) {
  if (loading && !songs.length) return <div className="song-skeletons" aria-label="Loading songs" role="status">{Array.from({ length: 5 }, (_, i) => <div className="song-skeleton" key={i}><i /><span /><span /></div>)}</div>;
  if (error && !songs.length) return <div className="empty-state" role="alert"><Music2 size={30} /><h3>Let’s get you reconnected.</h3><p>{error}</p><button className="button secondary" onClick={retry}><RefreshCw size={15} /> Try again</button></div>;
  if (!songs.length) return <div className="empty-state"><Music2 size={32} /><h3>{emptyTitle}</h3><p>{emptyText}</p></div>;

  return <div className={`song-list ${compact ? 'compact' : ''}`}>
    <div className="song-table-heading" aria-hidden="true"><span>#</span><span>TRACK / ARTIST</span><span className="album-cell">ALBUM</span><Clock3 size={14} /><span /></div>
    {songs.map((song, index) => {
      const active = player.current?.id === song.id;
      const liked = likes.some(item => item.id === song.id);
      return <div className={`song-row ${active ? 'current' : ''}`} key={song.id}>
        <button className="track-number" aria-label={`${active && player.playing ? 'Pause' : 'Play'} ${text(song.name)}`} onClick={() => active ? player.toggle() : player.play(song, songs)}>
          {active && player.buffering ? <LoaderCircle className="spin" size={16} /> : active && player.playing ? <><span className="equalizer"><i /><i /><i /></span><Pause className="row-play-icon" size={15} /></> : <><span className="row-number">{String(index + 1).padStart(2, '0')}</span><Play className="row-play-icon" size={15} fill="currentColor" /></>}
        </button>
        <button className="track-main" onClick={() => active ? player.toggle() : player.play(song, songs)} aria-label={`${active && player.playing ? 'Pause' : 'Play'} track ${text(song.name)}`}>
          <Artwork image={song.image} /><span className="track-copy"><strong>{text(song.name)}</strong><small>{artistName(song)}</small></span>
        </button>
        <span className="album-cell truncate">{text(song.album.name) || 'Single'}</span>
        <span className="track-time">{duration(song.duration)}</span>
        <div className="track-actions">
          <button className={`icon-button like-button ${liked ? 'liked' : ''}`} aria-label={`${liked ? 'Unlike' : 'Like'} ${text(song.name)}`} aria-pressed={liked} onClick={() => like(song)}><Heart size={16} fill={liked ? 'currentColor' : 'none'} /></button>
          <button className="icon-button playlist-add" aria-label={`Add ${text(song.name)} to a playlist`} onClick={() => addToPlaylist(song)}><Plus size={17} /></button>
          {remove ? <button className="icon-button" aria-label={`Remove ${text(song.name)} from playlist`} onClick={() => remove(song)}><Trash2 size={15} /></button> : <button className="icon-button queue-add" aria-label={`Queue ${text(song.name)}`} onClick={() => player.add(song)}><ListPlus size={17} /></button>}
        </div>
        <button className="icon-button mobile-song-menu" aria-label={`More options for ${text(song.name)}`} aria-haspopup="dialog" onClick={() => openActions(song, !!remove)}><MoreHorizontal size={23} /></button>
      </div>;
    })}
    {error && <div className="inline-error" role="alert">{error} <button className="text-button" onClick={retry}>Retry</button></div>}
    {loading && <div className="loading-more" role="status"><LoaderCircle size={18} className="spin" /> Finding more music…</div>}
  </div>;
}
