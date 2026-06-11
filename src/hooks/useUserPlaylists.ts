import { useState, useEffect } from 'react';
import { Playlist } from '../types';
import { playlistService } from '../services/dbService';
import { auth } from '../services/firebase';

export function useUserPlaylists(userId?: string) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setPlaylists([]);
      setLoading(false);
      return;
    }

    const unsubscribe = playlistService.subscribeToPlaylists(userId, (data) => {
      setPlaylists(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { playlists, loading };
}
