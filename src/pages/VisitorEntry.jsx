// ─────────────────────────────────────────────────────────────
// VisitorEntry.jsx  — Visitor entry point
// Route: /love/:slug
//
// Flow:
//   1. CodeScreen   — enter the 4-digit access code
//   2. MemoryGame   — match the photo pairs
//   3. → /butterflies360 (the full butterfly experience)
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import CodeScreen from './CodeScreen';
import MemoryGame from '../components/MemoryGame';
import { useImageUrl } from '../utils/useImageUrl';
import '../styles/pages/CoupleLogin.css';
import '../styles/pages/CodeScreen.css';

export default function VisitorEntry() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { getCoupleBySlug } = useApp();

  const couple = slug ? getCoupleBySlug(slug) : null;
  const [step, setStep] = useState('code');

  const codeBgKey = couple?.pageContent?.codeScreen?.bgImage;
  const gameBgKey = couple?.pageContent?.memoryGame?.bgImage;
  const codeBg    = useImageUrl(codeBgKey);
  const gameBg    = useImageUrl(gameBgKey);
  const activeBg  = step === 'code' ? codeBg : gameBg;

  return (
    <div
      className="cl-root"
      style={activeBg ? {
        backgroundImage: `url(${activeBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      } : undefined}
    >
      {step === 'code' && (
        <CodeScreen couple={couple} slug={slug} onSuccess={() => setStep('game')}/>
      )}
      {step === 'game' && (
        <MemoryGame couple={couple} onComplete={() => navigate('/butterflies360')}/>
      )}
    </div>
  );
}
