import { useState, useEffect } from 'react';

const STORAGE_KEY = 'inspira_global_playlists_v2';

export interface GlobalPlaylist {
  id: string;
  name: string;
  tracks: any[];
}

export function useGlobalPlaylists() {
  const [playlists, setPlaylists] = useState<GlobalPlaylist[]>([]);

  const addPlaylist = (name: string): string => {
    const id = Date.now().toString();
    const newPlaylist: GlobalPlaylist = { 
      id, 
      name: name.trim(), 
      tracks: [] 
    };
    const updated = [...playlists, newPlaylist];
    setPlaylists(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('playlists-sync'));
    return id;
  };

  const removePlaylist = (id: string) => {
    const updated = playlists.filter(p => p.id !== id);
    setPlaylists(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('playlists-sync'));
  };

  const toggleItemInPlaylist = (playlistId: string, item: any) => {
    const updated = playlists.map(p => {
      if (p.id === playlistId) {
        const itemId = item.id;
        const exists = p.tracks.some(i => i.id === itemId);
        return {
          ...p,
          tracks: exists 
            ? p.tracks.filter(i => i.id !== itemId) 
            : [...p.tracks, item]
        };
      }
      return p;
    });
    
    setPlaylists(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('playlists-sync'));
  };

  const renamePlaylist = (id: string, newName: string) => {
    const updated = playlists.map(p => p.id === id ? { ...p, name: newName.trim() } : p);
    setPlaylists(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('playlists-sync'));
  };

  const getPlaylistItems = (playlistId: string): any[] => {
    const playlist = playlists.find(p => p.id === playlistId);
    return playlist ? playlist.tracks : [];
  };

  useEffect(() => {
    const syncState = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setPlaylists(parsed.filter(p => p && typeof p === 'object' && p.id));
          }
        } catch (e) {
          console.error('Error parsing playlists:', e);
        }
      }
    };

    syncState(); // Initial load

    window.addEventListener('playlists-sync', syncState);
    window.addEventListener('storage', syncState);

    return () => {
      window.removeEventListener('playlists-sync', syncState);
      window.removeEventListener('storage', syncState);
    };
  }, []);

  return { playlists, addPlaylist, removePlaylist, renamePlaylist, toggleItemInPlaylist, getPlaylistItems };
}

