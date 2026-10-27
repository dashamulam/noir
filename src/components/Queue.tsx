import { AudioLines, ListMusic, Play } from 'lucide-react';
import type { PlayerState } from '../hooks/usePlayer';
import { artistName, text } from '../lib/api';
import { Artwork } from './Artwork';
import { Dialog } from './Dialog';

export function Queue({ player, close }: { player: PlayerState; close: () => void }) {
  return <Dialog title="Your queue" close={close} closeLabel="Close queue" className="queue-dialog">
    <p className="queue-count">{player.queue.length} songs in your listening session</p>
    {!player.queue.length ? <div className="empty-state"><ListMusic size={32} /><h3>Good things are coming.</h3><p>Play a collection or add a song to get started.</p></div> :
      <div className="queue-songs">{player.queue.map((song, index) => <button className={`queue-song ${player.index === index ? 'active' : ''}`} key={song.id} aria-label={`Play ${text(song.name)} from queue`} aria-current={player.index === index ? 'true' : undefined} onClick={() => player.select(index)}>
        <Artwork image={song.image} /><span className="track-copy"><strong>{text(song.name)}</strong><small>{artistName(song)}</small></span>{player.index === index ? <AudioLines size={20} /> : <Play size={18} />}
      </button>)}</div>}
  </Dialog>;
}
