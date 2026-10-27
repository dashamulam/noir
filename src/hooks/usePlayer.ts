import { useCallback, useEffect, useRef, useState } from 'react';
import { artwork, artistName, getSong, safeUrl, text } from '../lib/api';
import { useStoredState } from '../lib/storage';
import type { Quality, Song } from '../types';

export function usePlayer(quality: Quality, notify: (message: string) => void) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState('');
  const [position, setPosition] = useState(0);
  const [length, setLength] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>('off');
  const [volume, setVolume] = useStoredState('noir-volume', 0.7, (v): v is number => typeof v === 'number' && v >= 0 && v <= 1);
  const [muted, setMuted] = useState(false);
  const current = queue[index];
  const currentRef = useRef(current);
  currentRef.current = current;
  const requestId = useRef(0);
  const pending = useRef<AbortController | null>(null);
  const loadedKey = useRef('');
  const qualityRef = useRef(quality);
  qualityRef.current = quality;

  const tryPlay = useCallback(async () => {
    const id = requestId.current;
    setError('');
    try { await audioRef.current?.play(); }
    catch (error) {
      if (id !== requestId.current) return;
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setBuffering(false);
      const message = error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'Ready when you are. Press play to start listening.'
        : 'This track could not be played. Try another song or a lower audio quality.';
      setError(message);
      notify(message);
    }
  }, [notify]);

  // Start known streams inside the tap handler. Deferring play() to a React
  // effect can lose the user activation required by mobile Safari.
  const loadTrack = useCallback((song: Song, autoplay = true) => {
    const audio = audioRef.current;
    if (!audio) return;
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    const id = ++requestId.current;
    loadedKey.current = '';
    audio.pause();
    setPlaying(false);
    setError('');
    setPosition(0);
    setLength(Number.isFinite(song.duration) ? Math.max(0, song.duration || 0) : 0);
    setBuffering(autoplay);
    const fail = (error: unknown) => {
      if (controller.signal.aborted || id !== requestId.current) return;
      setBuffering(false);
      audio.removeAttribute('src');
      audio.load();
      const message = error instanceof Error ? error.message : 'Unable to load this song.';
      setError(message);
      notify(message);
    };
    const start = (track: Song) => {
      if (controller.signal.aborted || id !== requestId.current) return;
      const sources = track.downloadUrl.filter(link => safeUrl(link.url)).sort((a, b) => parseInt(b.quality) - parseInt(a.quality));
      const source = sources.find(link => parseInt(link.quality) <= Number(qualityRef.current)) || sources[0];
      if (!source) { fail(new Error('This song has no playable stream. Please choose another.')); return; }
      loadedKey.current = `${song.id}:${qualityRef.current}`;
      audio.src = safeUrl(source.url);
      audio.load();
      if (autoplay) void tryPlay();
    };
    if (song.downloadUrl.some(link => safeUrl(link.url))) start(song);
    else {
      audio.removeAttribute('src');
      audio.load();
      void getSong(song.id, controller.signal).then(start).catch(fail);
    }
  }, [notify, tryPlay]);

  const play = useCallback((song: Song, list: Song[] = [song]) => {
    const unique = [...new Map(list.map(item => [item.id, item])).values()];
    if (!unique.some(item => item.id === song.id)) unique.unshift(song);
    setQueue(unique);
    setIndex(unique.findIndex(item => item.id === song.id));
    currentRef.current = song;
    if (loadedKey.current === `${song.id}:${qualityRef.current}`) void tryPlay();
    else loadTrack(song);
  }, [tryPlay, loadTrack]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentRef.current || !audio.getAttribute('src')) return;
    if (audio.paused) void tryPlay(); else audio.pause();
  }, [tryPlay]);

  const next = useCallback(() => {
    if (!queue.length) return;
    let nextIndex = index;
    if (shuffle && queue.length > 1) {
      nextIndex = (index + 1 + Math.floor(Math.random() * (queue.length - 1))) % queue.length;
    } else if (index < queue.length - 1) nextIndex = index + 1;
    else if (repeat === 'all') nextIndex = 0;
    else { audioRef.current?.pause(); setPlaying(false); return; }
    if (nextIndex === index) {
      if (audioRef.current) audioRef.current.currentTime = 0;
      setPosition(0);
      void tryPlay();
    } else {
      currentRef.current = queue[nextIndex];
      setIndex(nextIndex);
      loadTrack(queue[nextIndex]);
    }
  }, [queue, index, shuffle, repeat, tryPlay, loadTrack]);

  const previous = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.currentTime > 3 || index <= 0) { audio.currentTime = 0; setPosition(0); void tryPlay(); }
    else {
      currentRef.current = queue[index - 1];
      setIndex(index - 1);
      loadTrack(queue[index - 1]);
    }
  }, [index, queue, tryPlay, loadTrack]);

  const previousQuality = useRef(quality);
  useEffect(() => {
    if (previousQuality.current === quality) return;
    previousQuality.current = quality;
    if (currentRef.current) loadTrack(currentRef.current, !audioRef.current?.paused);
  }, [quality, loadTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => { ++requestId.current; pending.current?.abort(); audio?.pause(); };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      try { audio.volume = volume; } catch { /* iOS may reserve volume for physical controls. */ }
      audio.muted = muted;
    }
  }, [volume, muted]);

  useEffect(() => { if (audioRef.current) audioRef.current.loop = repeat === 'one'; }, [repeat]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const update = () => setPosition(audio.currentTime);
    const metadata = () => { if (Number.isFinite(audio.duration)) setLength(audio.duration); };
    const onPlay = () => setPlaying(true);
    const onPlaying = () => { setPlaying(true); setBuffering(false); };
    const onPause = () => { if (audio.paused) { setPlaying(false); setBuffering(false); } };
    const onWaiting = () => setBuffering(true);
    const onReady = () => setBuffering(false);
    const onError = () => {
      const message = 'The stream is unavailable. Try another track or change the audio quality in settings.';
      setBuffering(false); setPlaying(false); setError(message); notify(message);
    };
    const onEnded = () => {
      if (repeat === 'one') { audio.currentTime = 0; void tryPlay(); }
      else next();
    };
    const events = { timeupdate: update, durationchange: metadata, play: onPlay, playing: onPlaying, pause: onPause, waiting: onWaiting, canplay: onReady, error: onError, ended: onEnded };
    Object.entries(events).forEach(([event, handler]) => audio.addEventListener(event, handler));
    return () => Object.entries(events).forEach(([event, handler]) => audio.removeEventListener(event, handler));
  }, [next, repeat, tryPlay, notify]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio && Number.isFinite(audio.duration)) { audio.currentTime = Math.min(Math.max(0, time), audio.duration); setPosition(audio.currentTime); }
  }, []);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !('MediaMetadata' in window) || !current) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: text(current.name), artist: artistName(current), album: text(current.album.name), artwork: [{ src: new URL(artwork(current.image), location.origin).href }] });
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    const handlers: Partial<Record<MediaSessionAction, MediaSessionActionHandler>> = {
      play: () => { void tryPlay(); }, pause: () => audioRef.current?.pause(), previoustrack: previous, nexttrack: next,
      seekto: detail => { if (detail.seekTime !== undefined) seek(detail.seekTime); },
    };
    Object.entries(handlers).forEach(([action, handler]) => { try { navigator.mediaSession.setActionHandler(action as MediaSessionAction, handler); } catch { /* Browser-specific action support. */ } });
    return () => Object.keys(handlers).forEach(action => { try { navigator.mediaSession.setActionHandler(action as MediaSessionAction, null); } catch { /* Unsupported action. */ } });
  }, [current, playing, tryPlay, previous, next, seek]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState || !Number.isFinite(length) || length <= 0) return;
    try { navigator.mediaSession.setPositionState({ duration: length, playbackRate: 1, position: Math.max(0, Math.min(position, length)) }); }
    catch { /* Position controls are not available in every mobile browser. */ }
  }, [length, position]);

  return {
    audioRef, queue, index, current, playing, buffering, error, position, length, volume, muted, shuffle, repeat,
    play, toggle, next, previous, seek, setVolume, setMuted, setShuffle,
    cycleRepeat: () => setRepeat(value => value === 'off' ? 'all' : value === 'all' ? 'one' : 'off'),
    select: (i: number) => { if (queue[i]) play(queue[i], queue); },
    add: (song: Song) => { setQueue(list => list.some(item => item.id === song.id) ? list : [...list, song]); notify('Added to your queue.'); },
  };
}

export type PlayerState = ReturnType<typeof usePlayer>;
