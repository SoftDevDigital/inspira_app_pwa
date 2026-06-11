import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Music, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { Audio, Book, InspiraEvent } from '../types';

interface WeeklyDigestModalProps {
  audios: Audio[];
  books: Book[];
  events: InspiraEvent[];
  onClose: () => void;
}

export default function WeeklyDigestModal({ audios, books, events, onClose }: WeeklyDigestModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show after a slight delay for better UX
    const timer = setTimeout(() => setIsVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const newAudios = audios.filter(a => a.uploadedAt && new Date(a.uploadedAt) >= sevenDaysAgo).slice(0, 3);
  const newBooks = books.filter(b => b.createdAt && new Date(b.createdAt) >= sevenDaysAgo).slice(0, 3);
  
  // Events for the UPCOMING week (from today)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const weeklyEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    return eventDate >= new Date() && eventDate <= nextWeek;
  }).slice(0, 3);

  // If there's nothing new, don't show the modal
  if (newAudios.length === 0 && newBooks.length === 0 && weeklyEvents.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-sm bg-[#1A1A1A] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
          >
            {/* Header / Banner */}
            <div className="relative h-32 bg-gradient-to-br from-[#D4AF37] to-[#AA8B2E] p-6 flex flex-col justify-end">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors text-white"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="text-white fill-white" size={16} />
                <span className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em]">Novedades Semanales</span>
              </div>
              <h2 className="text-white text-2xl font-black italic uppercase tracking-tight leading-none">
                Resumen de <br/> la Semana
              </h2>
            </div>

            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {/* New Audios */}
              {newAudios.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <Music size={16} />
                    <h3 className="text-[11px] font-black uppercase tracking-widest">🎙️ Nuevos Audios</h3>
                  </div>
                  <div className="space-y-2">
                    {newAudios.map(audio => (
                      <div key={audio.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/5">
                        <img src={audio.coverUrl} alt={audio.title} className="w-10 h-10 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-bold truncate">{audio.title}</p>
                          <p className="text-white/40 text-[10px] truncate">{audio.author}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Books */}
              {newBooks.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-accent">
                    <BookOpen size={16} />
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-[#D4AF37]">📚 Nuevos Libros</h3>
                  </div>
                  <div className="space-y-2">
                    {newBooks.map(book => (
                      <div key={book.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/5">
                        <img src={book.coverUrl} alt={book.title} className="w-10 h-10 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-bold truncate">{book.title}</p>
                          <p className="text-white/40 text-[10px] truncate">{book.author}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weekly Events */}
              {weeklyEvents.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-white/60">
                    <CalendarIcon size={16} />
                    <h3 className="text-[11px] font-black uppercase tracking-widest">📅 Eventos de la Semana</h3>
                  </div>
                  <div className="space-y-2">
                    {weeklyEvents.map(event => (
                      <div key={event.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-1">
                        <p className="text-white text-xs font-bold">{event.title}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-accent text-[9px] font-bold uppercase tracking-wider">
                            {new Date(event.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                          </span>
                          <span className="text-white/20 text-[9px]">|</span>
                          <span className="text-white/40 text-[9px]">
                            {new Date(event.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer / CTA */}
            <div className="p-6 pt-0">
              <button 
                onClick={onClose}
                className="w-full py-4 bg-[#D4AF37] hover:bg-[#B8972F] text-black font-black uppercase tracking-[0.1em] rounded-2xl transition-all active:scale-95 shadow-lg shadow-[#D4AF37]/20"
              >
                ¡Entendido, vamos a escucharlos!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
