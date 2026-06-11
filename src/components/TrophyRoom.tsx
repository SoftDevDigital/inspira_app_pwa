import { motion, AnimatePresence } from 'motion/react';
import { Trophy, X, Lock, CheckCircle2, Star, Sparkles } from 'lucide-react';
import { User } from '../types';
import { MEDALS_CATALOG } from '../constants/medals';

interface TrophyRoomProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  theme?: 'elegant' | 'clarity';
}

export default function TrophyRoom({ isOpen, onClose, user, theme = 'elegant' }: TrophyRoomProps) {
  const isElegant = theme === 'elegant';
  const unlockedMedalIds = user?.unlockedMedalIds || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`relative w-full max-w-lg h-[90vh] sm:h-[80vh] rounded-t-[48px] sm:rounded-[48px] overflow-hidden border-t-2 sm:border-2 flex flex-col ${
              isElegant ? 'bg-bg-deep border-accent/20 shadow-[0_-20px_60px_rgba(212,175,55,0.15)]' : 'bg-white border-zinc-100 shadow-2xl'
            }`}
          >
            {/* Header */}
            <div className={`p-8 pb-4 flex items-center justify-between sticky top-0 z-10 ${isElegant ? 'bg-bg-deep/80 backdrop-blur-md' : 'bg-white/80 backdrop-blur-md'}`}>
              <div className="space-y-1">
                <h2 className={`text-2xl font-black italic tracking-tighter uppercase ${isElegant ? 'text-white' : 'text-zinc-900'}`}>
                  Salón de Trofeos
                </h2>
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${isElegant ? 'text-accent' : 'text-blue-600'}`}>
                  {unlockedMedalIds.length} de {MEDALS_CATALOG.length} Medallas
                </p>
              </div>
              <button 
                onClick={onClose}
                className={`p-3 rounded-2xl active:scale-90 transition-all ${isElegant ? 'bg-white/5 text-zinc-400' : 'bg-zinc-100 text-zinc-500'}`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Grid Container */}
            <div className="flex-1 overflow-y-auto px-8 pb-12 scrollbar-hide">
              <div className="grid grid-cols-3 gap-4">
                {MEDALS_CATALOG.map((medal) => {
                  const isUnlocked = unlockedMedalIds.includes(String(medal.id));
                  
                  return (
                    <motion.button
                      key={medal.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => alert(`${medal.titulo}\n${medal.descripcion}\nMeta: ${medal.meta}`)}
                      className={`aspect-square rounded-3xl border flex flex-col items-center justify-center gap-2 p-2 relative overflow-hidden transition-all ${
                        isUnlocked 
                          ? (isElegant ? 'bg-accent/10 border-accent/40 shadow-[0_0_20px_rgba(212,175,55,0.1)]' : 'bg-blue-50 border-blue-200 shadow-sm')
                          : (isElegant ? 'bg-zinc-900/40 border-white/5 grayscale opacity-50' : 'bg-zinc-50 border-zinc-100 grayscale opacity-40')
                      }`}
                    >
                      <div className={`text-3xl flex items-center justify-center mb-1 transition-all ${
                        isUnlocked ? '' : 'filter grayscale'
                      }`}>
                         {isUnlocked ? medal.icono : <Lock size={20} className="text-zinc-500" />}
                      </div>
                      
                      <span className={`text-[8px] font-black uppercase tracking-widest text-center leading-tight ${
                        isUnlocked ? (isElegant ? 'text-white' : 'text-zinc-900') : 'text-zinc-600'
                      }`}>
                        {medal.titulo}
                      </span>

                      {isUnlocked && (
                        <div className="absolute top-1 right-1">
                          <CheckCircle2 size={10} className={isElegant ? 'text-accent' : 'text-blue-500'} />
                        </div>
                      )}

                      {!isUnlocked && isElegant && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <Lock size={16} className="text-white/20" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
              
              <div className="mt-12 p-6 rounded-[32px] border border-dashed border-zinc-800 text-center space-y-2">
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isElegant ? 'text-zinc-500' : 'text-zinc-400'}`}>Cada medalla te acerca más a la</p>
                <h3 className={`text-xl font-black italic uppercase italic tracking-tighter ${isElegant ? 'text-white' : 'text-zinc-900'}`}>Libertad Financiera</h3>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
