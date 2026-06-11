import { useEffect, useCallback } from 'react';
import { User, Medal } from '../types';
import { MEDALS_CATALOG } from '../constants/medals';
import { userService } from '../services/dbService';

export function useGamification(user: User | null, onMedalUnlocked?: (medal: Medal) => void) {
  const checkMedals = useCallback(async () => {
    if (!user) return;

    const unlockedIds = user.unlockedMedalIds || [];
    const newUnlockedIds = [...unlockedIds];
    let changed = false;
    let lastUnlocked: Medal | null = null;

    for (const medal of MEDALS_CATALOG) {
      const medalIdStr = String(medal.id);
      if (unlockedIds.includes(medalIdStr)) continue;

      let isGoalMet = false;

      switch (medal.tipoTrigger) {
        case 'login':
          isGoalMet = true;
          break;
        case 'racha_dias':
          if ((user.streakCount || 0) >= medal.meta) {
            isGoalMet = true;
          }
          break;
        case 'audios_completados':
          if ((user.completedAudios?.length || 0) >= medal.meta) {
            isGoalMet = true;
          }
          break;
        case 'favoritos_agregados':
          // We can check user.favorites length if it existed in User type, 
          // but for now we'll check against a common metric or leave as hook for future
          break;
        case 'compartir_app':
          if ((user.dailyPassesUsed || 0) >= medal.meta) {
            isGoalMet = true;
          }
          break;
        case 'ruta_nivel_completado':
          // Simplified: check if user reached a level count
          break;
      }

      if (isGoalMet) {
        newUnlockedIds.push(medalIdStr);
        changed = true;
        lastUnlocked = medal;
        
        if (onMedalUnlocked) {
          onMedalUnlocked(medal);
        }
      }
    }

    if (changed) {
      try {
        await userService.updateUser(user.id, {
          unlockedMedalIds: newUnlockedIds
        });
      } catch (error) {
        console.error("Error updating medals:", error);
      }
    }
  }, [user, onMedalUnlocked]);

  useEffect(() => {
    if (user) {
      checkMedals();
    }
  }, [user?.streakCount, user?.completedAudios?.length, user?.unlockedMedalIds?.length]);

  return { checkMedals };
}
