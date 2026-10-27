import { AudioLines, ChevronUp, Heart, ListMusic, LoaderCircle, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { PlayerState } from '../hooks/usePlayer';
import type { Song } from '../types';
import { artistName, duration, text } from '../lib/api';
import { Artwork } from './Artwork';

export function Player({ player: p, likes, like, openQueue, openNowPlaying, queueOpen }: { player: PlayerState; likes: Song[]; like: (song: Song) => void; openQueue: () => void; openNowPlaying: () => void; queueOpen: boolean }) {
  const liked = !!p.current && likes.some(song => song.id === p.current.id);
  return <footer className="player" aria-label="Music player">
    <div className="player-track">
      <button className="player-summary" disabled={!p.current} aria-label="Open now playing" onClick={openNowPlaying}>
        <span className="player-art">
          {p.current ? <Artwork image={p.current.image} /> : <AudioLines size={24} />}
          {p.current && <span><ChevronUp size={20} /></span>}
        </span>
        <span className="track-copy"><strong>{p.current ? text(p.current.name) : 'A little music. A little escape.'}</strong><small>{p.current ? artistName(p.current) : 'Find something that feels like you.'}</small></span>
      </button>
      <button className={`icon-button player-like ${liked ? 'liked' : ''}`} disabled={!p.current} aria-label={liked ? 'Unlike current song' : 'Like current song'} aria-pressed={liked} onClick={() => p.current && like(p.current)}><Heart size={17} fill={liked ? 'currentColor' : 'none'} /></button>
    </div>
    <div className="player-middle">
      <div className="playback-controls">
        <button className={`icon-button extra-control ${p.shuffle ? 'selected' : ''}`} aria-label="Shuffle" aria-pressed={p.shuffle} onClick={() => p.setShuffle(!p.shuffle)}><Shuffle size={16} /></button>
        <button className="icon-button previous-control" disabled={!p.current} aria-label="Previous track" onClick={p.previous}><SkipBack size={19} fill="currentColor" /></button>
        <button className="play-button" disabled={!p.current} aria-label={p.playing ? 'Pause playback' : 'Start playback'} onClick={p.toggle}>{p.buffering ? <LoaderCircle className="spin" size={20} /> : p.playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>
        <button className="icon-button" disabled={!p.current} aria-label="Next track" onClick={p.next}><SkipForward size={19} fill="currentColor" /></button>
        <button className={`icon-button extra-control ${p.repeat !== 'off' ? 'selected' : ''}`} aria-label={`Repeat: ${p.repeat}`} onClick={p.cycleRepeat}>{p.repeat === 'one' ? <Repeat1 size={17} /> : <Repeat size={17} />}</button>
      </div>
      <div className="seek-bar"><span>{duration(p.position)}</span><input type="range" aria-label="Seek playback" min={0} max={p.length || 1} step={0.1} value={Math.min(p.position, p.length || 1)} disabled={!p.current || !p.length} onChange={event => p.seek(Number(event.target.value))} style={{ '--progress': `${p.length ? p.position / p.length * 100 : 0}%` } as CSSProperties} /><span>{duration(p.length)}</span></div>
    </div>
    <div className="player-right">
      <span className="quality-label">HI-FI</span><span className="player-divider" />
      <button className="icon-button volume-button" aria-label={p.muted ? 'Unmute' : 'Mute'} onClick={() => p.setMuted(!p.muted)}>{p.muted || p.volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
      <input className="volume-range" type="range" aria-label="Volume" min={0} max={1} step={0.01} value={p.muted ? 0 : p.volume} onChange={event => { p.setVolume(Number(event.target.value)); p.setMuted(false); }} style={{ '--progress': `${p.muted ? 0 : p.volume * 100}%` } as CSSProperties} />
      <button className={`icon-button queue-toggle ${queueOpen ? 'selected' : ''}`} aria-label="Open queue" aria-pressed={queueOpen} onClick={openQueue}><ListMusic size={20} /></button>
    </div>
    <div className="mobile-play-progress" aria-hidden="true"><span style={{ width: `${p.length ? Math.min(100, p.position / p.length * 100) : 0}%` }} /></div>
  </footer>;
}
