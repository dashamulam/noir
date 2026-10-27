import { Heart, ListMusic, LoaderCircle, Pause, Play, Plus, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { PlayerState } from '../hooks/usePlayer';
import type { Song } from '../types';
import { artistName, duration, text } from '../lib/api';
import { Artwork } from './Artwork';
import { Dialog } from './Dialog';

export function NowPlaying({ player: p, liked, like, close, openQueue, addToPlaylist }: {
  player: PlayerState; liked: boolean; like: (song: Song) => void; close: () => void;
  openQueue: () => void; addToPlaylist: (song: Song) => void;
}) {
  const song = p.current;
  if (!song) return null;
  return <Dialog title="Now playing" close={close} closeLabel="Close now playing" className="now-playing-dialog">
    <div className="expanded-player">
      <div className="expanded-art"><Artwork image={song.image} alt={`${text(song.name)} artwork`} /></div>
      <div className="expanded-details">
        <span className="eyebrow">YOUR OWN LITTLE UNIVERSE</span>
        <div className="expanded-track">
          <div><h3>{text(song.name)}</h3><p>{artistName(song)}</p></div>
          <button className={`icon-button ${liked ? 'liked' : ''}`} aria-label={liked ? 'Unlike current song' : 'Like current song'} aria-pressed={liked} onClick={() => like(song)}><Heart size={23} fill={liked ? 'currentColor' : 'none'} /></button>
        </div>
        {p.error && <p className="playback-error" role="alert">{p.error}</p>}
        <div className="expanded-progress">
          <input type="range" aria-label="Seek playback" aria-valuetext={`${duration(p.position)} of ${duration(p.length)}`} min={0} max={p.length || 1} step={0.1} value={Math.min(p.position, p.length || 1)} disabled={!p.length} onChange={event => p.seek(Number(event.target.value))} style={{ '--progress': `${p.length ? Math.min(100, p.position / p.length * 100) : 0}%` } as CSSProperties} />
          <div className="expanded-times"><span>{duration(p.position)}</span><span>{duration(p.length)}</span></div>
        </div>
        <div className="expanded-controls">
          <button className={`icon-button ${p.shuffle ? 'selected' : ''}`} aria-label="Shuffle" aria-pressed={p.shuffle} onClick={() => p.setShuffle(!p.shuffle)}><Shuffle size={22} /></button>
          <button className="icon-button" aria-label="Previous track" onClick={p.previous}><SkipBack size={27} fill="currentColor" /></button>
          <button className="play-button expanded-play" aria-label={p.playing ? 'Pause playback' : 'Start playback'} onClick={p.toggle}>{p.buffering ? <LoaderCircle className="spin" size={30} /> : p.playing ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}</button>
          <button className="icon-button" aria-label="Next track" onClick={p.next}><SkipForward size={27} fill="currentColor" /></button>
          <button className={`icon-button ${p.repeat !== 'off' ? 'selected' : ''}`} aria-label={`Repeat: ${p.repeat}`} onClick={p.cycleRepeat}>{p.repeat === 'one' ? <Repeat1 size={22} /> : <Repeat size={22} />}</button>
        </div>
        <div className="expanded-volume">
          <button className="icon-button" aria-label={p.muted ? 'Unmute' : 'Mute'} onClick={() => p.setMuted(!p.muted)}>{p.muted ? <VolumeX size={19} /> : <Volume2 size={19} />}</button>
          <input type="range" aria-label="Volume" min={0} max={1} step={0.01} value={p.muted ? 0 : p.volume} onChange={event => { p.setMuted(false); p.setVolume(Number(event.target.value)); }} style={{ '--progress': `${p.muted ? 0 : p.volume * 100}%` } as CSSProperties} />
        </div>
        <p className="hardware-volume-hint">Use your phone’s volume buttons to adjust the sound.</p>
        <div className="expanded-actions">
          <button className="button secondary" onClick={() => addToPlaylist(song)}><Plus size={19} /> Save to playlist</button>
          <button className="button secondary" onClick={openQueue}><ListMusic size={19} /> Up next</button>
        </div>
      </div>
    </div>
  </Dialog>;
}
