/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plus, ListMusic, Check, X, Crown } from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Audio, Playlist, UserPlan, Book } from '../types';
import { useGlobalPlaylists } from '../hooks/useGlobalPlaylists';

interface PlaylistModalProps {
  item: Audio | Book | null;
  userPlan: UserPlan;
  onClose: () => void;
  onOpenPremium: () => void;
  onNavigateToPlaylist?: (id: string) => void;
}

export default function PlaylistModal({ 
  item, userPlan, onClose, onOpenPremium, onNavigateToPlaylist 
}: PlaylistModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const { playlists: globalPlaylists, addPlaylist, toggleItemInPlaylist, getPlaylistItems } = useGlobalPlaylists();

  if (!item) return null;

  const itemType = 'audioUrl' in item ? 'audio' : 'book';

  const playlists = useMemo(() => {
    return globalPlaylists.map((p) => ({
      id: p.id,
      name: p.name,
      tracks: p.tracks,
      createdAt: new Date().toISOString()
    }));
  }, [globalPlaylists, item.id]);

  const handleCreate = () => {
    if (userPlan !== 'Premium') {
      return;
    }
    if (newPlaylistName.trim()) {
      const newPlaylistId = addPlaylist(newPlaylistName.trim());
      // Optionally add the item immediately
      toggleItemInPlaylist(newPlaylistId, item);
      
      setIsCreating(false);
      setNewPlaylistName('');
      onClose();
    }
  };

  const handleAdd = (playlistId: string) => {
    toggleItemInPlaylist(playlistId, item);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm px-0 sm:px-6">
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="bg-bg-deep border-t-2 sm:border-2 border-accent/20 rounded-t-[40px] sm:rounded-[48px] w-full max-w-md p-10 space-y-10 shadow-2xl overflow-y-auto max-h-[90vh]"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-white tracking-tighter">Guardar en Lista</h3>
              <p className="text-text-dim text-sm italic">"{item.title}"</p>
            </div>
            <button 
              onClick={onClose}
              className="p-4 bg-white/5 rounded-full text-text-dim hover:text-white"
            >
              <X size={32} />
            </button>
          </div>

          {userPlan === 'Premium' ? (
            <div className="space-y-8">
              {!isCreating ? (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center gap-6 p-6 bg-accent/10 border-2 border-dashed border-accent/30 rounded-3xl group hover:border-accent transition-all"
                >
                  <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-black">
                    <Plus size={32} />
                  </div>
                  <span className="text-xl font-bold text-white group-hover:text-accent">Crear nueva lista</span>
                </button>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Nombre de tu lista (ej: Mañanas de Poder)"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="w-full bg-bg-card border-4 border-accent/30 focus:border-accent rounded-3xl py-6 px-8 text-xl text-white outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  />
                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsCreating(false)}
                      className="flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-text-dim"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={!newPlaylistName.trim()}
                      className="flex-1 bg-accent text-black py-5 rounded-2xl font-black uppercase tracking-widest disabled:opacity-50"
                    >
                      Crear y Guardar
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-xs font-black text-text-dim uppercase tracking-[0.2em]">Tus Listas</h4>
                {playlists.length > 0 ? (
                  <div className="space-y-4 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
                    {playlists.map(playlist => {
                      const isAlreadyIn = playlist.tracks.some((t: any) => t.id === item.id);
                      return (
                        <button
                          key={playlist.id}
                          onClick={() => !isAlreadyIn && handleAdd(playlist.id)}
                          className={`w-full flex items-center gap-6 p-6 rounded-3xl transition-all ${
                            isAlreadyIn ? 'bg-white/5 opacity-50 cursor-default' : 'bg-bg-card border-2 border-border hover:border-accent'
                          }`}
                        >
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isAlreadyIn ? 'bg-text-dim/20 text-text-dim' : 'bg-bg-hover text-accent'}`}>
                            <ListMusic size={32} />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-xl font-bold text-white">{playlist.name}</p>
                            <p className="text-xs text-text-dim font-bold uppercase">
                              {playlist.tracks.length} elementos
                            </p>
                          </div>
                          {isAlreadyIn && <Check size={28} className="text-accent" />}
                        </button>
                      );
                    })}
                  </div>
                ) : !isCreating && (
                  <p className="text-center py-10 text-text-dim italic">Aún no tienes listas. ¡Crea la primera!</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8 text-center bg-accent/5 border-2 border-accent/30 p-10 rounded-[32px]">
              <div className="w-20 h-20 bg-accent text-black rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(255,140,0,0.3)]">
                <Crown size={40} fill="currentColor" />
              </div>
              <div className="space-y-4">
                <h4 className="text-2xl font-black text-white italic">Organiza tu éxito</h4>
                <p className="text-text-dim text-lg leading-relaxed">
                  Suscríbete a <span className="text-accent font-bold">Premium</span> para crear tus propias listas de entrenamiento personalizadas y dominar tu agenda.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenPremium();
                }}
                className="w-full bg-accent text-black py-6 rounded-2xl font-black uppercase tracking-widest text-lg shadow-xl"
              >
                Cambiar a Premium
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
