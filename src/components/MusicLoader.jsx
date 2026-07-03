import { useEffect } from 'react';
import { useApp }   from '../context/AppContext';
import { useMusic } from '../context/MusicContext';

export default function MusicLoader() {
  const { coupleAuth, getCoupleBySlug } = useApp();
  const { loadTrack } = useMusic();

  useEffect(() => {
    if (!coupleAuth?.slug) return;
    const couple = getCoupleBySlug(coupleAuth.slug);
    const src = couple?.bgMusic;
    if (src) loadTrack(src);
  }, [coupleAuth?.slug]); 

  return null;
}
