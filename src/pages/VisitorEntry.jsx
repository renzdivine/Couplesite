import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useMusic } from '../context/MusicContext';
import GiftPrompt from './GiftPrompt';
import CodeScreen from './CodeScreen';
import MemoryGame from '../components/MemoryGame';
import { useImageUrl } from '../utils/useImageUrl';
import '../styles/pages/CoupleLogin.css';
import '../styles/pages/CodeScreen.css';

export default function VisitorEntry() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { getCoupleBySlug } = useApp();
  const { loadTrack, play } = useMusic();

  const couple = slug ? getCoupleBySlug(slug) : null;
  const [step, setStep] = useState('gift');

  
  
  useEffect(() => {
    const src = couple?.bgMusic;
    if (src) loadTrack(src);
  }, [couple?.bgMusic]); 

  
  
  const handleAccept = () => {
    play();           
    setStep('code');
  };

  const giftBgKey = couple?.pageContent?.giftPrompt?.bgImage;
  const codeBgKey = couple?.pageContent?.codeScreen?.bgImage;
  const gameBgKey = couple?.pageContent?.memoryGame?.bgImage;
  const giftBg    = useImageUrl(giftBgKey);
  const codeBg    = useImageUrl(codeBgKey);
  const gameBg    = useImageUrl(gameBgKey);

  
  
  
  const activeBg =
    step === 'gift' ? (giftBg || '/redbg.png') :
    step === 'game' ? (gameBg || '/codeScreenbg.png') :
    (codeBg || '/codeScreenbg.png');

  const isCodeStep = step === 'code';
  const isGameStep = step === 'game';

  return (
    <div
      className="cl-root"
      style={activeBg ? {
        backgroundImage: `url(${activeBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
      } : undefined}
    >
      {}
      {(isCodeStep || isGameStep) && activeBg && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(120, 0, 20, 0.45)',
          pointerEvents: 'none',
          zIndex: 1,
        }}/>
      )}
      {step === 'gift' && (
        <GiftPrompt couple={couple} onAccept={handleAccept} />
      )}
      {step === 'code' && (
        <CodeScreen couple={couple} slug={slug} onSuccess={() => setStep('game')}/>
      )}
      {step === 'game' && (
        <MemoryGame couple={couple} onComplete={() => navigate('/butterflies360')}/>
      )}
    </div>
  );
}
