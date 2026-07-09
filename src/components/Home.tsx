/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Play, BookOpen, ChevronRight, Search, Heart, X, Key, Trophy, Gift, Sparkles, Plus, ListMusic, Clock, Coffee, Menu, Check, Star, LayoutGrid, Radio, Award, TrendingUp, Share, FolderHeart, Lock as LockIcon, Video, ExternalLink, CalendarDays, Music } from 'lucide-react';
import { WHATSAPP_PREMIUM_LINK, SPEAKERS, getWeeklyAudio, RECOMMENDED_BOOKS, BRANDING } from '../constants';
import { Audio, UserPlan, User, Speaker, Book, InspiraEvent, AppConfig, EditorialSlot } from '../types';
import { useGlobalPlaylists } from '../hooks/useGlobalPlaylists';
import MarqueeTitle from './MarqueeTitle';
import DiamondListIcon from './DiamondListIcon';
import HomeHeader from './HomeHeader';

interface HomeProps {
  activeEvent?: InspiraEvent | null;
  audios?: Audio[];
  books?: Book[];
  onSelectAudio: (audio: Audio) => void;
  userPlan: UserPlan;
  favorites: string[];
  completedAudios: string[];
  onToggleFavorite: (audioId: string) => void;
  user: User | null;
  onOpenAdmin?: () => void;
  onOpenPremium?: () => void;
  audioInProgress?: Audio | null;
  onAddToPlaylist?: (audio: Audio) => void;
  onSharePass?: (audio: Audio) => void;
  isExpiringTomorrow?: boolean;
  onNavigate?: (tab: string) => void;
  onSelectBook?: (book: Book) => void;
  onOpenSidebar?: () => void;
  onOpenTrophies?: () => void;
  onExpand?: () => void;
  theme?: 'elegant' | 'clarity';
  onLogoTap?: (isPressing: boolean) => void;
  appConfig?: AppConfig | null;
  editorialSlots?: EditorialSlot[];
}

const MarqueeRow = memo(({ items, type, userPlan, onOpenPremium, onSelectAudio, onSelectBook, onNavigate, theme }: { 
  items: any[], 
  type: 'audio' | 'book', 
  userPlan: UserPlan,
  onOpenPremium?: () => void,
  onSelectAudio: (audio: Audio) => void,
  onSelectBook?: (book: Book) => void,
  onNavigate?: (tab: string) => void,
  theme?: 'elegant' | 'clarity'
}) => {
  const isFree = userPlan === 'Gratis';
  const isElegant = theme === 'elegant';
  
  return (
    <div className="relative overflow-hidden w-screen -mx-6">
      <motion.div 
        animate={{ x: [0, -256 * items.length] }} 
        transition={{ 
          duration: items.length * 5, 
          repeat: Infinity, 
          ease: "linear"
        }}
        className="flex whitespace-nowrap gap-4 px-6 py-2"
        style={{ 
          width: "fit-content",
          willChange: "transform",
          transform: "translateZ(0)"
        }}
      >
    {([...(items || []), ...(items || []), ...(items || [])]).map((item, idx) => {
          const isLocked = isFree && item?.isPremium;
          return (
            <button
              key={`${item?.id || idx}-${idx}`}
              onClick={() => {
                if (type === 'audio') {
                  onSelectAudio(item);
                } else {
                  if (isLocked) {
                    onOpenPremium?.();
                  } else if (onSelectBook) {
                    onSelectBook(item);
                  }
                }
              }}
              className={`inline-flex items-center gap-4 w-[240px] p-4 rounded-[24px] border transition-all text-left relative overflow-hidden group active:scale-95 flex-shrink-0 ${
                isLocked ? 'opacity-50 grayscale cursor-pointer' : 'cursor-pointer hover:border-accent/40'
              } ${isElegant ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-zinc-100 shadow-sm'}`}
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-lg relative">
                <img src={item?.coverUrl} alt={item?.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                {isLocked && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <LockIcon size={18} className="text-accent" fill="currentColor" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <MarqueeTitle 
                  title={item?.title} 
                  className={`text-base font-black italic uppercase tracking-tighter leading-tight ${isElegant ? 'text-white' : 'text-zinc-900'} group-hover:text-accent transition-colors`} 
                />
                <p className={`text-[11px] font-medium uppercase tracking-widest ${isElegant ? 'text-text-dim' : 'text-zinc-500'}`}>
                  {type === 'audio' ? item?.author : `Autor ${item?.author}`}
                </p>
              </div>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
});

export default function Home({ 
  activeEvent, 
  audios = [], 
  books = [], 
  onSelectAudio, 
  userPlan, 
  favorites, 
  completedAudios, 
  onToggleFavorite, 
  user, 
  onOpenAdmin, 
  onOpenPremium, 
  audioInProgress, 
  onAddToPlaylist, 
  onSharePass, 
  isExpiringTomorrow, 
  onNavigate, 
  onSelectBook, 
  onOpenSidebar, 
  onOpenTrophies,
  onExpand, 
  theme = 'elegant', 
  onLogoTap, 
  appConfig, 
  editorialSlots = []
}: HomeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isTopTenExpanded, setIsTopTenExpanded] = useState(false);
  const [showWeeklyPopUp, setShowWeeklyPopUp] = useState(false);
  const [audioToSave, setAudioToSave] = useState<Audio | Book | null>(null);
  const { playlists: globalPlaylists, getPlaylistItems, toggleItemInPlaylist } = useGlobalPlaylists();

  const weeklyAudio = useMemo(() => {
    const now = new Date().toISOString();
    const activeSlot = editorialSlots.find(s => s.type === 'weekly_audio' && s.startDate <= now && s.endDate >= now);
    if (activeSlot) {
      const scheduledAudio = audios.find(a => a.id === activeSlot.contentId);
      if (scheduledAudio) return scheduledAudio;
    }
    if (audios.length === 0) return null;
    return getWeeklyAudio(audios);
  }, [audios, editorialSlots]);

  // Libro del Mes (Calendario Editorial): buscamos el slot mensual activo.
  // Los "Libros del Mes" se programan sobre la colección de audios (audiolibros).
  const monthlyBook = useMemo(() => {
    const now = new Date().toISOString();
    const activeSlot = editorialSlots.find(s => s.type === 'monthly_book' && s.startDate <= now && s.endDate >= now);
    if (activeSlot) {
      const scheduledAudio = audios.find(a => a.id === activeSlot.contentId);
      if (scheduledAudio) return scheduledAudio;
    }
    return null;
  }, [audios, editorialSlots]);

  const isElegant = theme === 'elegant';

  const mentorings = useMemo(() => audios.filter(a => {
    if (a.contentType === 'mentoring') return true;
    const hints = [a.category, ...(a.tags || []), a.title].filter(Boolean).join(' ').toLowerCase();
    return hints.includes('mentor');
  }), [audios]);

  const identityLabel = user?.customAddress || (user?.gender === 'Mujer' ? 'Directora' : (user?.gender === 'Hombre' ? 'Director' : 'Líder'));
  
  const getUserLevel = (xp: number) => {
    if (xp < 60) return 'Mente en Apertura';
    if (xp < 300) return 'Arquitecta(o) de Hábitos';
    if (xp < 1000) return 'Estratega de Resultados';
    if (xp < 5000) return 'Maestría en Liderazgo';
    return 'Referente de Éxito';
  };

  const userLevel = getUserLevel(user?.xp || 0);

  const getLevelProgress = (xp: number) => {
    const thresholds = [60, 300, 1000, 5000, 20000];
    const prevThreshold = xp < thresholds[0] ? 0 : thresholds[thresholds.findIndex(t => t > xp) - 1];
    const nextThreshold = thresholds.find(t => t > xp) || thresholds[thresholds.length - 1];
    return ((xp - prevThreshold) / (nextThreshold - prevThreshold)) * 100;
  };

  const levelProgress = getLevelProgress(user?.xp || 0);

  const handleShareAudio = async (audio: Audio) => {
    const shareData = {
      title: 'INSPIRA 💎',
      text: `¡Escucha esta mentoría en INSPIRA! 💎 El contenido que transformará tu negocio. Escucha aquí:`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert('Enlace de mentoría copiado al portapapeles');
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
  };

  const globalResults = useMemo(() => {
    if (!searchQuery.trim()) return { audios: [], mentors: [], books: [], unified: [] };
    const query = searchQuery.toLowerCase();
    
    const matchedAudios = audios.filter(a => 
      a.title.toLowerCase().includes(query) || 
      a.author.toLowerCase().includes(query) ||
      a.tags?.some(t => t.toLowerCase().includes(query))
    );

    const matchedBooks = (books.length > 0 ? books : RECOMMENDED_BOOKS).filter(b => 
      b.title.toLowerCase().includes(query) || 
      b.author.toLowerCase().includes(query) ||
      (b.review && b.review.toLowerCase().includes(query))
    );

    const matchedMentors = SPEAKERS.filter(s => 
      s.name.toLowerCase().includes(query) || 
      s.role.toLowerCase().includes(query)
    );

    // Create unified content array with type flags
    const unifiedContent = [
      ...matchedAudios.map(a => ({ ...a, searchType: 'mentoria' as const })),
      ...matchedBooks.map(b => ({ ...b, searchType: 'libro' as const }))
    ].sort((a, b) => a.title.localeCompare(b.title));

    return {
      audios: matchedAudios,
      mentors: matchedMentors,
      books: matchedBooks,
      unified: unifiedContent
    };
  }, [searchQuery, audios, books]);

  const shuffledMentoringsDaily = useMemo(() => {
    const d = new Date();
    const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    
    // Seeded Random Function
    const seededRandom = (s: number) => {
      const x = Math.sin(s + 123) * 10000;
      return x - Math.floor(x);
    };

    const array = [...mentorings];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom(seed + i) * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }, [mentorings]);

  const shuffledBooksDaily = useMemo(() => {
    const sourceBooks = books && books.length > 0 ? books : [];
    if (sourceBooks.length === 0) return [];

    const d = new Date();
    const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    
    const seededRandom = (s: number) => {
      const x = Math.sin(seed + s + 999) * 10000; // Different salt for books
      return x - Math.floor(x);
    };

    const array = [...sourceBooks];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom(seed + i) * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }, [books]);

  // Weekly Pop-up Logic
  useEffect(() => {
    const lastPopUpWeek = localStorage.getItem('last_weekly_popup');
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const currentWeekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    
    if (lastPopUpWeek !== currentWeekNumber.toString()) {
      setShowWeeklyPopUp(true);
      localStorage.setItem('last_weekly_popup', currentWeekNumber.toString());
    }
  }, []);

  const featuredAudios = audios.slice(0, 3);
  
  const topTenAudios = [...audios]
    .sort((a, b) => (b.reproducciones || 0) - (a.reproducciones || 0))
    .slice(0, 10);

  const getSpeakerPhoto = (authorName: string) => {
    const speaker = SPEAKERS.find(s => s.name === authorName);
    return speaker?.photoUrl || `https://picsum.photos/seed/${authorName}/100/100`;
  };

  return (
    <div className={`flex flex-col h-full relative overflow-y-auto scrollbar-hide pb-24 transition-colors duration-500 ${
      isElegant ? 'bg-black' : 'bg-[#F2F2F7]'
    }`}>
      {/* Background Ornament */}
      <div className={`absolute top-0 inset-x-0 h-40 pointer-events-none z-0 ${
        isElegant ? 'bg-gradient-to-b from-accent/5 to-transparent' : 'bg-gradient-to-b from-blue-500/10 to-transparent'
      }`} />
      
      {/* Expiration Banner */}
      <AnimatePresence>
        {isExpiringTomorrow && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-orange-600 sticky top-0 z-[120]"
          >
            <div className="px-6 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-white animate-pulse" />
                <p className="text-white text-[11px] font-black uppercase tracking-wider">
                  ⚠️ Líder, tu acceso Premium vence mañana. Renueva hoy para no perder tus beneficios.
                </p>
              </div>
              <button 
                onClick={onOpenPremium}
                className="bg-white text-orange-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
              >
                Renovar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-0 pt-10 space-y-4">
        {/* Header Section Isolated */}
        <header className="flex flex-col gap-2">
          <HomeHeader 
            onOpenSidebar={onOpenSidebar || (() => {})}
            onOpenPremium={onOpenPremium}
            onOpenTrophies={onOpenTrophies}
            userPlan={userPlan}
            isSearching={isSearching}
            setIsSearching={setIsSearching}
            theme={theme}
            userLevel={userLevel}
            levelProgress={levelProgress}
          />

          {isSearching && (
            <div className="px-6 relative animate-in fade-in slide-in-from-top-4 duration-300 w-full mb-4">
              <div className="relative">
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Busca mentoras, títulos o temas..."
                  className={`w-full border-4 rounded-[32px] py-4 px-8 text-xl outline-none transition-all shadow-2xl ${
                    isElegant 
                      ? 'bg-bg-card border-accent/30 focus:border-accent text-text-main placeholder:text-text-dim'
                      : 'bg-white border-zinc-100 focus:border-blue-400 text-zinc-900 placeholder:text-zinc-400'
                  }`}
                />
                <Search className={`absolute right-6 top-1/2 -translate-y-1/2 ${isElegant ? 'text-accent' : 'text-blue-500'}`} size={24} />
              </div>
            </div>
          )}

          {!isSearching && user && (
            <div className="px-8 py-4 space-y-6">
              {/* Personalized Greeting & Streak */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className={`text-4xl font-black italic tracking-tighter uppercase leading-tight ${isElegant ? 'text-white' : 'text-zinc-900'}`}>
                    ¡Hola, <span className={isElegant ? 'text-accent' : 'text-blue-600'}>{identityLabel}</span>!
                  </h2>
                  <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isElegant ? 'text-white/40' : 'text-zinc-400'}`}>
                    {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
                
                {/* Streak Counter */}
                <button 
                  onClick={onOpenTrophies}
                  className={`p-3 rounded-2xl flex flex-col items-center justify-center min-w-[70px] border active:scale-95 transition-all ${
                    isElegant ? 'bg-zinc-900/60 border-accent/20' : 'bg-white border-blue-100 shadow-sm'
                  }`}
                >
                  <div className="relative">
                    <Sparkles size={20} className={isElegant ? 'text-accent' : 'text-blue-500'} />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }} 
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500"
                    />
                  </div>
                  <span className={`text-[14px] font-black italic mt-1 ${isElegant ? 'text-white' : 'text-zinc-900'}`}>
                    {user.streakCount || 0}
                  </span>
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isElegant ? 'text-accent' : 'text-blue-600'}`}>Racha</span>
                </button>
              </div>
            </div>
          )}
        </header>

        {isSearching ? (
          <div className="px-6 pb-40 space-y-12">
            {globalResults.unified.length === 0 && globalResults.mentors.length === 0 ? (
              <div className="text-center pt-20">
                <Search className={`mx-auto mb-4 opacity-20 ${isElegant ? 'text-white' : 'text-zinc-400'}`} size={48} />
                <p className={`text-sm italic ${isElegant ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  No encontramos resultados para "{searchQuery}"
                </p>
              </div>
            ) : (
              <div className="space-y-12">
                {/* Unified Content Results */}
                {globalResults.unified.length > 0 && (
                  <section className="space-y-4">
                    <h3 className={`text-[11px] font-black uppercase tracking-[0.3em] ${isElegant ? 'text-accent' : 'text-blue-600'}`}>Contenido Encontrado</h3>
                    <div className="space-y-3">
                      {globalResults.unified.map(item => {
                        const isLibro = item.searchType === 'libro';
                        const isLocked = !isLibro && userPlan === 'Gratis' && (item as Audio).isPremium;
                        
                        return (
                          <div 
                            key={`${item.searchType}-${item.id}`}
                            onClick={() => {
                              if (isLibro && onSelectBook) {
                                onSelectBook(item as Book);
                              } else {
                                onSelectAudio(item as Audio);
                              }
                            }}
                            className={`w-full p-4 rounded-3xl flex items-center gap-4 transition-all border cursor-pointer ${
                              isElegant ? 'bg-zinc-900/40 border-white/5 active:bg-zinc-800' : 'bg-white border-zinc-100 active:bg-zinc-50'
                            } ${isLocked ? 'opacity-80' : ''}`}
                          >
                            <div className={`rounded-2xl overflow-hidden flex-shrink-0 shadow-lg relative ${isLibro ? 'w-12 h-16' : 'w-12 h-12'}`}>
                              <img src={item.coverUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              {isLocked && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <LockIcon size={16} className="text-accent" fill="currentColor" />
                                </div>
                              )}
                              {isLibro && (
                                <div className="absolute top-1 right-1 bg-accent rounded-full p-0.5 shadow-md">
                                  <BookOpen size={8} className="text-black" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-left min-w-0 pr-4">
                              <div className="flex items-center gap-2">
                                <MarqueeTitle 
                                  title={item.title}
                                  className={`text-base font-black uppercase italic ${isElegant ? 'text-white' : 'text-zinc-900'}`}
                                />
                                {isLibro && (
                                  <span className="text-[8px] font-black uppercase tracking-widest bg-accent/20 text-accent px-1.5 py-0.5 rounded-full border border-accent/30">
                                    Libro
                                  </span>
                                )}
                              </div>
                              <p className={`text-[11px] font-medium uppercase tracking-widest mt-0.5 ${isElegant ? 'text-text-dim' : 'text-zinc-500'}`}>
                                {isLibro ? `Autor ${item.author}` : `Directora ${item.author}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {!isLibro && userPlan === 'Premium' && (
                                <button
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    onAddToPlaylist?.(item as Audio);
                                  }}
                                  className={`p-2 rounded-xl transition-all active:scale-95 ${
                                    isElegant ? 'bg-white/5 text-accent hover:bg-accent hover:text-black' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                                  }`}
                                  title="Añadir a mi lista"
                                >
                                  {globalPlaylists.some(p => p.tracks.some((t: any) => t.id === item.id)) ? (
                                    <Check size={16} className="text-green-500" />
                                  ) : (
                                    <Plus size={16} />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  if (isLibro) {
                                    // Handle book sharing if desired, otherwise same as audio share logic
                                    alert(`Libro compartido: ${item.title}`);
                                  } else {
                                    handleShareAudio(item as Audio); 
                                  }
                                }}
                                className={`p-2 rounded-xl transition-all active:scale-95 ${
                                  isElegant ? 'text-accent hover:bg-accent/10' : 'text-blue-600 hover:bg-blue-50'
                                }`}
                                title="Compartir Éxito"
                              >
                                <Share size={16} />
                              </button>
                              {isLibro ? (
                                <ChevronRight size={14} className={isElegant ? 'text-accent' : 'text-blue-600'} />
                              ) : isLocked ? (
                                <LockIcon size={14} className="text-accent" fill="currentColor" />
                              ) : (
                                <Play size={14} className={isElegant ? 'text-accent' : 'text-blue-600'} fill="currentColor" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Mentors Results */}
                {globalResults.mentors.length > 0 && (
                  <section className="space-y-4">
                    <h3 className={`text-[11px] font-black uppercase tracking-[0.3em] ${isElegant ? 'text-accent' : 'text-blue-600'}`}>Mentoras de Élite</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {globalResults.mentors.map(mentor => (
                        <button 
                          key={mentor.id}
                          onClick={() => onNavigate?.('fame')}
                          className={`p-4 rounded-[32px] flex flex-col items-center text-center gap-3 transition-all border ${
                            isElegant ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-zinc-100 shadow-sm'
                          }`}
                        >
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-accent/20">
                            <img src={mentor.photoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="min-w-0">
                            <h4 className={`text-[11px] font-black uppercase italic truncate ${isElegant ? 'text-white' : 'text-zinc-900'}`}>{mentor.name}</h4>
                            <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-500 truncate">{mentor.role}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="px-6 pb-32 space-y-12 pt-0">
            {/* Evento Destacado (Zoom/Repetición) */}
            {activeEvent && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative overflow-hidden rounded-[32px] border transition-all ${
                  isElegant 
                    ? 'bg-gradient-to-br from-zinc-900 to-black border-white/5 shadow-2xl' 
                    : 'bg-white border-zinc-100 shadow-xl'
                }`}
              >
                {/* Badge de Estado */}
                <div className="absolute top-4 right-4 z-10">
                  <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md border ${
                    activeEvent.status === 'live' 
                      ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                      : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${activeEvent.status === 'live' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">
                      {activeEvent.status === 'live' ? 'En Vivo' : 'Repetición'}
                    </span>
                  </div>
                </div>

                <div className="p-6 pt-10 flex flex-col gap-6">
                  <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      activeEvent.status === 'live' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'
                    }`}>
                      {activeEvent.status === 'live' ? <Video size={24} /> : <CalendarDays size={24} />}
                    </div>
                    
                    <div className="space-y-1.5">
                      <h3 className={`text-2xl font-black italic tracking-tighter uppercase leading-tight ${isElegant ? 'text-white' : 'text-zinc-900'}`}>
                        {activeEvent.title}
                      </h3>
                      <p className={`text-sm font-medium line-clamp-2 pr-10 ${isElegant ? 'text-text-dim' : 'text-zinc-500'}`}>
                        {activeEvent.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${isElegant ? 'text-accent' : 'text-zinc-400'}`}>
                        <Clock size={12} />
                        <span>{new Date(activeEvent.date).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <a 
                    href={activeEvent.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs transition-all active:scale-95 ${
                      activeEvent.status === 'live'
                        ? (isElegant ? 'bg-red-600 text-white shadow-[0_10px_30px_rgba(220,38,38,0.3)]' : 'bg-red-500 text-white shadow-lg')
                        : (isElegant ? 'bg-accent text-black shadow-[0_10px_30px_rgba(212,175,55,0.2)]' : 'bg-blue-600 text-white shadow-lg')
                    }`}
                  >
                    {activeEvent.status === 'live' ? (
                      <>
                        <Video size={18} fill="currentColor" />
                        Unirse al Zoom
                      </>
                    ) : (
                      <>
                        <Play size={18} fill="currentColor" />
                        Ver Repetición
                      </>
                    )}
                    <ExternalLink size={14} className="opacity-60 ml-2" />
                  </a>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent/5 rounded-full blur-[60px]" />
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/5 rounded-full blur-[60px]" />
              </motion.div>
            )}

            {/* Featured Access Buttons Section (Moved to top) */}
            <div className={`flex flex-col gap-2.5 relative z-10 items-center mt-[15px] ${isElegant ? 'bg-black' : 'bg-transparent'}`}>
              {/* Card 1: Recommendation (Audio) */}
              <div 
                onClick={() => weeklyAudio && onSelectAudio(weeklyAudio)}
                className={`w-[90%] h-[44px] rounded-[10px] px-4 flex items-center gap-3 border backdrop-blur-lg relative overflow-hidden active:scale-95 transition-all cursor-pointer ${
                  isElegant 
                    ? 'bg-gradient-to-r from-[#000033] to-[#4B0082] border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.6)]' 
                    : 'bg-gradient-to-r from-blue-100 to-indigo-50 border-blue-200 shadow-sm'
                } ${userPlan === 'Gratis' && weeklyAudio?.isPremium ? 'opacity-70 grayscale-[0.5]' : ''}`}
              >
                <div className="shrink-0 relative">
                  <div className={`w-7 h-7 rounded-full overflow-hidden border shadow-md ${isElegant ? 'border-white/20' : 'border-blue-300'}`}>
                    <img src={getSpeakerPhoto(weeklyAudio?.author || '')} alt={weeklyAudio?.author || 'Audio destacado'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  {userPlan === 'Gratis' && weeklyAudio?.isPremium && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                      <LockIcon size={10} className="text-accent" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden pr-8">
                  <div className="flex flex-col text-left">
                    <div className="overflow-hidden h-5">
                      <motion.div
                        animate={{ x: ["0%", "-50%"] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
                        className="inline-flex whitespace-nowrap gap-8"
                        style={{ willChange: "transform", transform: "translateZ(0)" }}
                      >
                        <span className={`text-[14px] font-medium tracking-[0.5px] uppercase italic ${isElegant ? 'text-white' : 'text-zinc-800'}`}>
                          <span className={isElegant ? 'text-[#D4AF37]' : 'text-blue-600'}>Audio:</span> {weeklyAudio?.title || 'Sin audio destacado'}
                        </span>
                        <span className={`text-[14px] font-medium tracking-[0.5px] uppercase italic ${isElegant ? 'text-white' : 'text-zinc-800'}`}>
                          <span className={isElegant ? 'text-[#D4AF37]' : 'text-blue-600'}>Audio:</span> {weeklyAudio?.title || 'Sin audio destacado'}
                        </span>
                      </motion.div>
                    </div>
                    <span className={`text-[12px] font-medium tracking-[0.5px] uppercase italic leading-none ${isElegant ? 'text-white/60' : 'text-zinc-500'}`}>Directora {weeklyAudio?.author || 'INSPIRA'}</span>
                  </div>
                </div>
                <div className="absolute right-3 flex items-center gap-2 z-20">
                  <button
                    onClick={(e) => { e.stopPropagation(); if (weeklyAudio) handleShareAudio(weeklyAudio); }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                      isElegant ? 'bg-white/5 text-accent hover:bg-accent/10' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    }`}
                    title="Compartir Éxito"
                  >
                    <Share size={12} />
                  </button>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg border ${
                    isElegant ? 'bg-white/10 backdrop-blur-sm border-white/20 text-white' : 'bg-blue-500/10 border-blue-500/20 text-blue-600'
                  }`}>
                    <Play size={10} fill="currentColor" />
                  </div>
                </div>
              </div>

              {/* Card 2: Libro del Mes (Calendario Editorial) */}
              <button 
                onClick={() => monthlyBook ? onSelectAudio(monthlyBook) : onNavigate?.('books')}
                className={`w-[90%] h-[44px] rounded-[10px] px-4 flex items-center gap-3 border backdrop-blur-lg relative overflow-hidden active:scale-95 transition-all ${
                  isElegant 
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#2B1B17] border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.6)]' 
                    : 'bg-gradient-to-r from-amber-100 to-orange-50 border-amber-200 shadow-sm'
                }`}
              >
                <div className="shrink-0">
                  <div className={`w-7 h-7 rounded-full overflow-hidden border shadow-md ${isElegant ? 'border-white/20' : 'border-amber-300'}`}>
                    <img src={monthlyBook?.coverUrl || getSpeakerPhoto(monthlyBook?.author || 'inspira')} alt="Libro del Mes" className="w-full h-full object-cover opacity-90" referrerPolicy="no-referrer" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 overflow-hidden pr-8">
                  <div className="flex flex-col text-left">
                    <div className="overflow-hidden h-5">
                      <motion.div
                        animate={{ x: ["0%", "-50%"] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
                        className="inline-flex whitespace-nowrap gap-8"
                        style={{ willChange: "transform", transform: "translateZ(0)" }}
                      >
                        <span className={`text-[14px] font-medium tracking-[0.5px] uppercase italic ${isElegant ? 'text-white' : 'text-zinc-800'}`}>
                          <span className={isElegant ? 'text-[#D4AF37]' : 'text-amber-600'}>Libro:</span> {monthlyBook?.title || 'Próximamente'}
                        </span>
                        <span className={`text-[14px] font-medium tracking-[0.5px] uppercase italic ${isElegant ? 'text-white' : 'text-zinc-800'}`}>
                          <span className={isElegant ? 'text-[#D4AF37]' : 'text-amber-600'}>Libro:</span> {monthlyBook?.title || 'Próximamente'}
                        </span>
                      </motion.div>
                    </div>
                    <span className={`text-[12px] font-medium tracking-[0.5px] uppercase italic leading-none ${isElegant ? 'text-white/60' : 'text-zinc-500'}`}>{monthlyBook?.author ? `Autor ${monthlyBook.author}` : 'Biblioteca INSPIRA'}</span>
                  </div>
                </div>
                <div className="absolute right-3 flex items-center justify-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg border ${
                    isElegant ? 'bg-white/10 backdrop-blur-sm border-white/20 text-white' : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                  }`}>
                    <BookOpen size={10} />
                  </div>
                </div>
              </button>

              {/* Card 3: TOP 10 (Static) */}
              <button 
                onClick={() => setIsTopTenExpanded(!isTopTenExpanded)}
                className={`w-[90%] h-[44px] rounded-[10px] px-4 flex items-center gap-3 border backdrop-blur-lg relative overflow-hidden active:scale-95 transition-all ${
                  isElegant 
                    ? 'bg-gradient-to-r from-[#E5E4E2] to-[#000000] border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.6)]' 
                    : 'bg-gradient-to-r from-zinc-100 to-zinc-50 border-zinc-200 shadow-sm'
                }`}
              >
                <div className="shrink-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md border ${
                    isElegant ? 'bg-black/40 border-[#00f2ff]/30 text-[#00f2ff]' : 'bg-white border-zinc-300 text-zinc-600'
                  }`}>
                    <Trophy size={11} />
                  </div>
                </div>
                <div className="flex-1 min-w-0 pr-8 text-left">
                  <div className="flex flex-col">
                    <h4 className={`text-[14px] font-medium tracking-[0.5px] uppercase italic truncate ${isElegant ? 'text-white' : 'text-zinc-800'}`}>
                      <span className={isElegant ? 'text-[#D4AF37]' : 'text-zinc-600'}>TOP 10:</span> Lo Más Sonado
                    </h4>
                    <span className={`text-[12px] font-medium tracking-[0.5px] uppercase italic leading-none ${isElegant ? 'text-white/60' : 'text-zinc-500'}`}>Ver ranking semanal</span>
                  </div>
                </div>
                <div className="absolute right-3 flex items-center justify-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg border ${
                    isElegant ? 'bg-white/10 backdrop-blur-sm border-white/20 text-white' : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-600'
                  }`}>
                    <Crown size={10} />
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {isTopTenExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden space-y-3 px-2 pt-4"
                  >
                    {topTenAudios.map((audio, index) => {
                      const isWinner = index === 0;
                      const isLocked = userPlan === 'Gratis' && audio.isPremium;
                      return (
                        <div key={audio.id} className="relative group">
                          <div
                            onClick={() => onSelectAudio(audio)}
                            className={`
                              relative w-full flex items-center gap-4 p-4 rounded-[25px] transition-all group overflow-hidden border cursor-pointer
                              ${isWinner 
                                ? 'bg-gradient-to-r from-[#D4AF37]/20 to-transparent border-[#D4AF37] border-2' 
                                : 'bg-zinc-900/40 border-white/5 hover:border-[#D4AF37]/30'}
                              ${isLocked ? 'opacity-75 grayscale-[0.3]' : ''}
                            `}
                          >
                            <div className={`flex-shrink-0 w-10 text-center text-3xl font-black italic ${isWinner ? 'text-[#D4AF37]' : 'text-zinc-800'}`}>
                              {index + 1}
                            </div>
                            <div className={`relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 ${isWinner ? 'border-[#D4AF37]' : 'border-white/10'}`}>
                              <img src={getSpeakerPhoto(audio.author)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                              {isLocked && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <LockIcon size={18} className="text-accent" fill="currentColor" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-left min-w-0 pr-4">
                              <div className="flex items-center gap-2">
                                <MarqueeTitle 
                                  title={audio.title}
                                  className={`font-black text-lg ${isWinner ? 'text-white' : 'text-zinc-300 group-hover:text-[#D4AF37]'}`}
                                />
                                {completedAudios.includes(audio.id) && <Check size={16} className="text-green-500 flex-shrink-0" strokeWidth={3} />}
                              </div>
                              <p className="text-xs font-medium uppercase tracking-widest text-zinc-500 mt-0.5 truncate">{audio.author}</p>
                              <p className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37]/60 mt-1">
                                {audio.reproducciones || 0} Reproducciones
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleShareAudio(audio); }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 z-20 ${
                                  isElegant ? 'text-[#D4AF37] hover:bg-[#D4AF37]/10' : 'text-blue-600 hover:bg-blue-50'
                                }`}
                                title="Compartir Éxito"
                              >
                                <Share size={18} />
                              </button>
                              {isLocked ? (
                                <Crown size={14} className="text-accent mr-2" />
                              ) : (
                                <Play size={14} className={isElegant ? 'text-accent' : 'text-blue-600'} fill="currentColor" />
                              )}
                            </div>
                          </div>
                          
                          {/* Add to List Button */}
                          {userPlan === 'Premium' && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all z-10">
                              <button
                                onClick={(e) => { e.stopPropagation(); onAddToPlaylist?.(audio); }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md transition-all active:scale-95 text-[11px] font-black uppercase tracking-widest ${
                                  isElegant ? 'bg-black/60 text-accent border-accent/20' : 'bg-white/80 text-blue-600 border-blue-100'
                                }`}
                              >
                                {globalPlaylists.some(p => p.tracks.some((t: any) => t.id === audio.id)) ? (
                                  <Check size={12} className="text-orange-500" />
                                ) : (
                                  <Plus size={12} />
                                )}
                                <span className="hidden sm:inline">Añadir a mi lista</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mentorías de Liderazgo (Start Talent) */}
            {mentorings.length > 0 && (
              <section className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="space-y-1">
                    <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] ${isElegant ? 'text-accent' : 'text-blue-600'}`}>
                      <Radio size={12} className="animate-pulse" />
                      <span>Start Talent</span>
                    </div>
                    <h2 className={`text-4xl font-black italic tracking-tighter uppercase leading-none ${isElegant ? 'text-white' : 'text-zinc-900'}`}>
                      Mentorías de <br /> Liderazgo
                    </h2>
                  </div>
                </div>

                <div className="space-y-4">
                  <MarqueeRow 
                    items={shuffledMentoringsDaily} 
                    type="audio" 
                    userPlan={userPlan}
                    onOpenPremium={onOpenPremium}
                    onSelectAudio={onSelectAudio}
                    onSelectBook={onSelectBook}
                    onNavigate={onNavigate}
                    theme={theme}
                  />
                </div>
              </section>
            )}

            {/* Literatura de Apoyo (Libros) */}
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1">
                  <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] ${isElegant ? 'text-[#D4AF37]' : 'text-amber-600'}`}>
                    <BookOpen size={12} />
                    <span>Mindset VIP</span>
                  </div>
                  <h2 className={`text-4xl font-black italic tracking-tighter uppercase leading-none ${isElegant ? 'text-white' : 'text-zinc-900'}`}>
                    Literatura de <br /> Diamante
                  </h2>
                </div>
              </div>

              <div className="space-y-4">
                {shuffledBooksDaily && shuffledBooksDaily.length > 0 ? (
                  <MarqueeRow 
                    items={shuffledBooksDaily} 
                    type="book" 
                    userPlan={userPlan}
                    onOpenPremium={onOpenPremium}
                    onSelectAudio={onSelectAudio}
                    onSelectBook={onSelectBook}
                    onNavigate={onNavigate}
                    theme={theme}
                  />
                ) : (
                  <p className={`text-[11px] font-black uppercase tracking-widest italic text-center py-8 opacity-40 ${isElegant ? 'text-white' : 'text-zinc-600'}`}>
                    Próximamente nuevos títulos...
                  </p>
                )}
              </div>
            </section>

            {/* Explorar Catálogo Section (Only for Premium or show limited for Free) */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <LayoutGrid className={isElegant ? 'text-accent' : 'text-indigo-500'} size={20} />
                <h3 className={`text-lg font-black italic tracking-tighter uppercase ${isElegant ? 'text-white' : 'text-zinc-900'}`}>Explorar Catálogo</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {['Ventas', 'Mentalidad', 'Prospectación', 'Liderazgo'].map((category) => (
                  <button 
                    key={category} 
                    onClick={() => { setSearchQuery(category); setIsSearching(true); }} 
                    className={`h-24 rounded-[24px] flex items-center justify-center gap-2 group transition-all overflow-hidden relative border ${
                      isElegant 
                        ? 'bg-bg-card border-white/5 hover:border-accent/30' 
                        : 'bg-white border-zinc-200 shadow-sm hover:border-indigo-300'
                    }`}
                  >
                    <div className={`absolute inset-0 transition-opacity ${isElegant ? 'bg-accent/5 opacity-0 group-hover:opacity-100' : 'bg-indigo-50/50 opacity-0 group-hover:opacity-100'}`} />
                    <Radio size={14} className={`transition-colors ${
                      isElegant ? 'text-accent/40 group-hover:text-accent' : 'text-indigo-300 group-hover:text-indigo-600'
                    }`} />
                    <span className={`text-xs font-black uppercase tracking-widest italic ${isElegant ? 'text-white' : 'text-zinc-800'}`}>{category}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Mis Listas (User Playlists) Section - PAYWALL Implementation */}
            {userPlan === 'Premium' ? (
              <section className="space-y-6 pb-4">
                <div className="flex items-center gap-3 px-2">
                  <DiamondListIcon size={20} />
                  <h3 className={`text-lg font-black italic tracking-tighter uppercase ${isElegant ? 'text-white' : 'text-zinc-900'}`}>Mis Listas</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Create New List Button */}
                  <button
                    onClick={() => onNavigate?.('library')}
                    className={`flex items-center gap-3 p-3 rounded-[24px] border-2 border-dashed transition-all active:scale-95 group ${
                      isElegant 
                        ? 'bg-accent/5 border-accent/20 text-accent hover:bg-accent/10 focus:ring-2 focus:ring-accent/20' 
                        : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${
                      isElegant ? 'bg-accent text-black shadow-lg shadow-accent/20' : 'bg-blue-600 text-white'
                    }`}>
                      <Plus size={20} strokeWidth={3} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.1em] text-left leading-tight opacity-80 group-hover:opacity-100">Crear Lista</span>
                  </button>

                  {/* User Playlists */}
                  {Array.isArray(globalPlaylists) && globalPlaylists.map((p) => {
                    if (!p || !p.id) return null;
                    const items = Array.isArray(p.tracks) ? p.tracks : [];
                    const playlistId = p.id;
                    const playlistName = p.name || 'Lista sin nombre';
                    return (
                      <button 
                        key={playlistId} 
                        onClick={() => {
                          if (typeof onNavigate === 'function') {
                            onNavigate('library');
                          } else {
                            console.error('Naya Error: Componente Home no recibió función de navegación');
                          }
                        }}
                        className={`flex items-center gap-3 p-3 rounded-[24px] border transition-all active:scale-95 group relative overflow-hidden ${
                          isElegant 
                            ? 'bg-bg-card border-white/5 hover:border-accent/40 shadow-xl' 
                            : 'bg-white border-zinc-100 shadow-sm hover:border-blue-300'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6 duration-500 overflow-hidden ${
                          isElegant ? 'bg-accent/10 text-accent' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {items.length > 0 ? (
                             <img 
                               src={items[0].coverUrl} 
                               alt={playlistName} 
                               className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                               referrerPolicy="no-referrer"
                             />
                          ) : (
                            <DiamondListIcon size={18} />
                          )}
                        </div>
                        
                        <div className="flex-1 text-left relative z-10 truncate">
                          <h4 className={`text-[11px] font-black uppercase tracking-tight leading-tight truncate ${isElegant ? 'text-white group-hover:text-accent' : 'text-zinc-900 group-hover:text-blue-600'}`}>
                            {playlistName}
                          </h4>
                        </div>

                        {/* Decorative Background Element */}
                        <div className={`absolute -right-2 -bottom-2 w-8 h-8 rounded-full transition-transform group-hover:scale-150 duration-700 opacity-5 ${
                          isElegant ? 'bg-accent' : 'bg-blue-600'
                        }`} />
                      </button>
                    );
                  })}

                  {globalPlaylists.length === 0 && (
                    <div className={`col-span-2 py-8 flex items-center justify-center rounded-[24px] border border-dashed border-white/10 ${isElegant ? 'bg-zinc-900/20' : 'bg-zinc-50'}`}>
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-dim italic opacity-40">Tus listas aparecerán aquí</p>
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <section className="space-y-6 pb-4">
                <div 
                  onClick={onOpenPremium}
                  className={`p-6 rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center text-center gap-4 cursor-pointer hover:border-accent/40 group transition-all ${
                    isElegant ? 'bg-bg-card border-white/5' : 'bg-white border-zinc-100 shadow-sm'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-accent/10 text-accent group-hover:scale-110 transition-transform`}>
                    <LockIcon size={32} />
                  </div>
                  <div className="space-y-1">
                    <h3 className={`text-xl font-black italic tracking-tighter uppercase ${isElegant ? 'text-white' : 'text-zinc-900'}`}>
                      🔒 Función Premium
                    </h3>
                    <p className={`text-[11px] font-bold uppercase tracking-widest ${isElegant ? 'text-text-dim' : 'text-zinc-500'}`}>
                      Desbloquea la versión Premium para crear <br /> y organizar tus propias listas.
                    </p>
                  </div>
                  <div className={`mt-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent`}>
                    <span>Saber más</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showWeeklyPopUp && weeklyAudio && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`fixed inset-0 z-[200] flex items-center justify-center px-6 backdrop-blur-md ${isElegant ? 'bg-black/80' : 'bg-white/60'}`}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className={`rounded-[48px] overflow-hidden max-w-md w-full border-2 ${
              isElegant 
                ? 'bg-bg-deep border-accent/30 shadow-[0_0_100px_rgba(255,140,0,0.2)]' 
                : 'bg-white border-zinc-100 shadow-2xl shadow-blue-500/10'
            }`}>
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img src={weeklyAudio.coverUrl} alt={weeklyAudio?.title || 'Sin audio destacado'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className={`absolute inset-0 bg-gradient-to-t via-transparent to-transparent ${isElegant ? 'from-bg-deep' : 'from-white'}`}></div>
                <div className={`absolute top-8 left-8 backdrop-blur-md px-4 py-2 rounded-full border ${isElegant ? 'bg-black/40 border-white/10' : 'bg-white/60 border-zinc-200'}`}>
                   <div className="flex items-center gap-2">
                    <Sparkles className={isElegant ? 'text-accent' : 'text-blue-500'} size={16} />
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isElegant ? 'text-white' : 'text-zinc-800'}`}>Enfoque Semanal</span>
                   </div>
                </div>
              </div>
              <div className="p-10 space-y-8 text-center -mt-12 relative z-10">
                <div className="space-y-4">
                  <h3 className={`text-3xl font-black leading-tight italic tracking-tighter ${isElegant ? 'text-white' : 'text-zinc-900'}`}>Tu Enfoque para esta Semana 🎧</h3>
                  <div className="space-y-1">
                    <p className={`text-sm font-bold uppercase tracking-widest italic ${isElegant ? 'text-text-dim' : 'text-zinc-400'}`}>{weeklyAudio?.author || 'INSPIRA'}</p>
                    <h4 className={`text-2xl font-black ${isElegant ? 'text-accent' : 'text-blue-600'}`}>{weeklyAudio?.title || 'Sin audio destacado'}</h4>
                  </div>
                </div>
                <div className="space-y-4">
                  <button onClick={() => { setShowWeeklyPopUp(false); if (weeklyAudio) onSelectAudio(weeklyAudio); }} className={`w-full py-6 rounded-3xl text-xl font-black hover:scale-105 active:scale-95 transition-all shadow-xl ${
                    isElegant ? 'bg-accent text-black shadow-accent/20' : 'bg-blue-600 text-white shadow-blue-600/20'
                  }`}>Escuchar Ahora</button>
                  <button onClick={() => setShowWeeklyPopUp(false)} className={`text-[10px] font-black uppercase tracking-widest hover:brightness-125 transition-all ${isElegant ? 'text-text-dim hover:text-white' : 'text-zinc-400 hover:text-zinc-900'}`}>Cerrar aviso</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Overlay de Guardado Nativo */}
      {audioToSave && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex flex-col justify-end animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setAudioToSave(null)} />
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="w-full bg-[#111] p-6 rounded-t-[40px] max-h-[80vh] overflow-y-auto relative z-10 border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]"
          >
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />
            <h3 className="text-white text-2xl font-black italic tracking-tighter uppercase text-center mb-8">Guardar en...</h3>
            
            <div className="space-y-4 mb-8">
              {globalPlaylists.length > 0 ? (
                globalPlaylists.map((playlist) => (
                  <button 
                    key={playlist.id}
                    onClick={() => {
                      toggleItemInPlaylist(playlist.id, audioToSave);
                      setAudioToSave(null);
                    }}
                    className="w-full p-6 bg-[#1A1A1A] hover:bg-[#222] active:scale-[0.98] transition-all text-white rounded-[24px] border border-white/5 flex justify-between items-center group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-black transition-all">
                        <ListMusic size={24} />
                      </div>
                      <span className="text-lg font-black italic uppercase tracking-tighter">{playlist.name}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-accent/30 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-black transition-all">
                      <Plus size={20} strokeWidth={3} />
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-12 text-center bg-white/5 rounded-[32px] border-2 border-dashed border-white/10 space-y-4">
                  <Music size={40} className="mx-auto text-zinc-600 opacity-20" />
                  <p className="text-zinc-500 font-bold italic">No tienes listas creadas.</p>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setAudioToSave(null)} 
              className="w-full py-5 text-zinc-500 hover:text-white font-black uppercase tracking-widest text-[11px] transition-colors"
            >
              CANCELAR
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
