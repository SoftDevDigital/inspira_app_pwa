import { Menu, Search, X, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { BRANDING } from '../constants';
import { UserPlan } from '../types';

interface HomeHeaderProps {
  onOpenSidebar: () => void;
  onOpenPremium?: () => void;
  onOpenTrophies?: () => void;
  userPlan: UserPlan;
  isSearching: boolean;
  setIsSearching: (val: boolean) => void;
  theme: 'elegant' | 'clarity';
  userLevel?: string;
  levelProgress?: number;
}

export default function HomeHeader({ 
  onOpenSidebar, 
  onOpenPremium, 
  onOpenTrophies,
  userPlan, 
  isSearching, 
  setIsSearching, 
  theme,
  userLevel,
  levelProgress = 0
}: HomeHeaderProps) {
  const isElegant = theme === 'elegant';

  return (
    <div className="flex flex-col gap-2 pt-12">
      {/* Brand & Basic Controls */}
      <div className="px-6 relative flex flex-col items-center">
        <button 
          onClick={onOpenSidebar}
          className={`absolute left-6 top-1/2 -translate-y-1/2 p-2 rounded-xl active:scale-90 transition-all z-20 ${
            isElegant ? 'text-white' : 'text-zinc-600'
          }`}
        >
          <Menu size={24} />
        </button>
        
        <div className="flex flex-col items-center gap-2">
          <img 
            src={BRANDING.logoUrl}
            alt={`${BRANDING.appName} Logo`}
            className="h-14 w-auto object-contain cursor-pointer active:scale-95 transition-transform"
            onClick={onOpenTrophies}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const h1 = parent.querySelector('h1');
                if (h1) h1.style.display = 'block';
              }
            }}
          />
          <h1 className={`text-3xl font-black tracking-[0.25em] italic hidden ${
            isElegant ? 'text-white' : 'text-zinc-900'
          }`}>{BRANDING.appName}</h1>
        </div>

        <button 
          onClick={() => setIsSearching(!isSearching)}
          className={`absolute right-6 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors ${
            isElegant ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'
          }`}
        >
          {isSearching ? <X size={20} /> : <Search size={20} />}
        </button>
      </div>

      {/* Gold Premium Button (Dynamic Visibility) */}
      {userPlan !== 'Premium' && (
        <div className="w-full flex justify-center py-2 px-6">
          <button 
            onClick={onOpenPremium}
            className={`
              w-full flex items-center justify-center gap-3 py-5 rounded-2xl hover:brightness-110 active:scale-95 transition-all
              shadow-[0_10px_25px_rgba(212,175,55,0.4)]
              bg-gradient-to-r from-[#D4AF37] via-[#FFF2CD] to-[#D4AF37] border border-white/40
            `}
            id="gold-premium-button"
          >
            <span className="text-base font-black text-black uppercase tracking-[0.2em] drop-shadow-sm">
              👑 HACERSE PREMIUM
            </span>
          </button>
        </div>
      )}

      {/* Level Bar (Relocated for Premium Users) */}
      {userPlan?.toString().toLowerCase() === 'premium' && userLevel && (
        <div className="w-full px-6 py-2">
          <button 
            onClick={onOpenTrophies}
            className={`w-full p-1.5 px-6 rounded-full border relative overflow-hidden flex items-center gap-4 active:scale-[0.98] transition-all ${
            isElegant ? 'bg-zinc-950 border-white/5 shadow-inner' : 'bg-white border-zinc-100 shadow-sm'
          }`}>
            <div className="relative w-10 h-10 flex-shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="20" cy="20" r="16"
                  className="fill-none stroke-zinc-800"
                  strokeWidth="3"
                />
                <motion.circle
                  cx="20" cy="20" r="16"
                  className={`fill-none ${isElegant ? 'stroke-accent' : 'stroke-blue-600'}`}
                  strokeWidth="3"
                  strokeDasharray={2 * Math.PI * 16}
                  initial={{ strokeDashoffset: 2 * Math.PI * 16 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 16 * (1 - levelProgress / 100) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <Trophy size={10} className={isElegant ? 'text-accent' : 'text-blue-600'} />
                 <span className={`text-[7px] font-black italic ${isElegant ? 'text-white' : 'text-zinc-900'}`}>
                    {Math.round(levelProgress)}%
                 </span>
              </div>
            </div>

            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <span className={`text-[8px] font-black uppercase tracking-[0.2em] whitespace-nowrap ${isElegant ? 'text-accent' : 'text-blue-600'}`}>Nivel:</span>
                <h4 className={`text-xs font-black italic tracking-tighter uppercase truncate ${isElegant ? 'text-white' : 'text-zinc-900'}`}>
                  {userLevel}
                </h4>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Cyan Diamond Line */}
      <div className="flex items-center gap-0 py-2">
        <div className={`flex-1 h-px ${
          isElegant 
            ? 'bg-gradient-to-r from-transparent via-[#D4AF37]/40 via-[#00f2ff]/30 to-[#00f2ff]'
            : 'bg-gradient-to-r from-transparent via-zinc-200 to-zinc-300'
        }`} />
        <div className="px-4">
          <div className="relative">
            <div className={`w-4 h-4 rotate-45 animate-pulse border ${
              isElegant 
                ? 'bg-[#00f2ff] shadow-[0_0_15px_#00f2ff] border-[#D4AF37]/50'
                : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] border-blue-400'
            }`} />
          </div>
        </div>
        <div className={`flex-1 h-px ${
          isElegant 
            ? 'bg-gradient-to-l from-transparent via-[#D4AF37]/40 via-[#00f2ff]/30 to-[#00f2ff]'
            : 'bg-gradient-to-l from-transparent via-zinc-200 to-zinc-300'
        }`} />
      </div>
    </div>
  );
}
