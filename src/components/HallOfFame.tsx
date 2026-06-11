/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { Crown, Star, Award, TrendingUp, ChevronLeft, Play, BookOpen, Sparkles, Plus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SPEAKERS } from '../constants';
import { Speaker, Audio, Book, AppConfig } from '../types';

interface HallOfFameProps {
  theme?: 'elegant' | 'clarity';
  onAddToPlaylist?: (item: Audio | Book) => void;
  onSelectAudio?: (audio: Audio) => void;
  onSelectBook?: (book: Book) => void;
  speakers?: Speaker[];
  allAudios?: Audio[];
  allBooks?: Book[];
  appConfig?: AppConfig | null;
}

export default function HallOfFame({ 
  theme = 'elegant', 
  onAddToPlaylist, 
  onSelectAudio, 
  onSelectBook,
  speakers = SPEAKERS, 
  allAudios = [],
  allBooks = [],
  appConfig 
}: HallOfFameProps) {
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const isElegant = theme === 'elegant';

  const talentContent = useMemo(() => {
    if (!selectedSpeaker) return { audios: [], books: [] };
    
    return {
      audios: allAudios.filter(a => a.author === selectedSpeaker.name || (a as any).talentId === selectedSpeaker.id),
      books: allBooks.filter(b => b.author === selectedSpeaker.name || (b as any).talentId === selectedSpeaker.id)
    };
  }, [selectedSpeaker, allAudios, allBooks]);

  const handlePlayMentor = (speaker: Speaker) => {
    if (onSelectAudio) {
      onSelectAudio({
        id: `MENTOR-${speaker.id}`,
        title: `Mentoría: ${speaker.name}`,
        author: speaker.name,
        coverUrl: speaker.photoUrl,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', // Mock URL
        category: 'Salón de la Fama',
        duration: 2400
      });
    }
  };

  const filteredSpeakers = useMemo(() => {
    return speakers.filter(speaker => 
      speaker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      speaker.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, speakers]);

  if (selectedSpeaker) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className={`fixed inset-0 z-[150] flex flex-col overflow-y-auto transition-colors duration-500 ${
          isElegant ? 'bg-black' : 'bg-[#F2F2F7]'
        }`}
      >
        {/* Profile Header */}
        <div className={`sticky top-0 z-[160] backdrop-blur-xl border-b px-6 py-8 flex items-center justify-between transition-colors ${
          isElegant ? 'bg-black/90 border-white/5' : 'bg-white/90 border-zinc-200'
        }`}>
          <button 
            onClick={() => setSelectedSpeaker(null)}
            type="button"
            className={`flex items-center gap-2 active:scale-95 transition-all group ${
              isElegant ? 'text-[#D4AF37]' : 'text-blue-600'
            }`}
          >
            <ChevronLeft size={24} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] group-hover:tracking-[0.4em] transition-all">Volver al Salón</span>
          </button>
          <Sparkles size={20} className={`${isElegant ? 'text-[#D4AF37]' : 'text-blue-500'} animate-pulse`} />
        </div>

        <div className="px-8 pt-8 pb-32 space-y-12">
          {/* Identity Section */}
          <div className="flex flex-col items-center text-center space-y-6">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className={`absolute inset-0 blur-[60px] rounded-full scale-150 transition-colors ${
                isElegant ? 'bg-[#D4AF37]/20' : 'bg-blue-500/10'
              }`} />
              <div className={`relative w-56 h-56 rounded-full overflow-hidden border-4 transition-all ${
                isElegant 
                  ? 'border-[#D4AF37]/30 shadow-[0_0_50px_rgba(212,175,55,0.2)]' 
                  : 'border-white shadow-[0_10px_30px_rgba(59,130,246,0.1)]'
              }`}>
                <img 
                  src={selectedSpeaker.photoUrl} 
                  alt={selectedSpeaker.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full border-4 !font-light !text-[10px] uppercase tracking-[1px] italic shadow-xl transition-colors ${
                isElegant ? 'bg-[#D4AF37] text-black border-black' : 'bg-blue-600 text-white border-white'
              }`}>
                {selectedSpeaker.role}
              </div>
            </motion.div>

            <div className="space-y-3 pt-4">
              <h2 className={`text-4xl font-black italic tracking-tighter uppercase leading-tight transition-colors ${
                isElegant ? 'text-white' : 'text-zinc-900'
              }`}>
                {selectedSpeaker.name}
              </h2>
              
              {selectedSpeaker.bio && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="max-w-xl mx-auto mt-6 px-4 md:px-6 relative"
                >
                  <div className={`p-6 md:p-8 rounded-2xl border relative overflow-hidden transition-all backdrop-blur-md ${
                    isElegant 
                      ? 'bg-gradient-to-br from-neutral-900/90 to-black/80 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                      : 'bg-white border-zinc-100 shadow-sm'
                  }`}>
                    {/* Quotation Mark Decoration */}
                    <div className={`absolute top-2 left-4 text-5xl opacity-40 pointer-events-none italic font-serif transition-colors ${
                      isElegant ? 'text-amber-500/40' : 'text-blue-600/20'
                    }`}>
                      “
                    </div>
                    
                    <p className={`font-serif text-[10px] md:text-[12px] leading-loose tracking-wide font-light italic text-center px-4 relative z-10 normal-case ${
                      isElegant ? 'text-gray-300' : 'text-zinc-600'
                    }`}>
                      {selectedSpeaker.bio}
                    </p>

                    <div className={`absolute bottom-0 right-4 text-5xl opacity-40 pointer-events-none italic font-serif transition-colors ${
                      isElegant ? 'text-amber-500/40' : 'text-blue-600/20'
                    }`}>
                      ”
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Action Sections (Mentoría & Legado) */}
          <div className="grid grid-cols-1 gap-6">
            {talentContent.audios.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Play size={14} className={isElegant ? 'text-[#D4AF37]' : 'text-blue-600'} />
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isElegant ? 'text-white' : 'text-zinc-900'}`}>Mentorías Disponibles</span>
                </div>
                <div className="space-y-3">
                  {talentContent.audios.map((audio) => (
                    <motion.div
                      key={audio.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onSelectAudio?.(audio)}
                      className={`p-4 rounded-[24px] border flex items-center gap-4 transition-all ${
                        isElegant ? 'bg-zinc-900/40 border-white/5 hover:border-[#D4AF37]/30' : 'bg-white border-zinc-100 hover:border-blue-400 shadow-sm'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={audio.coverUrl} className="w-full h-full object-cover" alt={audio.title} referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-bold uppercase tracking-tight truncate ${isElegant ? 'text-white' : 'text-zinc-900'}`}>{audio.title}</h4>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-widest truncate">{audio.category}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToPlaylist?.(audio);
                        }}
                        className={`p-2 rounded-full transition-colors ${
                          isElegant ? 'text-white/20 hover:text-[#D4AF37] hover:bg-white/5' : 'text-zinc-300 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <Plus size={16} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`p-8 rounded-[32px] border border-dashed text-center transition-colors ${
                isElegant ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-zinc-50'
              }`}>
                <p className={`text-xs font-medium italic ${isElegant ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Próximamente: Nuevas mentorías de {selectedSpeaker.name}
                </p>
              </div>
            )}

            {talentContent.books.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <BookOpen size={14} className={isElegant ? 'text-[#D4AF37]' : 'text-blue-600'} />
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isElegant ? 'text-white' : 'text-zinc-900'}`}>Legado Literario</span>
                </div>
                <div className="space-y-3">
                  {talentContent.books.map((book) => (
                    <motion.div
                      key={book.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onSelectBook?.(book)}
                      className={`p-4 rounded-[24px] border flex items-center gap-4 transition-all ${
                        isElegant ? 'bg-zinc-900/40 border-white/5 hover:border-[#D4AF37]/30' : 'bg-white border-zinc-100 hover:border-blue-400 shadow-sm'
                      }`}
                    >
                      <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
                        <img src={book.coverUrl} className="w-full h-full object-cover" alt={book.title} referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-bold uppercase tracking-tight truncate ${isElegant ? 'text-white' : 'text-zinc-900'}`}>{book.title}</h4>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-widest leading-relaxed truncate">{book.review}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToPlaylist?.(book);
                        }}
                        className={`p-2 rounded-full transition-colors ${
                          isElegant ? 'text-white/20 hover:text-[#D4AF37] hover:bg-white/5' : 'text-zinc-300 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <Plus size={16} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Original Buttons as fallback for VIP Mentorship if no specific ones found? */}
            {talentContent.audios.length === 0 && (
              <motion.button 
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePlayMentor(selectedSpeaker)}
                className={`group relative h-40 rounded-[40px] overflow-hidden shadow-2xl flex flex-col items-center justify-center gap-4 border-b-8 transition-all ${
                  isElegant 
                    ? 'bg-[#D4AF37] border-black/20' 
                    : 'bg-white border-blue-100'
                }`}
              >
                <div className={`absolute top-0 right-0 p-4 transition-opacity ${isElegant ? 'opacity-20' : 'opacity-10 text-blue-500'}`}>
                  <Play size={80} fill="currentColor" />
                </div>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-all ${
                  isElegant ? 'bg-black text-[#D4AF37]' : 'bg-blue-600 text-white'
                }`}>
                  <Play size={28} fill="currentColor" className="ml-1" />
                </div>
                <div className="text-center">
                  <span className={`block text-[9px] font-black uppercase tracking-[0.3em] ${isElegant ? 'text-black/60' : 'text-zinc-400'}`}>Audio VIP</span>
                  <span className={`block text-xl font-black uppercase tracking-widest italic leading-none ${isElegant ? 'text-black' : 'text-zinc-900'}`}>Escuchar Mentoría</span>
                </div>
              </motion.button>
            )}
          </div>

          {/* Inspirational Tagline */}
          <div className="text-center px-6 opacity-30">
            <p className={`text-[11px] font-medium italic ${isElegant ? 'text-zinc-400' : 'text-zinc-500'}`}>
              "Tu linaje comienza hoy. Sé la directora que el mundo espera que seas."
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`flex flex-col h-full overflow-y-auto transition-colors duration-500 ${
      isElegant ? 'bg-black' : 'bg-[#F2F2F7]'
    }`}>
      <div className="px-8 pb-40">
        {/* Header Section - Natural Scroll */}
        <div className="text-center pt-16 pb-8 space-y-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`inline-block p-1 rounded-full mb-2 bg-gradient-to-tr ${
              isElegant ? 'from-[#D4AF37] via-transparent to-transparent' : 'from-blue-500 via-transparent to-transparent'
            }`}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all ${
              isElegant 
                ? 'bg-zinc-900 border-white/10 shadow-[0_0_20px_rgba(212,175,55,0.2)]' 
                : 'bg-white border-zinc-100 shadow-[0_10px_20px_rgba(59,130,246,0.05)]'
            }`}>
              <Crown size={24} className={isElegant ? "text-[#D4AF37]" : "text-blue-600"} fill="currentColor" />
            </div>
          </motion.div>
          <div className="space-y-1">
            <h2 className={`text-[18px] font-black tracking-widest uppercase italic leading-none transition-colors ${
              isElegant ? 'text-white' : 'text-zinc-900'
            }`}>
              Salón de la Fama
            </h2>
            <div className={`h-[1px] w-8 mx-auto ${isElegant ? 'bg-[#D4AF37]/50' : 'bg-blue-600/30'}`} />
            <p className={`text-[9px] font-black uppercase tracking-[0.4em] ${isElegant ? 'text-zinc-500' : 'text-zinc-400'}`}>Star Talents / Speakers</p>
          </div>
        </div>

        {/* Career Opportunity Banner */}
        <div className="px-1 mb-8">
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const waNumber = appConfig?.whatsappVentas || "521234567890";
              window.open(`https://wa.me/${waNumber.replace(/\+/g, '')}?text=Hola,%20soy%20Directora%20y%20me%20gustar%C3%ADa%20sumarme%20como%20Speaker%20en%20INSPIRA`, '_blank');
            }}
            className={`w-full p-6 rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${
              isElegant ? 'border-[#D4AF37]/30 bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10' : 'border-blue-200 bg-blue-50/50 hover:bg-blue-50'
            }`}
          >
            <Sparkles className={isElegant ? 'text-[#D4AF37]' : 'text-blue-500'} size={24} />
            <div className="text-center">
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isElegant ? 'text-[#D4AF37]' : 'text-blue-600'}`}>¿Eres Directora o Rango Superior?</p>
              <h3 className={`text-lg font-black italic tracking-tighter uppercase ${isElegant ? 'text-white' : 'text-zinc-900'}`}>Sé un Star Talent INSPIRA</h3>
            </div>
            <p className={`text-[9px] font-medium max-w-[200px] leading-relaxed ${isElegant ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Postúlate para compartir tu legado con toda la comunidad.
            </p>
          </motion.button>
        </div>

        {/* Search Bar */}
        <div className="px-1 mb-8">
          <div className={`relative group flex items-center rounded-2xl border transition-all duration-300 ${
            isElegant 
              ? 'bg-white/5 border-white/10 focus-within:border-[#D4AF37]/50 focus-within:bg-white/10' 
              : 'bg-zinc-100 border-zinc-200 focus-within:border-blue-400 focus-within:bg-white'
          }`}>
            <Search size={16} className={`absolute left-4 transition-colors ${
              isElegant ? 'text-zinc-500 group-focus-within:text-[#D4AF37]' : 'text-zinc-400 group-focus-within:text-blue-500'
            }`} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar mentora o rango..."
              className={`w-full bg-transparent py-4 pl-12 pr-4 text-[12px] font-medium outline-none transition-colors ${
                isElegant ? 'text-white placeholder:text-zinc-600' : 'text-zinc-900 placeholder:text-zinc-400'
              }`}
            />
          </div>
        </div>

        {/* Speakers Grid */}
        <div className="grid grid-cols-2 gap-4 pb-40">
          <AnimatePresence mode="popLayout">
            {filteredSpeakers.map((speaker, index) => (
              <motion.button
                layout
                key={speaker.name}
                onClick={() => setSelectedSpeaker(speaker)}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                viewport={{ once: true }}
                transition={{ delay: (index % 10) * 0.05 }}
                whileTap={{ scale: 0.95 }}
                className={`group relative flex flex-col items-center text-center p-4 border rounded-[32px] transition-all space-y-3 shadow-lg ${
                  isElegant 
                    ? 'bg-zinc-900/40 border-white/5 hover:border-[#D4AF37]/30' 
                    : 'bg-white border-zinc-100 hover:border-blue-400'
                }`}
              >
              {/* Rank / Number Sticky Label */}
              <div className={`absolute top-3 left-3 border rounded-lg px-2 py-0.5 backdrop-blur-sm transition-colors ${
                isElegant ? 'bg-black/40 border-white/10' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <span className={`text-[9px] font-black italic ${isElegant ? 'text-[#D4AF37]' : 'text-blue-600'}`}>
                  #{String(index + 1).padStart(2, '0')}
                </span>
              </div>

              {/* Photo */}
              <div className={`relative w-20 h-20 rounded-full overflow-hidden border-2 transition-all ${
                isElegant ? 'border-white/10 group-hover:border-[#D4AF37]/50' : 'border-zinc-100 group-hover:border-blue-500'
              }`}>
                <img 
                  src={speaker.photoUrl} 
                  alt={speaker.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Info */}
              <div className="space-y-2 w-full overflow-hidden">
                <div className="flex items-center justify-center gap-1 w-full px-1">
                  <h4 className={`text-[14px] font-black italic tracking-tight uppercase transition-colors truncate whitespace-nowrap ${
                    isElegant ? 'text-white group-hover:text-[#D4AF37]' : 'text-zinc-900 group-hover:text-blue-600'
                  }`}>
                    {speaker.name}
                  </h4>
                  {index < 3 && <Star size={8} className={isElegant ? 'text-[#D4AF37]' : 'text-blue-500'} fill="currentColor" />}
                </div>
                <p className={`text-zinc-500 !text-[10px] !font-light uppercase tracking-[1px] truncate px-2`}>
                  {speaker.role}
                </p>
                
                <div className="flex flex-col items-center gap-1 pt-2">
                  <div className={`flex items-center gap-1 text-[7px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full transition-all ${
                    isElegant 
                      ? 'text-white/40 bg-white/5 group-hover:bg-[#D4AF37]/10 group-hover:text-[#D4AF37]' 
                      : 'text-zinc-400 bg-zinc-50 group-hover:bg-blue-50 group-hover:text-blue-600'
                  }`}>
                    <Award size={8} />
                    <span>Mentoría</span>
                  </div>
                  <div className={`flex items-center gap-1 text-[7px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full transition-all ${
                    isElegant 
                      ? 'text-white/40 bg-white/5 group-hover:bg-[#D4AF37]/10 group-hover:text-[#D4AF37]' 
                      : 'text-zinc-400 bg-zinc-50 group-hover:bg-amber-50 group-hover:text-amber-600'
                  }`}>
                    <TrendingUp size={8} />
                    <span>Su Legado</span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
