import {
  createContext, useContext, useEffect, useRef, useState, useCallback,
} from 'react';
import { getImageUrl } from '../utils/imageStore';

const MusicContext = createContext(null);

export function detectMusicType(src) {
  if (!src) return null;
  if (src.startsWith('idb://'))             return 'file';
  if (/spotify\.com/i.test(src))            return 'spotify';
  if (/youtu\.be|youtube\.com/i.test(src))  return 'youtube';
  return null;
}

export function toEmbedUrl(src) {
  const sp = src.match(/spotify\.com\/(track|album|playlist|episode)\/([A-Za-z0-9]+)/);
  if (sp) return `https://open.spotify.com/embed/${sp[1]}/${sp[2]}?utm_source=generator&autoplay=1&theme=0`;

  const yt = src.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([A-Za-z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&loop=1&playlist=${yt[1]}&rel=0&enablejsapi=1`;

  return null;
}

export function MusicProvider({ children }) {
  const audioRef = useRef(null);

  const [trackSrc,  setTrackSrc]  = useState(null);
  const [trackType, setTrackType] = useState(null);
  const [embedUrl,  setEmbedUrl]  = useState(null);
  const [started,   setStarted]   = useState(false);
  const [playing,   setPlaying]   = useState(false);
  const [volume,    setVolume]    = useState(0.45);
  const [visible,   setVisible]   = useState(false);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    const audio = new Audio();
    audio.loop   = true;
    audio.volume = volume;
    audioRef.current = audio;
    const onPlay  = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd   = () => setPlaying(false);
    audio.addEventListener('play',  onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.pause(); audio.src = '';
      audio.removeEventListener('play',  onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnd);
    };
  }, []); 

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const loadTrack = useCallback(async (src) => {
    if (!src || src === trackSrc) return;

    const type = detectMusicType(src);
    if (!type) return;

    setTrackSrc(src);
    setTrackType(type);
    setStarted(false);
    setPlaying(false);

    if (type === 'spotify' || type === 'youtube') {
      const url = toEmbedUrl(src);
      if (!url) return;
      setEmbedUrl(null);
      setVisible(false);
    }

    if (type === 'file') {
      setLoading(true);
      try {
        const url = await getImageUrl(src);
        if (!url) { setLoading(false); return; }
        const audio = audioRef.current;
        audio.pause();
        audio.src = url;
        audio.load();
        setVisible(true);
        setLoading(false);
        try { await audio.play(); } catch {  }
      } catch { setLoading(false); }
    }
  }, [trackSrc]);

  const play = useCallback(async () => {
    if (trackType === 'file') {
      try { await audioRef.current?.play(); } catch {}
      return;
    }
    if (trackType === 'spotify' || trackType === 'youtube') {
      const url = toEmbedUrl(trackSrc);
      if (url) {
        setEmbedUrl(url);
        setPlaying(true);
        setStarted(true);
        setVisible(true);
      }
    }
  }, [trackType, trackSrc]);

  const pause = useCallback(() => {
    if (trackType === 'file') {
      audioRef.current?.pause();
    } else {
      setEmbedUrl(null);
      setPlaying(false);
    }
  }, [trackType]);

  const toggle = useCallback(async () => {
    if (playing) pause(); else await play();
  }, [playing, play, pause]);

  const dismiss = useCallback(() => {
    if (trackType === 'file') audioRef.current?.pause();
    setEmbedUrl(null);
    setPlaying(false);
    setVisible(false);
  }, [trackType]);

  return (
    <MusicContext.Provider value={{
      playing,
      volume, setVolume,
      visible,
      loading,
      trackType,
      trackSrc,
      embedUrl,
      started,
      loadTrack,
      play,
      pause,
      toggle,
      dismiss,
    }}>
      {children}

      {embedUrl && playing && (
        <iframe
          key={embedUrl}
          src={embedUrl}
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          style={{
            position: 'fixed',
            bottom: 0, right: 0,
            width: 1, height: 1,
            border: 'none',
            opacity: 0.01,
            pointerEvents: 'none',
            zIndex: 8999,
          }}
          title="Background music"
        />
      )}
    </MusicContext.Provider>
  );
}

export const useMusic = () => useContext(MusicContext);
