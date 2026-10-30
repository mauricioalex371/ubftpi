import React from 'react';
import { Shield, Settings, Database } from 'lucide-react';

interface HeaderProps {
  academyName: string;
  masterName: string;
  onOpenBackup: () => void;
  hasBackupWarning?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  academyName,
  masterName,
  onOpenBackup,
  hasBackupWarning = false,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#050505]/95 backdrop-blur-md border-b border-[#272424] pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#131212] border border-[#FF4A0F] flex items-center justify-center p-1 shadow-md">
            <img src="/icon.png" alt="UBF Team" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-black text-lg tracking-wide text-white">UBF</span>
              <span className="font-black text-lg tracking-wide text-[#FF4A0F]">TEAM</span>
            </div>
            <p className="text-[11px] text-[#9CA3AF] font-serif tracking-tight mt-0.5">
              {academyName} • {masterName}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenBackup}
          className="relative min-w-[44px] min-h-[44px] rounded-lg bg-[#131212] border border-[#272424] flex items-center justify-center text-[#9CA3AF] hover:text-white hover:border-[#FF4A0F] active:scale-95 transition-all"
          title="Backup e Configurações"
          aria-label="Backup e Configurações"
        >
          <Database className="w-5 h-5 text-[#FF4A0F]" />
          {hasBackupWarning && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF4A0F] rounded-full ring-2 ring-[#050505] animate-pulse" />
          )}
        </button>
      </div>

      {/* Red accent bar on bottom */}
      <div className="h-[2.5px] w-full bg-gradient-to-r from-[#FF4A0F] via-[#FF2B1C] to-[#FF4A0F]" />
    </header>
  );
};
