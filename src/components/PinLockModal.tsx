import React, { useState } from 'react';
import { Lock, Delete } from 'lucide-react';

interface PinLockModalProps {
  correctPin: string;
  onUnlocked: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({ correctPin, onUnlocked }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        if (nextPin === correctPin) {
          onUnlocked();
        } else {
          setError(true);
          setTimeout(() => setPin(''), 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]">
      <div className="w-full max-w-xs flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-[#131212] border border-[#FF4A0F] flex items-center justify-center mb-4 shadow-lg shadow-[#FF4A0F]/10">
          <Lock className="w-8 h-8 text-[#FF4A0F]" />
        </div>

        <h2 className="text-xl font-black text-white mb-1">UBF Team Gestão</h2>
        <p className="text-xs text-[#9CA3AF] mb-6">Digite seu PIN de 4 dígitos para acessar</p>

        {/* 4 dots */}
        <div className="flex gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                error
                  ? 'border-[#EF4444] bg-[#EF4444]/30 animate-bounce'
                  : pin.length > i
                  ? 'border-[#FF4A0F] bg-[#FF4A0F] scale-110'
                  : 'border-[#272424] bg-[#131212]'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-[#EF4444] font-bold mb-4 animate-shake">
            PIN incorreto. Tente novamente.
          </p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3.5 w-full">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="min-h-[58px] rounded-2xl bg-[#131212] border border-[#272424] text-white font-bold text-xl active:bg-[#FF4A0F] active:border-[#FF4A0F] active:scale-95 transition-all flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigit('0')}
            className="min-h-[58px] rounded-2xl bg-[#131212] border border-[#272424] text-white font-bold text-xl active:bg-[#FF4A0F] active:border-[#FF4A0F] active:scale-95 transition-all flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="min-h-[58px] rounded-2xl bg-[#131212] border border-[#272424] text-[#9CA3AF] active:text-white active:scale-95 transition-all flex items-center justify-center"
            aria-label="Apagar dígito"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
