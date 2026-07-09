/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, ChevronDown, Crown, Heart, Gift, 
  MessageCircle, ListMusic, ChevronUp, Sparkles, Plus, Timer, Download, 
  Gauge, Trash2, ArrowUp, ArrowDown, Check, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Audio, UserPlan, Playlist } from '../types';
import { playlistService } from '../services/dbService';
import { auth } from '../services/firebase';
import { useGlobalPlaylists } from '../hooks/useGlobalPlaylists';
import MarqueeTitle from './MarqueeTitle';
import DiamondListIcon from './DiamondListIcon';

interface AudioPlayerProps {
  audio: Audio | null;
  onClose: () => void;
  userPlan: UserPlan;
  onValidListen: (audioId: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (audioId: string) => void;
  activePassAudioId?: string | null;
  onPassUsed?: () => void;
  userPassesUsed?: number;
  theme?: 'elegant' | 'clarity';
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentTime: number;
  duration: number;
  onGiveGift: () => void;
  isLoading?: boolean;
  playbackSpeed?: number;
  onToggleSpeed?: () => void;
  queue?: Audio[];
  onRemoveFromQueue?: (id: string) => void;
  onMoveInQueue?: (id: string, dir: 'up' | 'down') => void;
  onNext?: () => void;
  onPrevious?: () => void;
  playlists: Playlist[];
  onNavigateToPlaylist?: (id: string) => void;
  onOpenPremium?: () => void;
  onSeek?: (time: number) => void;
}

export default function AudioPlayer({ 
  audio, onClose, userPlan, onValidListen, isFavorite, onToggleFavorite, 
  activePassAudioId, onPassUsed, userPassesUsed = 0, theme = 'elegant',
  isPlaying, setIsPlaying, currentTime, duration, onGiveGift, isLoading,
  playbackSpeed = 1, onToggleSpeed, queue = [], onRemoveFromQueue, onMoveInQueue,
  onNext, onPrevious, playlists: initialPlaylists, onNavigateToPlaylist, onOpenPremium,
  onSeek
}: AudioPlayerProps) {
  const [showQueue, setShowQueue] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const { playlists: globalPlaylists, addPlaylist, toggleItemInPlaylist, getPlaylistItems } = useGlobalPlaylists();
  const [addedToListIds, setAddedToListIds] = useState<string[]>([]);
  // Los regalos se gestionan en el backend (Firestore) a través del prop onGiveGift.
  // Calculamos los regalos restantes a partir de userPassesUsed (límite diario: 20).
  const regalosRestantes = Math.max(0, 20 - userPassesUsed);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showGiftMessage, setShowGiftMessage] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [timerLeft, setTimerLeft] = useState<number | null>(null);
  const isElegant = theme === 'elegant';

  useEffect(() => {
    if (!audio) return;
    // Update addedToListIds based on global playlists items
    const listIds = globalPlaylists
      .filter(p => p.tracks.some(track => track.id === audio.id))
      .map(p => p.id);
    setAddedToListIds(listIds);
  }, [globalPlaylists, audio, showPlaylistMenu]);

  const handleShareGift = () => {
    if (regalosRestantes <= 0) {
      alert("No te quedan regalos disponibles por hoy");
      return;
    }
    // Delegamos toda la lógica de compartir + descuento en el backend (Firestore)
    // al componente padre, que persiste el contador diario de regalos.
    onGiveGift();
  };

  const handleCreatePlaylist = async () => {
    if (newPlaylistName.trim()) {
      addPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setIsCreating(false);
    }
  };

  const handleTogglePlaylist = async (playlistId: string) => {
    if (!audio) return;
    toggleItemInPlaylist(playlistId, audio);
    
    // Optimistic UI update for the current view
    setAddedToListIds(prev => 
      prev.includes(playlistId) 
        ? prev.filter(id => id !== playlistId)
        : [...prev, playlistId]
    );
  };

  const isCourtesyPass = audio?.id === activePassAudioId;
  const isRestricted = userPlan === 'Gratis' && !isCourtesyPass;
  const isPreviewMode = isRestricted && !!audio?.previewUrl;
  const maxTime = isRestricted && !audio?.previewUrl ? 180 : duration;
  const isFreeMode = userPlan === 'Gratis' && !isCourtesyPass;

  const handleDownload = () => {
    setIsDownloading(true);
    setTimeout(() => setIsDownloading(false), 2000); // Simulamos descarga
  };

  const handleSetTimer = () => {
    if (timerLeft) setTimerLeft(null);
    else setTimerLeft(30); // 30 min por defecto
  };

  useEffect(() => {
    if (audio && isCourtesyPass && currentTime >= duration * 0.99) {
      setShowGiftMessage(true);
    }
  }, [currentTime, duration, isCourtesyPass]);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!audio) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed inset-0 z-[500] flex flex-col px-8 pt-10 pb-[84px] transition-colors duration-500 shadow-2xl overflow-hidden ${
          isElegant ? 'bg-zinc-950 text-white' : 'bg-[#F2F2F7] text-zinc-900'
        }`}
      >
        <button
          onClick={onClose}
          className={`absolute top-8 left-8 transition-colors p-4 z-20 ${
            isElegant ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'
          }`}
          title="Minimizar"
        >
          <ChevronDown size={36} />
        </button>

        <div className="absolute top-8 right-8 flex items-center gap-4">
          <button
            onClick={handleShareGift}
            disabled={regalosRestantes <= 0}
            className={`transition-all p-3 z-30 flex flex-col items-center gap-1 ${
              regalosRestantes <= 0
                ? 'opacity-30 grayscale cursor-not-allowed'
                : (isElegant ? 'text-accent hover:scale-110' : 'text-blue-600 hover:scale-110')
            }`}
            title={regalosRestantes <= 0 ? "No te quedan regalos disponibles por hoy" : `Regalar Pase (${regalosRestantes} disponibles)`}
          >
            <Gift size={32} />
            <span className="text-[8px] font-black uppercase tracking-widest">{regalosRestantes <= 0 ? 'Agotados' : `${regalosRestantes} Regalos`}</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-4 mt-8">
          {/* Badge Demo Minimalista */}
          {isRestricted && !isLoading && (
            <div className={`py-1 px-4 rounded-full border flex items-center gap-2 transition-all ${
              isElegant 
                ? 'bg-accent/10 border-accent/30 text-accent' 
                : 'bg-blue-50 border-blue-100 text-blue-600'
            }`}>
              <Crown size={12} fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                {isPreviewMode ? 'Clip de Avance' : 'Demo Gratis (3 min)'}
              </span>
            </div>
          )}

          {/* Cover Art with Visualizer (Reduced 25% to Gain Space) */}
          <div className="relative group">
            <motion.div
              animate={isPlaying ? { 
                scale: [1, 1.05, 1],
              } : { 
                scale: 1 
              }}
              transition={isPlaying ? { 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
              } : { 
                duration: 0.5 
              }}
              className={`relative w-40 h-40 rounded-full overflow-hidden border-8 shadow-2xl transition-all z-10 ${
                isElegant ? 'border-accent/20 shadow-accent/10' : 'border-blue-500/10 shadow-blue-500/5'
              }`}
            >
              <img
                src={audio.coverUrl}
                alt={audio.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            
            {/* Sutil Ecualizador de Aura */}
            {isPlaying && (
              <div className="absolute inset-0 -m-4 flex items-center justify-center pointer-events-none">
                {[...Array(24)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`absolute w-0.5 h-40 rounded-full ${isElegant ? 'bg-accent/30' : 'bg-blue-400/30'}`}
                    style={{ rotate: `${(360 / 24) * i}deg` }}
                    animate={{ 
                      scaleY: [1, 1.1 + Math.random() * 0.4, 0.9, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3] 
                    }}
                    transition={{ 
                      duration: 1 + Math.random(), 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info with PRO Plus */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-3">
              <button 
                onClick={() => onToggleFavorite(audio.id)}
                className={`transition-colors p-2 ${
                  isElegant ? 'text-zinc-500 hover:text-accent' : 'text-zinc-400 hover:text-blue-600'
                }`}
              >
                <Heart 
                  size={24} 
                  fill={isFavorite ? "currentColor" : "none"} 
                  className={isFavorite ? (isElegant ? "text-accent" : "text-blue-600") : ""} 
                />
              </button>
              
              <MarqueeTitle 
                as="h2"
                title={audio.title}
                className={`text-base font-black tracking-tight leading-tight transition-colors ${
                  isElegant ? 'text-white' : 'text-zinc-900'
                }`}
                containerClassName="max-w-[60vw]"
                duration={15}
              />
              
              <button 
                onClick={() => userPlan === 'Gratis' ? onOpenPremium?.() : setShowPlaylistMenu(true)}
                className={`${isElegant ? 'text-accent' : 'text-blue-600'} hover:scale-110 active:scale-95 transition-all relative flex-shrink-0`}
              >
                {userPlan === 'Gratis' && <Lock size={10} className="absolute -top-1 -right-1 text-accent" />}
                <Plus size={24} strokeWidth={3} />
              </button>
            </div>
            <p className={`text-lg font-bold transition-colors ${
              isElegant ? 'text-accent' : 'text-blue-600'
            }`}>{audio.author}</p>
            
            {/* PRO Tools Toolbar */}
            <div className="flex items-center justify-center gap-8 mt-1">
              <button 
                onClick={onToggleSpeed}
                className={`flex flex-col items-center gap-1 transition-all hover:scale-110 ${isElegant ? 'text-zinc-500 hover:text-accent' : 'text-zinc-400 hover:text-blue-600'}`}
              >
                <div className="relative">
                  <Gauge size={18} />
                </div>
                <span className="text-[8px] font-black">{playbackSpeed}x</span>
              </button>
              <button 
                onClick={handleSetTimer}
                className={`flex flex-col items-center gap-1 transition-all hover:scale-110 ${timerLeft ? (isElegant ? 'text-accent' : 'text-blue-600') : (isElegant ? 'text-zinc-500 hover:text-accent' : 'text-zinc-400 hover:text-blue-600')}`}
              >
                <div className="relative">
                  <Timer size={18} />
                </div>
                <span className="text-[8px] font-black">{timerLeft ? `${timerLeft}m` : 'Off'}</span>
              </button>
              <button 
                onClick={handleDownload}
                className={`flex flex-col items-center gap-1 transition-all hover:scale-110 ${isDownloading ? 'animate-bounce' : ''} ${isElegant ? 'text-zinc-500 hover:text-accent' : 'text-zinc-400 hover:text-blue-600'}`}
              >
                <div className="relative">
                  <Download size={18} />
                </div>
                <span className="text-[8px] font-black uppercase tracking-tighter">{isDownloading ? '...' : 'Offline'}</span>
              </button>
            </div>
            
            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-accent mt-2 animate-pulse">
                <Sparkles size={14} fill="currentColor" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Cargando mentoría...</span>
              </div>
            )}
          </div>
          {/* 1. Progress Bar Area (Elevated with significant air) */}
          {!showGiftMessage && !(isRestricted && currentTime >= 180) && !isFreeMode && (
            <div className="w-full max-w-sm px-8 mt-2 mb-0 relative group/progress"> 
              <input
                type="range"
                min={0}
                max={maxTime}
                step={1}
                value={currentTime}
                onChange={(e) => onSeek?.(Number(e.target.value))}
                className="absolute inset-x-8 top-0 h-1.5 w-[calc(100%-64px)] opacity-0 cursor-pointer z-30"
              />
              <div className={`h-1.5 w-full rounded-full transition-colors relative ${
                isElegant ? 'bg-zinc-800' : 'bg-zinc-200'
              }`}>
                <motion.div
                  className={`absolute left-0 top-0 h-full rounded-full transition-colors ${isElegant ? 'bg-accent' : 'bg-blue-600'}`}
                  style={{ width: `${(currentTime / maxTime) * 100}%` }}
                />
                {/* Visual Thumb */}
                <motion.div 
                   className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-lg border-2 z-10 ${
                     isElegant ? 'bg-white border-accent' : 'bg-white border-blue-600'
                   }`}
                   style={{ left: `calc(${(currentTime / maxTime) * 100}% - 8px)` }}
                />
              </div>
              <div className={`flex justify-between text-[9px] font-black uppercase tracking-widest mt-2 ${
                isElegant ? 'text-zinc-500' : 'text-zinc-400'
              }`}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(maxTime)}</span>
              </div>
            </div>
          )}

          {/* Controls Area (Shifted Down with more air) */}
          <div className="w-full max-w-sm space-y-2 px-4 pb-4 select-none mt-auto relative flex flex-col">
          {/* Barra de Controles Maestra (Skip Back, Play/Pause, Skip Next) */}
          {!showGiftMessage && (
            <div className="flex items-center justify-center gap-10 pt-0 pb-2 relative z-[10]">
              <button 
                onClick={onPrevious}
                className={`transition-all active:scale-95 ${
                  isElegant ? 'text-white hover:text-accent' : 'text-zinc-400 hover:text-blue-600'
                }`}
              >
                <SkipBack size={24} fill="currentColor" />
              </button>
              
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`transition-all hover:scale-110 active:scale-90 ${
                  isElegant ? 'text-accent' : 'text-blue-600'
                }`}
              >
                {isPlaying 
                  ? <Pause size={38} fill="currentColor" /> 
                  : <Play size={38} fill="currentColor" className="ml-1" />
                }
              </button>
              
              <button 
                onClick={onNext}
                className={`transition-all active:scale-95 ${
                  isElegant ? 'text-white hover:text-accent' : 'text-zinc-400 hover:text-blue-600'
                }`}
              >
                <SkipForward size={24} fill="currentColor" />
              </button>
            </div>
          )}

            {/* Fila de Mentorías Deslizable (Upward Panel) */}
            <div className="relative h-8">
              <motion.div
                initial={false}
                animate={{ 
                  height: showQueue ? '360px' : '32px'
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`absolute bottom-0 left-0 right-0 rounded-t-[32px] border-t border-x overflow-hidden backdrop-blur-3xl transition-all duration-500 ${
                  showQueue ? 'z-[200]' : 'z-[100]'
                } ${
                  isElegant 
                    ? (showQueue ? 'bg-zinc-950 border-white/10' : 'bg-gradient-to-t from-black via-zinc-900/95 to-transparent border-white/10')
                    : (showQueue ? 'bg-white border-zinc-200 shadow-2xl' : 'bg-gradient-to-t from-white via-white/95 to-transparent border-zinc-200 shadow-2xl')
                }`}
              >
                {/* Header / Tab */}
                <button 
                  onClick={() => setShowQueue(!showQueue)}
                  className="w-full py-2 px-6 flex items-center justify-between group active:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1 rounded-lg ${isElegant ? 'bg-accent/10' : 'bg-blue-50'}`}>
                      <DiamondListIcon size={14} />
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isElegant ? 'text-white' : 'text-zinc-900'}`}>
                      {showQueue ? 'Cerrar Fila' : 'Fila de Reproducción'}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: showQueue ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronUp className={isElegant ? 'text-zinc-500' : 'text-zinc-400'} size={14} />
                  </motion.div>
                </button>

                {/* Queue List Content */}
                <div className="px-4 pb-8 h-[300px] overflow-y-auto custom-scrollbar">
                  <div className="space-y-1 mt-2">
                    {queue.map((a, i) => (
                      <motion.div 
                        key={a.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={`p-2.5 px-3 rounded-2xl flex items-center gap-3 transition-all ${
                          a.id === audio.id ? 'bg-accent/10 border border-accent/20' : 'hover:bg-white/5 border border-transparent'
                        } ${userPlan === 'Gratis' ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'}`}
                      >
                        <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-white/5">
                          <img src={a.coverUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                          {audio && a.id === audio.id ? (
                            <>
                              <MarqueeTitle 
                                as="h5"
                                title={a.title}
                                className="text-[13px] font-bold tracking-tight text-accent"
                                duration={12}
                                containerClassName="w-full"
                              />
                              <MarqueeTitle 
                                as="p"
                                title={a.author}
                                className={`text-[11px] font-medium ${isElegant ? 'text-zinc-500' : 'text-zinc-400'}`}
                                duration={15}
                                containerClassName="w-full"
                              />
                            </>
                          ) : (
                            <>
                              <h5 className={`text-[13px] font-bold tracking-tight truncate leading-tight ${
                                isElegant ? 'text-white' : 'text-zinc-900'
                              }`}>
                                {a.title}
                              </h5>
                              <p className={`text-[11px] font-medium truncate ${
                                isElegant ? 'text-zinc-500' : 'text-zinc-400'
                              }`}>
                                {a.author}
                              </p>
                            </>
                          )}
                        </div>
                        
                        {a.id === audio.id ? (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 border border-accent/30">
                            <div className="w-1 h-1 rounded-full bg-accent animate-pulse" />
                            <span className="text-[6px] font-black text-accent uppercase">Ahora</span>
                          </div>
                        ) : userPlan === 'Premium' ? (
                          <div className="flex items-center gap-1 transition-opacity">
                            <button 
                              onClick={(e) => { e.stopPropagation(); onMoveInQueue?.(a.id, 'up'); }}
                              disabled={i === 0}
                              className={`p-1.5 rounded-lg transition-colors ${i === 0 ? 'opacity-20' : 'hover:bg-white/10 text-zinc-500 hover:text-white'}`}
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); onMoveInQueue?.(a.id, 'down'); }}
                              disabled={i === queue.length - 1}
                              className={`p-1.5 rounded-lg transition-colors ${i === queue.length - 1 ? 'opacity-20' : 'hover:bg-white/10 text-zinc-500 hover:text-white'}`}
                            >
                              <ArrowDown size={12} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); onRemoveFromQueue?.(a.id); }}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ) : (
                          <Crown size={10} className="text-zinc-600/50" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {showGiftMessage && (
              <div className={`border p-8 rounded-[32px] space-y-6 text-center animate-in zoom-in-95 transition-all ${
                isElegant ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-100 shadow-xl'
              }`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-colors ${
                  isElegant ? 'bg-accent/20 text-accent' : 'bg-blue-100 text-blue-600'
                }`}>
                  <MessageCircle size={32} />
                </div>
                <div className="space-y-2">
                  <h4 className={`font-black text-xl leading-tight ${isElegant ? 'text-white' : 'text-zinc-900'}`}>¿Te inspiró este legado?</h4>
                  <p className={`text-sm italic ${isElegant ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {audio.author} te lo compartió. No te pierdas su siguiente clase, únete a Premium.
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all ${
                    isElegant ? 'bg-accent text-black' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  }`}
                >
                  Unirse a Premium
                </button>
              </div>
            )}

            {isRestricted && currentTime >= 180 && (
              <div className={`border-2 p-8 rounded-[32px] space-y-6 animate-in zoom-in-95 shadow-2xl transition-all ${
                isElegant ? 'bg-zinc-900 border-accent shadow-accent/10' : 'bg-white border-blue-300 shadow-blue-500/10'
              }`}>
                <div className="text-center space-y-4">
                  <p className={`text-xl font-bold leading-tight ${isElegant ? 'text-white' : 'text-zinc-900'}`}>
                    🔒 Estás en Plan Gratuito.
                  </p>
                  <p className={`text-sm font-black uppercase tracking-[0.2em] ${isElegant ? 'text-accent' : 'text-blue-600'}`}>
                    Hazte Premium para escuchar la mentoría completa.
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className={`w-full py-4 rounded-xl font-black uppercase tracking-widest shadow-lg transition-all ${
                    isElegant ? 'bg-accent text-black shadow-accent/20' : 'bg-blue-600 text-white shadow-blue-500/20'
                  }`}
                >
                  Ver Planes Premium
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Playlist Selection Bottom Sheet (Visual Only) */}
        <AnimatePresence>
          {showPlaylistMenu && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPlaylistMenu(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[250]"
              />
              
              {/* Sheet */}
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="absolute inset-x-0 bottom-0 z-[260] bg-[#121212] rounded-t-[40px] px-8 pt-8 pb-32 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] border-t border-white/5"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-white text-xl font-black italic uppercase tracking-tighter">Guardar en...</h3>
                  {!isCreating ? (
                    <button 
                      onClick={() => setIsCreating(true)}
                      className="text-[#4ADE80] text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
                    >
                      Nueva playlist
                    </button>
                  ) : (
                    <button 
                      onClick={() => setIsCreating(false)}
                      className="text-zinc-500 text-xs font-black uppercase tracking-widest hover:text-white transition-all"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {isCreating && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="w-full p-1 rounded-2xl bg-accent/10 border border-accent/30 flex items-center gap-2 pr-4 transition-all"
                    >
                      <input 
                        autoFocus
                        type="text"
                        placeholder="Nombre de la lista..."
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                        className="flex-1 bg-transparent border-none outline-none text-white font-bold px-4 py-4 placeholder:text-zinc-600"
                      />
                      <button 
                        onClick={handleCreatePlaylist}
                        className="bg-accent text-black p-2 rounded-xl hover:scale-105 active:scale-95 transition-all"
                      >
                        <Plus size={20} strokeWidth={3} />
                      </button>
                    </motion.div>
                  )}

                  {globalPlaylists.map((p) => {
                    const isAdded = addedToListIds.includes(p.id);
                    return (
                      <button 
                        key={p.id}
                        onClick={() => handleTogglePlaylist(p.id)}
                        className={`w-full group flex items-center justify-between p-5 rounded-2xl border transition-all active:scale-[0.98] ${
                          isAdded 
                            ? (isElegant ? 'bg-accent/10 border-accent/30' : 'bg-blue-50 border-blue-200') 
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <span className={`font-bold text-base tracking-tight transition-colors ${
                          isAdded ? (isElegant ? 'text-accent' : 'text-blue-600') : 'text-white'
                        }`}>{p.name}</span>
                        {isAdded ? (
                          <Check size={20} className={isElegant ? 'text-accent' : 'text-blue-600'} />
                        ) : (
                          <Plus size={20} className="text-zinc-500 group-hover:text-white transition-colors" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <button 
                  onClick={() => setShowPlaylistMenu(false)}
                  className="w-full mt-8 py-3 text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white transition-colors"
                >
                  Cerrar
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
