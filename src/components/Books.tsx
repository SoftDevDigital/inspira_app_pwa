/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BookOpen, Star, MessageCircle, ChevronRight, PlayCircle, Plus, Search, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useMemo } from 'react';

import { Audio, Book, EditorialSlot } from '../types';

interface BooksProps {
  theme?: 'elegant' | 'clarity';
  onAddToPlaylist?: (item: Audio | Book) => void;
  onSelectAudio?: (audio: Audio) => void;
  userPlan?: 'Gratis' | 'Premium';
  onOpenPremium?: () => void;
  editorialSlots?: EditorialSlot[];
  books?: Book[];
}

export default function Books({ theme = 'elegant', onAddToPlaylist, onSelectAudio, userPlan = 'Gratis', onOpenPremium, editorialSlots = [], books = [] }: BooksProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const bookOfMonth = useMemo(() => {
    const now = new Date().toISOString();
    const activeSlot = editorialSlots.find(s => s.type === 'monthly_book' && s.startDate <= now && s.endDate >= now);
    if (activeSlot) {
      return books.find(b => b.id === activeSlot.contentId);
    }
    return null;
  }, [books, editorialSlots]);

  const isElegant = theme === 'elegant';
  const isPremium = userPlan === 'Premium';

  const handlePlayBook = (book: Book, etapaIndex: number = 0) => {
    if (!isPremium) {
      onOpenPremium?.();
      return;
    }
    
    const etapa = book.etapas?.[etapaIndex];
    if (!etapa || !etapa.url) return;

    if (onSelectAudio) {
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
    }
  };

  const filteredBooks = useMemo(() => {
    return books.filter(book => 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, books]);

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-500 ${
      isElegant ? 'bg-black' : 'bg-[#F2F2F7]'
    }`}>
      <div className="pb-40 pt-8 px-6 space-y-12 max-w-4xl mx-auto w-full">
        <header className="space-y-2">
          <h1 className={`text-5xl font-black tracking-tighter uppercase italic transition-colors ${
            isElegant ? 'text-white' : 'text-zinc-900'
          }`}>LIBROS</h1>
          <p className={`${isElegant ? 'text-[#D4AF37]' : 'text-blue-600'} text-sm font-black uppercase tracking-[0.3em] transition-colors`}>
            Cultura y Mentalidad de Élite
          </p>
        </header>

        {/* Search Bar */}
        <div className="relative group flex items-center rounded-2xl border transition-all duration-300 max-w-lg mx-auto w-full overflow-hidden shadow-sm">
          <div className={`absolute inset-0 transition-opacity ${
            isElegant ? 'bg-white/5 opacity-40 group-focus-within:opacity-100' : 'bg-zinc-100 opacity-60 group-focus-within:opacity-100'
          }`} />
          <Search size={16} className={`absolute left-4 z-10 transition-colors ${
            isElegant ? 'text-zinc-500 group-focus-within:text-[#D4AF37]' : 'text-zinc-400 group-focus-within:text-blue-500'
          }`} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar libro o autor..."
            className={`relative z-10 w-full bg-transparent py-4 pl-12 pr-4 text-[12px] font-medium outline-none transition-colors border-none ring-0 ${
              isElegant ? 'text-white placeholder:text-zinc-600' : 'text-zinc-900 placeholder:text-zinc-400'
            }`}
          />
        </div>

        <div className="space-y-10">
          <AnimatePresence mode="popLayout">
            {filteredBooks.map((book, index) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                key={book.id}
                onClick={() => !isPremium && onOpenPremium?.()}
                className={`group relative flex flex-col md:flex-row gap-8 border rounded-[40px] p-8 transition-all shadow-2xl overflow-hidden ${
                  !isPremium ? 'opacity-40 grayscale-[0.6] cursor-pointer' : ''
                } ${
                  isElegant 
                    ? 'bg-zinc-900/40 border-white/5 hover:bg-zinc-900/60' 
                    : 'bg-white border-zinc-100'
                }`}
              >
              {/* Background Decoration */}
              <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity ${
                isElegant ? 'bg-[#D4AF37]/5' : 'bg-blue-500/5'
              }`} />

              <div className="w-full md:w-32 lg:w-40 flex-shrink-0">
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-500">
                  <img 
                    src={book.coverUrl} 
                    alt={book.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {!isPremium && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                      <Lock size={40} className="text-[#D4AF37]" fill="currentColor" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className={`absolute bottom-3 left-3 text-[8px] font-black px-2 py-1 rounded-full uppercase transition-colors ${
                    isElegant ? 'bg-[#D4AF37] text-black' : 'bg-blue-600 text-white'
                  }`}>
                    {book.type}
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-between py-2">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      {[...Array(book.rating)].map((_, i) => (
                        <Star key={i} size={12} fill={(isElegant || !isPremium) ? "#D4AF37" : "#3b82f6"} className={isElegant ? "text-[#D4AF37]" : "text-blue-500"} />
                      ))}
                    </div>
                    <h3 className={`text-3xl font-black leading-tight italic transition-colors line-clamp-2 ${
                      isElegant ? (isPremium ? 'text-white group-hover:text-[#D4AF37]' : 'text-zinc-500') : 'text-zinc-900 group-hover:text-blue-600'
                    }`}>
                      {book.title}
                    </h3>
                    <p className={`text-sm font-bold uppercase tracking-widest ${
                      isElegant ? (isPremium ? 'text-zinc-500' : 'text-zinc-700') : 'text-zinc-400'
                    }`}>{book.author}</p>
                  </div>
                  <p className={`text-base font-medium leading-relaxed italic transition-colors ${
                    isElegant ? (isPremium ? 'text-zinc-400' : 'text-zinc-600') : 'text-zinc-500'
                  }`}>
                    "{book.review}"
                  </p>
                </div>

                 <div className="mt-8 space-y-4">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isElegant ? 'text-accent' : 'text-blue-600'}`}>
                      ETAPAS DISPONIBLES
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(book.etapas || [{ nombre: 'Etapa 1', url: null }, { nombre: 'Etapa 2', url: null }]).map((etapa, eIdx) => (
                        <button
                          key={eIdx}
                          disabled={!etapa.url || !isPremium}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayBook(book, eIdx);
                          }}
                          className={`flex items-center justify-between p-3 rounded-2xl border transition-all active:scale-95 ${
                            etapa.url 
                              ? (isElegant ? 'bg-white/5 border-white/10 hover:border-accent' : 'bg-blue-50 border-blue-100 hover:border-blue-300')
                              : 'opacity-40 bg-transparent border-dashed border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${etapa.url ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`} />
                            <span className={`text-[11px] font-bold uppercase transition-colors ${
                              etapa.url 
                                ? (isElegant ? 'text-white' : 'text-zinc-900') 
                                : 'text-zinc-600'
                            }`}>
                              {etapa.nombre}
                            </span>
                          </div>
                          {etapa.url ? (
                            <PlayCircle size={16} className={isElegant ? "text-accent" : "text-blue-600"} />
                          ) : (
                            <span className="text-[9px] font-black text-zinc-600 uppercase italic">Próximamente</span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="pt-4 flex items-center gap-4">
                      {isPremium && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onAddToPlaylist?.(book); }}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-2xl transition-colors text-[11px] font-black uppercase tracking-widest ${
                            isElegant ? 'bg-zinc-800 text-[#D4AF37] hover:bg-zinc-700' : 'bg-zinc-100 text-blue-600 hover:bg-zinc-200'
                          }`}
                        >
                          <Plus size={18} />
                          Añadir a Mi Lista
                        </button>
                      )}
                    </div>
                  </div>
              </div>
              
              <div className="absolute right-8 top-8 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 transition-transform">
                <ChevronRight className={isElegant ? "text-zinc-600" : "text-zinc-300"} size={32} />
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
        </div>

        {/* Suggestion Card */}
        <footer className={`mt-12 border rounded-[40px] p-10 text-center space-y-6 transition-all ${
          isElegant 
            ? 'bg-gradient-to-br from-zinc-800/40 to-transparent border-white/5' 
            : 'bg-white border-zinc-100 shadow-xl'
        }`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto border shadow-xl transition-all ${
            isElegant ? 'bg-zinc-800 border-white/10' : 'bg-blue-50 border-blue-100'
          }`}>
             <BookOpen className={isElegant ? "text-[#D4AF37]" : "text-blue-600"} size={36} />
          </div>
          <div className="space-y-2">
            <h4 className={`text-2xl font-black uppercase italic tracking-tighter transition-colors ${
              isElegant ? 'text-white' : 'text-zinc-900'
            }`}>¿Tienes un libro que recomendar?</h4>
            <p className={`text-sm font-medium transition-colors ${
              isElegant ? 'text-zinc-500' : 'text-zinc-400'
            }`}>Envía tu recomendación para que sea revisada por Naya y las Directoras.</p>
          </div>
          <button className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all border-2 ${
            isElegant 
              ? 'bg-transparent border-white/20 text-white hover:bg-white hover:text-black' 
              : 'bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100'
          }`}>
            Sugerir lectura
          </button>
        </footer>
      </div>
    </div>
  );
}
