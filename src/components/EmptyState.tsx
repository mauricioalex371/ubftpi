import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-[#131212] border border-[#272424] rounded-2xl my-4">
      <div className="w-14 h-14 rounded-2xl bg-[#1a1818] border border-[#FF4A0F]/30 flex items-center justify-center mb-3.5 shadow-inner">
        <Icon className="w-7 h-7 text-[#FF4A0F]" />
      </div>

      <h3 className="text-base font-bold text-white mb-1">{title}</h3>
      <p className="text-xs text-[#9CA3AF] max-w-xs mb-5 leading-relaxed">{description}</p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#FF4A0F] text-white font-bold text-xs flex items-center gap-2 hover:bg-[#ff3b00] active:scale-95 transition-all shadow-md shadow-[#FF4A0F]/20"
        >
          <Plus className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
