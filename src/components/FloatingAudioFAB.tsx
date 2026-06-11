/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { AudioLines } from 'lucide-react';

interface FloatingAudioFABProps {
  isPlaying: boolean;
  onExpand: () => void;
  theme?: 'elegant' | 'clarity';
}

export default function FloatingAudioFAB({
  isPlaying,
  onExpand,
  theme = 'elegant'
}: FloatingAudioFABProps) {
  const isElegant = theme === 'elegant';

  return (
    <AnimatePresence>
     <motion.div
  initial={{ y: -20, opacity: 0, scale: 0.8 }}
  animate={{ y: 0, opacity: 1, scale: 1 }}
  exit={{ y: -20, opacity: 0, scale: 0.8 }}
  className="absolute bottom-24 right-6 z-[400]"
>
        <button
          onClick={onExpand}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 relative ${
            isPlaying ? 'animate-pulse' : ''
          } ${
            isElegant 
              ? 'bg-accent text-white hover:bg-accent-muted' 
              : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
        >
          {isPlaying && (
            <span className="absolute inset-0 rounded-full animate-ping bg-white opacity-20" />
          )}
          <AudioLines size={28} strokeWidth={2.5} className="text-white" />
          
          {/* Subtle Status Indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-white flex items-center justify-center shadow-sm">
             <div className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-green-500' : 'bg-zinc-400'}`} />
          </div>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
