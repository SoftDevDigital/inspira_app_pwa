/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Home, Coffee, Calendar, Sparkle, Plus } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onActionClick: () => void;
  theme?: 'elegant' | 'clarity';
}

export default function BottomNav({ activeTab, setActiveTab, onActionClick, theme = 'elegant' }: BottomNavProps) {
  const isElegant = theme === 'elegant';
  const tabs = [
    { id: 'home', label: 'INICIO', icon: Home },
    { id: 'books', label: 'LIBROS', icon: Coffee },
    { id: 'chat', label: 'NAYA', icon: Sparkle },
    { id: 'calendar', label: 'EVENTOS', icon: Calendar },
  ];

  return (
    <nav className={`border-t px-4 py-3 transition-all duration-500 ${
      isElegant ? 'bg-black border-white/5' : 'bg-white border-zinc-100 shadow-[0_-5px_20px_rgba(0,0,0,0.03)]'
    }`}>
      <div className="flex justify-between items-center max-w-lg mx-auto">
        <div className="flex flex-1 justify-between items-center pr-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 transition-all relative min-w-[50px] justify-center active:scale-95 ${
                activeTab === tab.id 
                  ? (isElegant ? 'text-[#D4AF37]' : 'text-blue-600') 
                  : (isElegant ? 'text-[#888888] hover:text-white' : 'text-zinc-400 hover:text-zinc-900')
              }`}
            >
              <tab.icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
              <span className="text-[8px] font-black tracking-tighter uppercase whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Global Action Button (Right Side) */}
        <div className="flex-shrink-0">
          <button
            onClick={onActionClick}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border shadow-lg hover:scale-110 active:scale-95 ${
              isElegant 
                ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                : 'bg-amber-400 border-amber-300 text-black shadow-amber-500/20'
            }`}
          >
            <Plus size={22} strokeWidth={3} />
          </button>
        </div>
      </div>
    </nav>
  );
}
