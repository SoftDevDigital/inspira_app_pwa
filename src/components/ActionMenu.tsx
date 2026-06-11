/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Crown, Trophy, ChevronRight, Sparkles, Shield, X, Star } from 'lucide-react';

interface ActionMenuProps {
  onClose: () => void;
  onNavigate: (tab: string) => void;
  theme?: 'elegant' | 'clarity';
}

export default function ActionMenu({ onClose, onNavigate, theme = 'elegant' }: ActionMenuProps) {
  const isElegant = theme === 'elegant';

  const menuItems = [
    {
      id: 'fame',
      title: 'Salón de la Fama',
      subtitle: 'Nuestras Mentoras',
      icon: <Trophy size={16} className={isElegant ? "text-[#00f2ff]" : "text-blue-600"} />,
      tab: 'fame'
    },
    {
      id: 'trophies',
      title: 'Salón de Trofeos',
      subtitle: 'Tus Conquistas',
      icon: <Star size={16} className={isElegant ? "text-accent" : "text-orange-500"} />,
      tab: 'trophies'
    },
    {
      id: 'success-path',
      title: 'Ruta al Éxito',
      subtitle: 'Tu Mapa VIP',
      icon: <Shield size={16} className={isElegant ? "text-[#D4AF37]" : "text-amber-600"} />,
      tab: 'success-path'
    }
  ];

  const buttonBaseStyle = `w-full flex flex-row items-center gap-3 px-5 py-2.5 rounded-full border transition-all active:scale-95 overflow-hidden ${
    isElegant 
      ? 'bg-zinc-900 border-white/5 text-white active:bg-zinc-800' 
      : 'bg-white border-zinc-200 text-zinc-900 shadow-sm active:bg-zinc-50'
  }`;

  return (
    <>
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed top-0 right-0 h-full w-[70vw] z-[210] border-l flex flex-col shadow-2xl overflow-hidden select-none touch-none ${
          isElegant ? 'bg-zinc-950 border-white/5' : 'bg-[#F2F2F7] border-zinc-200'
        }`}
      >
        <button 
          onClick={onClose}
          className={`absolute top-6 right-6 p-2 rounded-xl transition-all active:scale-90 z-20 ${
            isElegant ? 'bg-white/5 text-zinc-400 hover:text-white' : 'bg-zinc-200 text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <X size={24} />
        </button>

        <div className="pt-32 pb-10 px-6 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="mb-12 flex flex-col items-center">
            <h2 className={`text-[42px] font-black italic tracking-[-0.05em] uppercase leading-none whitespace-nowrap opacity-90 transition-colors ${
              isElegant ? 'text-white' : 'text-zinc-900'
            }`}>
              MENTORÍA VIP
            </h2>
            <div className={`h-[2px] w-full mt-2 ${isElegant ? 'bg-accent/30' : 'bg-blue-500/20'}`} />
          </div>

          {/* List */}
          <div className="space-y-3">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.tab);
                  onClose();
                }}
                className={buttonBaseStyle}
              >
                <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${
                  isElegant ? 'bg-black/40' : 'bg-zinc-100'
                }`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden text-left">
                  <div className="flex flex-col">
                    <span className={`text-[12px] font-bold uppercase tracking-tight whitespace-nowrap overflow-hidden text-ellipsis ${
                      isElegant ? 'text-white' : 'text-zinc-900'
                    }`}>
                      {item.title}
                    </span>
                    <span className={`text-[10px] font-medium uppercase tracking-widest leading-none mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis ${
                      isElegant ? 'text-zinc-500' : 'text-zinc-400'
                    }`}>
                      {item.subtitle}
                    </span>
                  </div>
                </div>
                <ChevronRight size={14} className={isElegant ? "text-zinc-700" : "text-zinc-300"} />
              </button>
            ))}
          </div>

          <div className="mt-auto pb-12 flex flex-col items-center">
            <div className={`w-12 h-px mb-6 ${isElegant ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
            <Crown size={24} className={isElegant ? 'text-[#D4AF37]/20' : 'text-blue-500/10'} />
          </div>
        </div>
      </motion.div>
    </>
  );
}
