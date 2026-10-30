import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X } from 'lucide-react';

export const IosInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if on iOS device and NOT in standalone mode
    const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isStandalone = (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;

    // Check if user already dismissed recently
    const dismissed = sessionStorage.getItem('ios_install_prompt_dismissed');

    if (isIos && !isStandalone && !dismissed) {
      setShowPrompt(true);
    }
  }, []);

  if (!showPrompt) return null;

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('ios_install_prompt_dismissed', 'true');
  };

  return (
    <div className="bg-[#1a1818] border-b border-[#FF4A0F]/30 px-3.5 py-2.5 text-xs text-[#F9FAFB] flex items-center justify-between gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded bg-[#050505] border border-[#FF4A0F] flex items-center justify-center shrink-0">
          <Share className="w-3.5 h-3.5 text-[#FF4A0F]" />
        </div>
        <p className="leading-tight text-[11px] text-[#D1D5DB]">
          Instalar no iPhone: Toque em <strong className="text-white">Compartilhar</strong> (<Share className="w-3 h-3 inline text-[#FF4A0F]" />) e depois em <strong className="text-white">Adicionar à Tela de Início</strong> (<PlusSquare className="w-3 h-3 inline text-[#FF4A0F]" />).
        </p>
      </div>

      <button
        onClick={handleDismiss}
        className="min-w-[32px] min-h-[32px] flex items-center justify-center text-[#9CA3AF] hover:text-white shrink-0"
        aria-label="Fechar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
