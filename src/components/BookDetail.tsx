/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowLeft, PlayCircle, Plus, Star, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { Audio, Book } from '../types';

interface BookDetailProps {
  book: Book;
  onBack: () => void;
  onSelectAudio: (audio: Audio) => void;
  onAddToPlaylist?: (item: Audio | Book) => void;
  userPlan?: 'Gratis' | 'Premium';
  onOpenPremium?: () => void;
  theme?: 'elegant' | 'clarity';
}

export default function BookDetail({ 
  book, 
  onBack, 
  onSelectAudio, 
  onAddToPlaylist, 
  userPlan = 'Gratis', 
  onOpenPremium,
  theme = 'elegant' 
}: BookDetailProps) {
  const isElegant = theme === 'elegant';
  const isPremium = userPlan === 'Premium';

  const handlePlayBook = (book: Book, etapaIndex: number = 0) => {
    if (!isPremium) {
      onOpenPremium?.();
      return;
    }
    
    const etapa = book.etapas?.[etapaIndex];
    if (!etapa || !etapa.url) return;

    onSelectAudio({
      id: `${book.id}_etapa_${etapaIndex}`,
      title: `${book.title} - ${etapa.nombre}`,
      author: book.author,
      coverUrl: book.coverUrl,
      audioUrl: etapa.url,
      contentType: 'audiobook',
      category: book.category || 'Audiolibros',
      duration: 1800,
      isPremium: true,
      plays: 0,
      weeklyPlays: 0,
      uploadedAt: new Date().toISOString()
    });
  };

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-500 ${
      isElegant ? 'bg-black text-white' : 'bg-[#F2F2F7] text-zinc-900'
    }`}>
      <div className="pb-40 pt-6 px-6 max-w-2xl mx-auto w-full">
        {/* Navigation */}
        <button 
          onClick={onBack}
          className={`flex items-center gap-2 mb-8 group transition-all ${
            isElegant ? 'text-zinc-500 hover:text-accent' : 'text-zinc-400 hover:text-blue-600'
          }`}
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest italic">Volver</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          {/* Hero Section */}
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="relative w-48 h-72 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-500">
              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              {!isPremium && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                  <Lock size={48} className="text-accent" />
                </div>
              )}
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-1">
                {[...Array(book.rating || 5)].map((_, i) => (
                  <Star key={i} size={14} fill={isElegant ? "#D4AF37" : "#3b82f6"} className={isElegant ? "text-[#D4AF37]" : "text-blue-500"} />
                ))}
              </div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none break-words">
                {book.title}
              </h1>
              <p className={`text-sm font-black uppercase tracking-[0.3em] ${isElegant ? 'text-accent' : 'text-blue-600'}`}>
                {book.author}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className={`p-8 rounded-[40px] border ${
            isElegant ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-zinc-100 shadow-sm'
          }`}>
            <p className={`text-lg font-medium leading-relaxed italic opacity-80 ${isElegant ? 'text-zinc-300' : 'text-zinc-600'}`}>
              "{book.review}"
            </p>
          </div>

          {/* Stages */}
          <div className="space-y-6">
            <h3 className={`text-xs font-black uppercase tracking-[0.4em] italic pl-4 opacity-60`}>
              Etapas Literarias
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {(book.etapas || []).map((etapa, idx) => (
                <button
                  key={idx}
                  disabled={!etapa.url || !isPremium}
                  onClick={() => handlePlayBook(book, idx)}
                  className={`flex items-center justify-between p-6 rounded-[32px] border transition-all active:scale-[0.98] ${
                    etapa.url 
                      ? (isElegant ? 'bg-zinc-900/60 border-white/5 hover:border-accent' : 'bg-white border-zinc-100 hover:border-blue-300 shadow-sm')
                      : 'opacity-30 cursor-not-allowed grayscale'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      etapa.url ? 'bg-accent/10 text-accent' : 'bg-zinc-800 text-zinc-600'
                    }`}>
                      <span className="font-black italic text-lg">{idx + 1}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] font-black uppercase tracking-widest block opacity-40 mb-1">CAPÍTULO</span>
                      <span className="text-sm font-black uppercase italic tracking-tighter">{etapa.nombre}</span>
                    </div>
                  </div>
                  {etapa.url ? (
                    <PlayCircle size={28} className={isElegant ? "text-accent" : "text-blue-600"} strokeWidth={2.5} />
                  ) : (
                    <span className="text-[10px] font-black uppercase opacity-20 italic pr-2">Próximamente</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Action */}
          {isPremium && onAddToPlaylist && (
            <button
              onClick={() => onAddToPlaylist(book)}
              className={`w-full py-5 rounded-[32px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all ${
                isElegant ? 'bg-white text-black hover:bg-accent' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-500/20'
              }`}
            >
              <Plus size={20} />
              Añadir a mi biblioteca
            </button>
          )}

          {!isPremium && (
            <button
              onClick={onOpenPremium}
              className="w-full py-6 rounded-[32px] bg-accent text-black font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-accent/20 active:scale-95 transition-all"
            >
              ⭐ Desbloquear Mentoría Completa
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
