/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shield, BookOpen, PlayCircle, ChevronRight, LayoutGrid, X, ChevronLeft, Headphones, Coffee, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useMemo } from 'react';
// Connection with global state and real data
import { Audio, SuccessPath as SuccessPathType, SuccessPathLevel, Book } from '../types';

interface SuccessPathProps {
  onSelectAudio: (audio: Audio) => void;
  onNavigate: (tab: string) => void;
  completedAudios: string[];
  theme?: 'elegant' | 'clarity';
  paths?: SuccessPathType[];
  allAudios?: Audio[];
  allBooks?: Book[];
  userPlan?: 'Gratis' | 'Premium';
  onOpenPremium?: () => void;
}

export default function SuccessPath({ 
  onSelectAudio, 
  onNavigate, 
  completedAudios, 
  theme = 'elegant', 
  paths = [],
  allAudios = [],
  allBooks = [],
  userPlan = 'Gratis',
  onOpenPremium
}: SuccessPathProps) {
  const [activeLevelId, setActiveLevelId] = useState<string | null>(null);
  const isElegant = theme === 'elegant';
  const isPremium = userPlan === 'Premium';

  // Flatten levels from all paths for display
  const allLevels = useMemo(() => {
    return paths.reduce((acc: SuccessPathLevel[], path) => {
      return [...acc, ...path.levels];
    }, []);
  }, [paths]);

  const activeLevel = allLevels.find(l => l.id === activeLevelId);
  const levelAudios = useMemo(() => {
    if (!activeLevel) return [];
    return allAudios.filter(a => activeLevel.audioIds.includes(a.id));
  }, [activeLevel, allAudios]);

  const levelBooks = useMemo(() => {
    if (!activeLevel) return [];
    return allBooks.filter(b => (activeLevel.bookIds || []).includes(b.id));
  }, [activeLevel, allBooks]);

  return (
    <div className={`flex flex-col h-full relative overflow-y-auto overflow-x-hidden transition-colors duration-500 ${
      isElegant ? 'bg-black' : 'bg-[#F2F2F7]'
    }`}>
      <div className="px-8 pt-20 pb-40 space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`inline-block p-1 rounded-full mb-2 bg-gradient-to-tr ${
              isElegant ? 'from-[#D4AF37] via-transparent to-transparent' : 'from-blue-500 via-transparent to-transparent'
            }`}
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center border transition-colors ${
              isElegant ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-100'
            }`}>
              <LayoutGrid size={40} className={isElegant ? 'text-[#D4AF37]' : 'text-blue-600'} />
            </div>
          </motion.div>
          <div className="space-y-2">
            <h2 className={`text-4xl font-black tracking-widest uppercase italic transition-colors ${
              isElegant ? 'text-white' : 'text-zinc-900'
            }`}>
              Ruta al Éxito
            </h2>
            <div className={`h-px w-12 mx-auto ${isElegant ? 'bg-[#D4AF37]' : 'bg-blue-600'}`} />
            <p className={`text-sm font-bold uppercase tracking-[0.3em] ${isElegant ? 'text-zinc-500' : 'text-zinc-400'}`}>Hacia la Libertad</p>
          </div>
        </div>

        {/* Level Cards - View Initial */}
        <div className="mx-auto w-full max-w-sm space-y-8 pb-10">
          {(allLevels || []).length > 0 ? (
            allLevels.map((level, index) => (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`group relative w-full rounded-[40px] overflow-hidden border p-8 flex flex-col items-center text-center space-y-6 shadow-2xl transition-all ${
                  isElegant 
                    ? 'bg-zinc-900/40 border-white/5' 
                    : 'bg-white border-zinc-100'
                } ${!isPremium ? 'opacity-70 grayscale-[0.5]' : ''}`}
              >
                {/* Lock Overlay for Free Users */}
                {!isPremium && (
                  <div className="absolute top-6 right-6 z-20">
                    <div className="bg-accent/20 backdrop-blur-md p-2 rounded-full border border-accent/40">
                      <Shield size={16} className="text-accent" fill="currentColor" />
                    </div>
                  </div>
                )}
                {/* Graphic Theme Accent */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1" 
                  style={{ backgroundColor: level.color || '#D4AF37' }}
                />
                
                {/* Icon Level */}
                <div 
                  className={`w-24 h-24 rounded-full flex items-center justify-center border text-white shadow-inner group-hover:scale-110 transition-transform duration-500 ${
                    isElegant ? 'bg-black/40 border-white/10' : 'bg-zinc-50 border-zinc-200'
                  }`} 
                  style={{ color: level.color || '#D4AF37' }}
                >
                  <Shield size={48} />
                </div>

                {/* Text Info */}
                <div className="space-y-4 px-4">
                  <div className="space-y-1">
                    <h3 className={`text-xl font-black italic tracking-tighter uppercase opacity-60 ${isElegant ? 'text-white' : 'text-zinc-400'}`}>
                      {level.title}
                    </h3>
                    <p className="text-4xl font-black uppercase tracking-tight" style={{ color: level.color || '#D4AF37' }}>{level.rank}</p>
                  </div>
                  <p className={`text-sm leading-relaxed italic font-medium ${isElegant ? 'text-zinc-500' : 'text-zinc-500'}`}>
                    {level.description}
                  </p>
                </div>

                {/* Prominent Action Button */}
                <button
                  onClick={() => {
                    if (isPremium) {
                      setActiveLevelId(level.id);
                    } else {
                      onOpenPremium?.();
                    }
                  }}
                  className={`w-full py-5 rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all text-xs flex items-center justify-center gap-2 group/btn ${
                    isElegant ? 'bg-white text-black' : 'bg-zinc-900 text-white'
                  }`}
                >
                  <span>{isPremium ? 'Descubrir Contenido' : 'Desbloquear Ruta'}</span>
                  {isPremium ? (
                    <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                  ) : (
                    <Shield size={16} className="animate-pulse" />
                  )}
                </button>

                {/* Decorative Glow */}
                <div 
                  className="absolute inset-x-0 bottom-0 h-24 opacity-10 group-hover:opacity-20 transition-opacity blur-3xl rounded-full" 
                  style={{ backgroundColor: level.color || '#D4AF37' }}
                />
              </motion.div>
            ))
          ) : (
            <div className={`p-10 rounded-[40px] border border-dashed flex flex-col items-center text-center space-y-4 ${
              isElegant ? 'bg-zinc-950 border-white/10' : 'bg-white border-zinc-200'
            }`}>
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                <Sparkles size={32} />
              </div>
              <p className={`text-xs font-black uppercase tracking-widest italic opacity-60 ${
                isElegant ? 'text-white' : 'text-zinc-900'
              }`}>
                Próximamente: Nuevas rutas de aprendizaje
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Level Content Overlay (Escalated Reveal) - Sub-nivel Screen */}
      <AnimatePresence>
        {activeLevel && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`absolute inset-0 z-50 overflow-y-auto transition-colors duration-500 ${
              isElegant ? 'bg-black' : 'bg-[#F2F2F7]'
            }`}
          >
            {/* Header Content Screen */}
            <div className={`pt-12 pb-6 px-8 flex items-center justify-between sticky top-0 backdrop-blur-md z-10 transition-colors ${
              isElegant ? 'bg-black/80' : 'bg-white/80'
            }`}>
              <button 
                onClick={() => setActiveLevelId(null)}
                className={`flex items-center gap-2 transition-colors active:scale-95 ${
                  isElegant ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'
                }`}
              >
                <ChevronLeft size={20} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Regresar</span>
              </button>
              
              <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none w-full px-12">
                <h3 className={`text-sm font-black uppercase italic tracking-tighter truncate ${isElegant ? 'text-white' : 'text-zinc-900'}`}>
                  {activeLevel.title}: {activeLevel.rank}
                </h3>
              </div>

              <div className={`w-12 h-12 rounded-full border flex items-center justify-center ${
                isElegant ? 'border-white/5 bg-zinc-900/50' : 'border-zinc-200 bg-white'
              }`} style={{ color: activeLevel.color }}>
                <Shield size={20} />
              </div>
            </div>

            <div className="px-8 pb-40 space-y-12 mt-8">
              {/* Level Description Info */}
              <div className="space-y-4 px-2">
                <p className={`italic text-center text-xs leading-relaxed font-medium ${isElegant ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  {activeLevel.description}
                </p>
                <div className={`h-px w-12 mx-auto ${isElegant ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
              </div>

              {/* Sección A: Audios Fundamentales */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                  <PlayCircle size={18} className={isElegant ? 'text-[#D4AF37]' : 'text-blue-600'} />
                  <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] ${isElegant ? 'text-white/50' : 'text-zinc-400'}`}>Audios Fundamentales</h4>
                </div>
                <div className="space-y-2">
                  {levelAudios.map((audio) => (
                    <button
                      key={audio.id}
                      onClick={() => onSelectAudio(audio)}
                      className={`w-full flex items-center gap-4 p-4 border rounded-2xl active:scale-[0.98] transition-all text-left group ${
                        isElegant 
                          ? 'bg-zinc-950 border-white/[0.03] hover:bg-zinc-900' 
                          : 'bg-white border-zinc-100 hover:border-blue-300 shadow-sm'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-lg border relative ${isElegant ? 'border-white/5' : 'border-zinc-100'}`}>
                        <img 
                          src={audio.coverUrl} 
                          className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all" 
                          referrerPolicy="no-referrer" 
                        />
                        {completedAudios.includes(audio.id) && (
                          <div className={`absolute inset-0 flex items-center justify-center ${isElegant ? 'bg-accent/20' : 'bg-blue-500/20'}`}>
                            <Shield size={14} className="text-white" fill="currentColor" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className={`text-sm font-black transition-colors line-clamp-1 uppercase italic tracking-tighter ${
                          isElegant ? 'text-white group-hover:text-accent' : 'text-zinc-900 group-hover:text-blue-600'
                        }`}>
                          {audio.title}
                        </h5>
                        <p className={`text-[9px] font-bold uppercase tracking-widest ${isElegant ? 'text-zinc-600' : 'text-zinc-400'}`}>
                          {audio.author}
                        </p>
                      </div>
                      <div className={`p-2 rounded-full transition-all shadow-md border ${
                        isElegant 
                          ? 'bg-zinc-900 border-white/5 text-[#D4AF37] group-hover:bg-accent group-hover:text-black' 
                          : 'bg-zinc-100 border-zinc-200 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                      }`}>
                        <PlayCircle size={20} fill="currentColor" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sección B: Lecturas Obligatorias */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                  <Coffee size={18} className={isElegant ? 'text-[#D4AF37]' : 'text-amber-600'} />
                  <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] ${isElegant ? 'text-white/50' : 'text-zinc-400'}`}>Lecturas Obligatorias</h4>
                </div>
                <div className="space-y-2">
                  {levelBooks.map((book) => (
                    <button
                      key={book.id}
                      onClick={() => onNavigate('books')}
                      className={`w-full flex items-center gap-4 p-4 border rounded-2xl active:scale-[0.98] transition-all text-left group ${
                        isElegant 
                          ? 'bg-zinc-950 border-white/[0.03] hover:bg-zinc-900' 
                          : 'bg-white border-zinc-100 hover:border-amber-300 shadow-sm'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all shadow-lg flex-shrink-0 ${
                        isElegant ? 'bg-zinc-900 border-white/5 text-[#D4AF37]/50 group-hover:text-[#D4AF37]' : 'bg-zinc-50 border-zinc-200 text-amber-500 opacity-60 group-hover:opacity-100'
                      }`}>
                        <Coffee size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className={`text-sm font-black line-clamp-1 uppercase italic tracking-tighter ${
                          isElegant ? 'text-white/80' : 'text-zinc-900'
                        }`}>
                          {book.title}
                        </h5>
                        <p className={`text-[9px] font-bold uppercase tracking-widest ${isElegant ? 'text-zinc-600' : 'text-zinc-400'}`}>
                          {book.author}
                        </p>
                      </div>
                      <div className={`p-2 transition-all ${
                        isElegant ? 'text-[#D4AF37]/40 group-hover:text-[#D4AF37]' : 'text-zinc-300 group-hover:text-amber-600'
                      }`}>
                        <ChevronRight size={18} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
