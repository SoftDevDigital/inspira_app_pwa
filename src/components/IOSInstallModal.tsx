import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Share, Plus, Sparkles } from 'lucide-react';

interface IOSInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IOSInstallModal({ isOpen, onClose }: IOSInstallModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Fondo difuminado */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10005]"
          />

          {/* Modal / Contenedor compacto */}
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 240 }}
            className="fixed inset-x-4 bottom-6 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-[calc(100%-2rem)] max-w-sm bg-zinc-950 border border-white/10 rounded-2xl p-5 shadow-[0_15px_40px_rgba(255,140,0,0.15)] z-[10006] overflow-y-auto max-h-[80vh] select-none scrollbar-hide"
            role="dialog"
            aria-label="Instrucciones de instalación en iOS"
          >
            {/* Glow sutil */}
            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-accent/5 blur-2xl pointer-events-none" />

            {/* Encabezado */}
            <div className="relative flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 text-accent">
                  <Sparkles size={14} />
                </span>
                <h3 className="text-[14px] font-black uppercase italic tracking-wider text-white">
                  Instalar en iPhone / iPad
                </h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar modal"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition active:scale-95"
              >
                <X size={14} />
              </button>
            </div>

            {/* Pasos Ultra Directos */}
            <div className="space-y-3">
              {/* Paso 1 */}
              <div className="flex gap-3 items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-black text-xs font-black italic shadow-[0_0_10px_rgba(255,140,0,0.2)]">
                  1
                </div>
                <p className="text-[12px] text-white/90 leading-snug">
                  Toca <span className="inline-flex items-center align-middle justify-center bg-white/10 p-1 rounded mx-0.5 text-accent"><Share size={12} /></span> (Compartir) abajo en Safari.
                </p>
              </div>

              {/* Paso 2 */}
              <div className="flex gap-3 items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-850 text-white/95 text-xs font-black italic border border-white/5">
                  2
                </div>
                <p className="text-[12px] text-white/90 leading-snug">
                  Selecciona <span className="text-accent font-bold">"Agregar a la pantalla de inicio"</span>.
                </p>
              </div>

              {/* Paso 3 */}
              <div className="flex gap-3 items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-850 text-white/95 text-xs font-black italic border border-white/5">
                  3
                </div>
                <p className="text-[12px] text-white/90 leading-snug">
                  Presiona <span className="text-accent font-bold">"Agregar"</span> arriba a la derecha.
                </p>
              </div>
            </div>

            {/* Indicador visual minimalista para iPhone */}
            <div className="mt-4 flex flex-col items-center gap-0.5 md:hidden">
              <span className="text-[9px] text-accent/70 font-bold uppercase tracking-widest animate-bounce">
                Ver abajo en tu pantalla
              </span>
              <div className="h-3 w-0.5 bg-accent/50 animate-pulse" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
