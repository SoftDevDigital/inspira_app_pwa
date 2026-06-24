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
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10005]"
          />

          {/* Modal / Contenedor */}
          <motion.div
            initial={{ opacity: 0, y: 150, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 150, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed inset-x-4 bottom-6 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-[calc(100%-2rem)] max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-6 shadow-[0_20px_50px_rgba(255,140,0,0.2)] z-[10006] overflow-hidden select-none"
            role="dialog"
            aria-label="Instrucciones de instalación en iOS"
          >
            {/* Glow decorativo de fondo */}
            <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-zinc-900 blur-3xl pointer-events-none" />

            {/* Encabezado */}
            <div className="relative flex justify-between items-start mb-6">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-accent">
                  <Sparkles size={16} />
                </span>
                <div>
                  <h3 className="text-base font-black uppercase italic tracking-wider text-white">
                    Instalar en tu iPhone
                  </h3>
                  <p className="text-[11px] text-white/50 tracking-wide uppercase">
                    Paso a paso para iOS
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar modal"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition active:scale-95"
              >
                <X size={16} />
              </button>
            </div>

            {/* Pasos */}
            <div className="space-y-5 relative">
              {/* Paso 1 */}
              <div className="flex gap-4 items-start bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-accent/20 transition-all duration-300">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-black font-black italic shadow-[0_0_15px_rgba(255,140,0,0.3)]">
                  1
                </div>
                <div className="space-y-1">
                  <p className="text-[13px] font-bold text-white uppercase tracking-wide">
                    Toca el botón Compartir
                  </p>
                  <p className="text-[12px] text-white/70 leading-relaxed">
                    Presiona el ícono <span className="inline-flex items-center align-middle justify-center bg-white/10 p-1.5 rounded-lg mx-1 text-accent animate-pulse"><Share size={14} /></span> en la barra de navegación inferior de Safari.
                  </p>
                </div>
              </div>

              {/* Paso 2 */}
              <div className="flex gap-4 items-start bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-accent/20 transition-all duration-300">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-white/90 font-black italic border border-white/10">
                  2
                </div>
                <div className="space-y-1">
                  <p className="text-[13px] font-bold text-white uppercase tracking-wide">
                    Agregar al inicio
                  </p>
                  <p className="text-[12px] text-white/70 leading-relaxed">
                    Desplázate hacia abajo en el menú de opciones y selecciona <span className="text-accent font-semibold">"Agregar a la pantalla de inicio"</span>.
                  </p>
                </div>
              </div>

              {/* Paso 3 */}
              <div className="flex gap-4 items-start bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-accent/20 transition-all duration-300">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-white/90 font-black italic border border-white/10">
                  3
                </div>
                <div className="space-y-1">
                  <p className="text-[13px] font-bold text-white uppercase tracking-wide">
                    Confirma la descarga
                  </p>
                  <p className="text-[12px] text-white/70 leading-relaxed">
                    Toca <span className="inline-flex items-center align-middle justify-center bg-accent/20 px-2 py-0.5 rounded text-accent font-bold text-[11px] tracking-wide uppercase"><Plus size={10} className="mr-0.5" /> Agregar</span> en la esquina superior derecha para finalizar.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer / Nota */}
            <div className="mt-6 pt-4 border-t border-white/5 text-center">
              <p className="text-[11px] text-white/40 leading-relaxed">
                ¡Listo! Podrás acceder a INSPIRA como una app nativa, con mejor rendimiento y reproducciones estables desde tu pantalla de inicio.
              </p>
            </div>

            {/* Indicador visual inferior: simula la flecha indicando que el botón compartir está abajo */}
            <div className="mt-4 flex flex-col items-center gap-1 md:hidden">
              <span className="text-[10px] text-accent/80 font-bold uppercase tracking-widest animate-bounce">
                Toca aquí abajo
              </span>
              <div className="h-4 w-0.5 bg-gradient-to-b from-accent to-transparent animate-pulse" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
