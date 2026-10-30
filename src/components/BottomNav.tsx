import React from 'react';
import { LayoutDashboard, Users, Calendar, CreditCard, Wallet } from 'lucide-react';

export type TabType = 'inicio' | 'alunos' | 'turmas' | 'mensalidades' | 'caixa';

interface BottomNavProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  unpaidFeesCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onChangeTab,
  unpaidFeesCount = 0,
}) => {
  const tabs = [
    { id: 'inicio' as TabType, label: 'Início', icon: LayoutDashboard },
    { id: 'alunos' as TabType, label: 'Alunos', icon: Users },
    { id: 'turmas' as TabType, label: 'Aulas', icon: Calendar },
    { id: 'mensalidades' as TabType, label: 'Mensalidades', icon: CreditCard, badge: unpaidFeesCount },
    { id: 'caixa' as TabType, label: 'Caixa', icon: Wallet },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#131212] border-t border-[#272424] pb-[env(safe-area-inset-bottom)] shadow-2xl">
      <div className="flex items-center justify-around max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[52px] py-1 transition-all active:scale-95 ${
                isActive ? 'text-[#FF4A0F]' : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {!!tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#EF4444] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 font-medium tracking-tight ${isActive ? 'font-bold text-white' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute top-0 w-8 h-[2px] bg-[#FF4A0F] rounded-full shadow-glow" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
