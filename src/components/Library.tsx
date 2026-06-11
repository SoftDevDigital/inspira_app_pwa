/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ListMusic, Plus, Play, Trash2, Edit2, ChevronRight, Crown, Music, X, Check, Search, Lock, Share, BookOpen } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import DiamondListIcon from './DiamondListIcon';
import { Playlist, Audio, UserPlan, User, Book } from '../types';
import { MOCK_AUDIOS, RECOMMENDED_BOOKS, getAudio, getBook } from '../constants';
import MarqueeTitle from './MarqueeTitle';
import { useGlobalPlaylists } from '../hooks/useGlobalPlaylists';

interface LibraryProps {
  audios?: Audio[];
  user: User | null;
  userPlan: UserPlan;
  onSelectAudio: (audio: Audio) => void;
  completedAudios: string[];
  onOpenPremium: () => void;
  onDeletePlaylist: (id: string) => void;
  onRemoveFromPlaylist: (playlistId: string, itemId: string, type: 'audio' | 'book') => void;
  onRenamePlaylist: (id: string, newName: string) => void;
  onCreatePlaylist: (name: string) => void;
  onAddToPlaylist?: (item: Audio | Book) => void;
  initialSelectedPlaylistId?: string | null;
}

export default function Library({ 
  audios = MOCK_AUDIOS, user, userPlan, onSelectAudio, completedAudios, onOpenPremium, onDeletePlaylist, onRemoveFromPlaylist, onRenamePlaylist, onCreatePlaylist, onAddToPlaylist, initialSelectedPlaylistId
}: LibraryProps) {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(initialSelectedPlaylistId || null);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [activeLibraryTab, setActiveLibraryTab] = useState<'categories' | 'my-lists'>('my-lists');
  const [searchQuery, setSearchQuery] = useState('');
  const [audioToSave, setAudioToSave] = useState<Audio | Book | null>(null);
  const { playlists: globalPlaylists, addPlaylist, removePlaylist, renamePlaylist, getPlaylistItems, toggleItemInPlaylist } = useGlobalPlaylists();

  useEffect(() => {
    if (initialSelectedPlaylistId) {
      setSelectedPlaylistId(initialSelectedPlaylistId);
      setActiveLibraryTab('my-lists');
    }
  }, [initialSelectedPlaylistId]);

  // Map global lists for compatibility with existing UI
  const playlists = useMemo(() => {
    if (!Array.isArray(globalPlaylists)) return [];
    return globalPlaylists.filter(p => p && p.id).map(playlist => ({
      id: playlist.id,
      userId: user?.id || '',
      name: playlist.name || 'Lista sin nombre',
      tracks: Array.isArray(playlist.tracks) ? playlist.tracks : [],
      createdAt: new Date().toISOString()
    }));
  }, [globalPlaylists, user?.id]);

  const selectedPlaylist = useMemo(() => playlists.find(p => p.id === selectedPlaylistId) || null, [playlists, selectedPlaylistId]);
  
  if (selectedPlaylistId && !selectedPlaylist) {
    return (
      <div className="p-10 text-white text-center flex flex-col items-center justify-center h-full space-y-4">
        <h2 className="text-xl font-black italic text-accent uppercase tracking-tighter">Cargando contenido...</h2>
        <p className="text-zinc-500 font-bold italic text-sm">Validando acceso a tu legado...</p>
        <button 
          onClick={() => setSelectedPlaylistId(null)} 
          className="mt-4 px-8 py-4 bg-white text-black rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all"
        >
          Volver a mi Biblioteca
        </button>
      </div>
    );
  }
  const isPremium = userPlan === 'Premium';

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-white space-y-6">
        <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 animate-pulse">
          <Lock size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-orange-500">Función Premium</h2>
          <p className="text-zinc-400 font-medium max-w-xs mx-auto">
            Sube a Premium para guardar, organizar y personalizar tus propias listas de mentorías.
          </p>
        </div>
        <button 
          onClick={onOpenPremium}
          className="bg-accent text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(212,175,55,0.3)]"
        >
          Desbloquear Legado
        </button>
      </div>
    );
  }

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

  const filteredAudios = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return audios.filter(a => 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, audios]);

  const handleRename = (id: string) => {
    const trimmedValue = renameValue.trim();
    if (trimmedValue) {
      // Actualizar estado global (local storage)
      renamePlaylist(id, trimmedValue);
      
      // Sincronizar con servidor si el prop está presente
      if (typeof onRenamePlaylist === 'function') {
        onRenamePlaylist(id, trimmedValue);
      }
      
      setIsRenaming(null);
      setRenameValue('');
    } else {
      setIsRenaming(null);
    }
  };

  const handleCreateList = () => {
    const title = newListTitle.trim();
    if (title) {
      addPlaylist(title);
      setIsCreatingList(false);
      setNewListTitle('');
    }
  };

  const handleAudioClick = (audio: Audio) => {
    if (isPremium) {
      onSelectAudio(audio);
    } else {
      onOpenPremium();
    }
  };

  const getAudio = (id: string) => audios.find(a => a.id === id);
  const getBook = (id: string) => RECOMMENDED_BOOKS.find(b => b.id === id);

  return (
    <div className="pb-40 pt-8 px-6 space-y-8 max-w-4xl mx-auto">
      <header className="space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase italic">Mi Biblioteca</h1>
            <p className="text-accent text-xs font-bold uppercase tracking-[0.2em]">{playlists.length} Listas Creadas</p>
          </div>
          <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center">
            <DiamondListIcon size={28} />
          </div>
        </div>

        {/* Search Bar - Slim Style */}
        <div className={`relative group flex items-center rounded-2xl border transition-all duration-300 ${
          searchQuery ? 'bg-white/10 border-accent/50 focus-within:bg-white/15' : 'bg-white/5 border-white/5 focus-within:bg-white/10'
        }`}>
          <Search size={16} className={`absolute left-4 transition-colors ${searchQuery ? 'text-accent' : 'text-zinc-500'}`} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar audios VIP..."
            className="w-full bg-transparent py-4 pl-12 pr-12 text-[12px] font-black uppercase tracking-wider text-white outline-none placeholder:text-zinc-600"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 text-zinc-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Conditional Tabs Navigation */}
      {!selectedPlaylistId && !searchQuery && (
        <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveLibraryTab('categories')}
            className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
              activeLibraryTab === 'categories' ? 'bg-accent text-black shadow-lg' : 'text-text-dim hover:text-white'
            }`}
          >
            Categorías
          </button>
          <button
            onClick={() => setActiveLibraryTab('my-lists')}
            className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
              activeLibraryTab === 'my-lists' ? 'bg-accent text-black shadow-lg' : 'text-text-dim hover:text-white'
            }`}
          >
            Mis Listas
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {searchQuery ? (
          <motion.div
            key="search-results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Resultados de búsqueda</h3>
              <span className="text-[9px] text-zinc-500 italic">{filteredAudios.length} audios encontrados</span>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {filteredAudios.map((audio) => (
                <div 
                  key={audio.id}
                  onClick={() => handleAudioClick(audio)}
                  className={`group relative flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5 transition-all ${
                    isPremium ? 'hover:bg-white/10' : 'opacity-40 grayscale-[0.5] cursor-pointer'
                  }`}
                >
                  <div className="relative">
                    <img src={audio.coverUrl} className="w-12 h-12 rounded-xl object-cover shadow-lg" referrerPolicy="no-referrer" />
                    {!isPremium && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                        <Lock size={18} className="text-accent" fill="currentColor" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-24">
                    <MarqueeTitle 
                      title={audio.title}
                      className={`text-base font-black italic ${isPremium ? 'text-white' : 'text-zinc-400'}`}
                    />
                    <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-600 mt-0.5 truncate">Dir. {audio.author}</p>
                  </div>
                  
                  <div className="absolute right-3 flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleShareAudio(audio); }}
                      className={`p-2 rounded-xl transition-all active:scale-95 ${
                        isPremium ? 'text-accent hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-400'
                      }`}
                      title="Compartir Éxito"
                    >
                      <Share size={16} />
                    </button>
                    {isPremium && (
                      <button
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setAudioToSave(audio);
                        }}
                        className="p-2 rounded-xl bg-white/5 text-accent hover:bg-accent hover:text-black transition-all active:scale-90"
                        title="Añadir a mi lista"
                      >
                        {globalPlaylists?.some(p => p?.tracks?.some((t: any) => t?.id === audio?.id)) ? (
                          <Check size={16} className="text-orange-500" />
                        ) : (
                          <Plus size={16} />
                        )}
                      </button>
                    )}
                    <button
                      className={`p-2 rounded-xl transition-all shadow-lg ${isPremium ? 'bg-accent text-black hover:scale-105 shadow-accent/20' : 'bg-zinc-800 text-zinc-500'}`}
                    >
                      <Play size={16} fill="currentColor" />
                    </button>
                  </div>
                </div>
              ))}
              {filteredAudios.length === 0 && (
                <div className="py-20 text-center text-zinc-500 italic text-sm border-2 border-dashed border-white/5 rounded-[32px]">
                  No hay audios que coincidan con tu búsqueda.
                </div>
              )}
            </div>
          </motion.div>
        ) : selectedPlaylistId ? (
          <motion.div
            key="playlist-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-10"
          >
            {selectedPlaylist ? (
              <>
                <button
                  onClick={() => setSelectedPlaylistId(null)}
                  className="flex items-center gap-3 text-text-dim hover:text-white transition-all font-black uppercase tracking-widest text-[10px] mb-4 bg-white/5 px-4 py-2 rounded-full border border-white/10"
                >
                  <ChevronRight size={14} className="rotate-180" />
                  Volver a mis listas
                </button>

                <div className="flex flex-col sm:flex-row items-center gap-10">
                  <div className="w-48 h-48 rounded-[40px] overflow-hidden shadow-2xl relative">
                    {(selectedPlaylist?.tracks || []).length > 0 ? (
                      <img src={selectedPlaylist?.tracks?.[0]?.coverUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-bg-card flex items-center justify-center text-text-dim">
                        <Music size={60} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-deep/80 to-transparent"></div>
                  </div>
                  <div className="text-center sm:text-left space-y-4">
                    <span className="text-accent text-[9px] font-black uppercase tracking-[0.4em] bg-accent/10 px-4 py-1.5 rounded-full border border-accent/20">Colección Personal</span>
                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-tight">{selectedPlaylist?.name}</h2>
                    <p className="text-text-dim font-bold italic text-sm">
                      {(selectedPlaylist?.tracks || []).length} Legados en esta lista
                    </p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                      <button 
                        onClick={() => (selectedPlaylist?.tracks || []).length > 0 && onSelectAudio(selectedPlaylist?.tracks?.[0] as Audio)}
                        className="bg-white text-black px-8 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-xl hover:scale-105 transition-transform"
                      >
                        <Play size={16} fill="currentColor" />
                        REPRODUCIR TODO
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-6">
                  {(selectedPlaylist?.tracks || []).map((item: any, index: number) => {
                    const isAudio = item?.type === 'Audio' || (item && 'audioUrl' in item);
                    if (!item) return null;

                    return (
                      <div
                        key={`${item?.id}-${index}`}
                        className="flex items-center gap-4 p-4 bg-bg-card/40 hover:bg-bg-hover rounded-[24px] group transition-all border border-white/5"
                      >
                        <div className="text-text-dim/20 font-black text-xl italic w-8 text-center">{index + 1}</div>
                        <div 
                          className="flex-1 flex items-center gap-4 cursor-pointer"
                          onClick={() => isAudio ? handleAudioClick(item as Audio) : null}
                        >
                          <div className="relative">
                            <img src={item?.coverUrl} className="w-12 h-12 rounded-xl object-cover shadow-lg" referrerPolicy="no-referrer" />
                            <div className="absolute -right-1 -bottom-1 w-5 h-5 bg-black rounded-full border border-white/10 flex items-center justify-center text-accent">
                              {isAudio ? <Music size={10} /> : <BookOpen size={10} />}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-2">
                              <MarqueeTitle 
                                title={item?.title || 'Sin título'}
                                className="text-base font-black text-white group-hover:text-accent transition-colors italic tracking-tight"
                              />
                              {isAudio && completedAudios?.includes(item?.id) && (
                                <Check size={14} className="text-green-500 flex-shrink-0" strokeWidth={3} />
                              )}
                            </div>
                            <p className="text-text-dim text-[11px] font-medium uppercase tracking-widest mt-0.5">{item?.author || 'Anónimo'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAudio && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleShareAudio(item as Audio); }}
                              className="p-2 text-accent hover:bg-white/5 rounded-xl transition-all active:scale-95 z-20"
                              title="Compartir Éxito"
                            >
                              <Share size={18} />
                            </button>
                          )}
                          <button 
                            onClick={() => onRemoveFromPlaylist(selectedPlaylistId!, item?.id, isAudio ? 'audio' : 'book')}
                            className="p-2 text-text-dim hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X size={18} />
                          </button>
                          {isAudio && (
                            <button 
                              onClick={() => handleAudioClick(item as Audio)}
                              className="p-3 bg-accent/10 text-accent rounded-xl group-hover:bg-accent group-hover:text-black transition-all"
                            >
                              <Play size={16} fill="currentColor" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {(selectedPlaylist?.tracks || []).length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-[40px] space-y-6">
                      <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center text-accent animate-pulse">
                        <Music size={40} />
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-xl font-bold text-white uppercase tracking-tighter italic">Esta lista está vacía</p>
                        <p className="text-sm text-text-dim px-10">Empieza a llenarla con tus mentorías favoritas</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-10 text-white text-center font-bold italic opacity-60">Cargando datos de la lista...</div>
            )}
          </motion.div>
        ) : activeLibraryTab === 'my-lists' ? (
          <motion.div
            key="playlists-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Create New List Button */}
            <div className="space-y-4">
              {!isCreatingList ? (
                <button
                  onClick={() => setIsCreatingList(true)}
                  className="w-full py-4 border-2 border-dashed border-accent/20 rounded-[24px] flex items-center justify-center gap-3 text-accent hover:bg-accent/5 transition-all active:scale-[0.98]"
                >
                  <Plus size={20} />
                  <span className="text-[14px] font-black uppercase tracking-widest">Crear Nueva Lista</span>
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-bg-card border-2 border-accent rounded-[24px] p-4 flex flex-col gap-4"
                >
                  <input
                    autoFocus
                    type="text"
                    placeholder="Nombre de la lista..."
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    className="bg-transparent border-b border-white/20 p-2 text-white outline-none font-bold uppercase tracking-widest text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateList}
                      disabled={!newListTitle.trim()}
                      className="flex-1 bg-accent text-black py-2 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => { setIsCreatingList(false); setNewListTitle(''); }}
                      className="px-4 py-2 bg-white/5 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                    >
                      Cancelar
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {playlists.length > 0 ? (
                playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className={`relative group bg-bg-card border-2 border-border rounded-[32px] p-5 transition-all flex items-center gap-6 cursor-pointer ${
                      isPremium ? 'hover:border-accent/40' : 'opacity-40 grayscale-[0.8]'
                    }`}
                    onClick={() => {
                      if (isPremium) setSelectedPlaylistId(playlist.id);
                      else onOpenPremium();
                    }}
                  >
                    <div className="w-20 h-20 bg-bg-hover rounded-2xl flex items-center justify-center text-accent shadow-xl group-hover:bg-accent group-hover:text-black transition-all overflow-hidden relative">
                      {playlist.tracks.length > 0 ? (
                        <img 
                          src={playlist.tracks[0].coverUrl} 
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Music size={32} />
                      )}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors flex items-center justify-center">
                        {!isPremium && <Lock size={24} className="text-accent" fill="currentColor" />}
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      {isRenaming === playlist.id && isPremium ? (
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleRename(playlist.id);
                              if (e.key === 'Escape') setIsRenaming(null);
                            }}
                            className="flex-1 bg-black/40 border-b-2 border-accent text-lg font-bold text-white outline-none py-1"
                          />
                          <button onClick={() => handleRename(playlist.id)} className="text-accent"><Check size={20} /></button>
                        </div>
                      ) : (
                        <h4 className={`text-xl font-black italic tracking-tighter truncate leading-tight uppercase ${isPremium ? 'text-accent' : 'text-zinc-500'}`}>{playlist.name}</h4>
                      )}
                      <p className={`text-[10px] font-black uppercase tracking-widest ${isPremium ? 'text-accent/70' : 'text-zinc-600'}`}>{playlist.tracks.length} Audios • {new Date(playlist.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</p>
                    </div>

                    {isPremium && (
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => {
                            setIsRenaming(playlist.id);
                            setRenameValue(playlist.name);
                          }}
                          className="p-2 text-text-dim hover:text-white transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removePlaylist(playlist.id);
                            if (onDeletePlaylist) onDeletePlaylist(playlist.id);
                          }}
                          className="p-2 text-text-dim hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-16 space-y-4 bg-white/5 rounded-[40px] border-2 border-dashed border-white/10">
                  <Music size={48} className="mx-auto text-text-dim opacity-20" />
                  <p className="text-text-dim text-lg italic">Aún no tienes listas de reproducción.</p>
                  <p className="text-text-dim/60 text-[10px] uppercase font-black tracking-widest px-10">Agrega audios desde el Inicio o Fama para comenzar.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="categories-grid"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-2 gap-4"
          >
            {['Ventas', 'Mentalidad', 'Prospectación', 'Liderazgo', 'Mentorías VIP', 'Audiolibros'].map(cat => (
              <button 
                key={cat} 
                onClick={() => {
                  if (!isPremium) {
                    onOpenPremium();
                  } else {
                    setSearchQuery(cat === 'Mentorías VIP' ? 'mentoring' : (cat === 'Audiolibros' ? 'audiobook' : cat));
                  }
                }}
                className={`h-32 bg-bg-card border-2 border-border rounded-[32px] p-6 group transition-all text-left relative overflow-hidden ${
                  isPremium ? 'hover:border-accent' : 'opacity-40 grayscale cursor-pointer'
                }`}
              >
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-accent/5 rounded-full group-hover:scale-150 transition-transform flex items-center justify-center">
                  {!isPremium && <Lock size={24} className="text-accent/20" fill="currentColor" />}
                </div>
                <Music size={20} className={isPremium ? 'text-accent mb-4' : 'text-zinc-600 mb-4'} />
                <p className={`text-lg font-black italic tracking-tighter uppercase ${isPremium ? 'text-white' : 'text-zinc-600'}`}>{cat}</p>
                <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isPremium ? 'text-text-dim' : 'text-zinc-700'}`}>Explorar Legado</p>
              </button>
            ))}
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
