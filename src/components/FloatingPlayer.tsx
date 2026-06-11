/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, ChevronUp, SkipForward, ListMusic, X } from 'lucide-react';
import { Audio, UserPlan } from '../types';

interface FloatingPlayerProps {
  currentAudio: Audio | null;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentTime: number;
  duration: number;
  onExpand: () => void;
  onNext: () => void;
  userPlan: UserPlan;
  theme?: 'elegant' | 'clarity';
  queue: Audio[];
  isLoading?: boolean;
}

export default function FloatingPlayer({
  currentAudio,
  isPlaying,
  setIsPlaying,
  currentTime,
  duration,
  onExpand,
  onNext,
  userPlan,
  theme = 'elegant',
  queue,
  isLoading
}: FloatingPlayerProps) {
  if (!currentAudio) return null;

  const isElegant = theme === 'elegant';
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
  initial={{ y: 100, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  exit={{ y: 100, opacity: 0 }}
  className="absolute bottom-[52px] left-0 right-0 z-[90] px-3 sm:px-4 pointer-events-none"
>
        <div 
          onClick={onExpand}
          className={`w-full max-w-md mx-auto pointer-events-auto cursor-pointer rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.7)] border flex items-center transition-all duration-300 active:scale-[0.98] ${
            isElegant 
              ? 'bg-zinc-900/98 backdrop-blur-3xl border-white/10' 
              : 'bg-white/98 backdrop-blur-3xl border-zinc-200'
          }`}
        >
          {/* Progress Bar (Mini) */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${isElegant ? 'bg-accent' : 'bg-blue-600'}`} 
              style={{ width: `${progress}%` }} 
            />
          </div>

          <div className="flex items-center flex-1 p-5 pb-6 gap-3 min-w-0">
            {/* Cover Art */}
            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
              <img 
                src={currentAudio.coverUrl} 
                alt={currentAudio.title} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/10" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pb-1">
              <h4 className={`text-[13px] font-black uppercase tracking-tight truncate italic ${isElegant ? 'text-white' : 'text-zinc-900'}`}>{currentAudio.title}</h4>
              <div className="flex items-center gap-1.5">
                <p className={`text-[11px] font-bold uppercase tracking-widest truncate ${isElegant ? 'text-accent' : 'text-blue-600'}`}>
                  {currentAudio.author}
                </p>
                {isLoading && (
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 pr-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPlaying(!isPlaying);
                }}
                className={`p-3 rounded-full transition-all active:scale-90 ${
                  isElegant ? 'text-white hover:bg-white/10' : 'text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNext();
                }}
                className={`p-3 rounded-full transition-all active:scale-90 ${isElegant ? 'text-white hover:bg-white/10' : 'text-zinc-900 hover:bg-zinc-100'}`}
                title="Siguiente"
              >
                <SkipForward size={24} fill="currentColor" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
