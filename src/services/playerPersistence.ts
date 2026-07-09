/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Persistencia del estado del reproductor usando IndexedDB.
 * ---------------------------------------------------------
 * Guarda qué contenido se estaba escuchando y la posición exacta (timestamp)
 * para que, al salir y volver a la app (incluso horas después), el usuario
 * pueda continuar justo donde se quedó.
 *
 * Requerimiento del cliente (Audio 2): "la intención es que el usuario se
 * quede donde comenzó, donde se quedó".
 */

export interface PlayerState {
  contentId: string;
  contentType: 'audiobook' | 'mentoring' | string;
  position: number;   // posición de reproducción en segundos
  duration: number;
  title: string;
  isPlaying: boolean;
  timestamp: number;  // Date.now() del guardado
}

const DB_NAME = 'inspira_player';
const STORE = 'state';
const STATE_KEY = 'current';
const DB_VERSION = 1;

// Máxima antigüedad del estado guardado (7 días). Después se descarta.
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });
  return dbPromise;
}

/** Guarda (o actualiza) el estado del reproductor. */
export async function savePlayerState(state: PlayerState): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(state, STATE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    // Fallback silencioso a localStorage si IndexedDB no está disponible.
    try {
      localStorage.setItem('inspira_player_state', JSON.stringify(state));
    } catch {
      /* noop */
    }
  }
}

/** Recupera el estado guardado (o null si no existe / está vencido). */
export async function loadPlayerState(): Promise<PlayerState | null> {
  let state: PlayerState | null = null;
  try {
    const db = await openDB();
    state = await new Promise<PlayerState | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(STATE_KEY);
      req.onsuccess = () => resolve((req.result as PlayerState) || null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    try {
      const raw = localStorage.getItem('inspira_player_state');
      state = raw ? (JSON.parse(raw) as PlayerState) : null;
    } catch {
      state = null;
    }
  }

  if (!state) return null;
  if (Date.now() - (state.timestamp || 0) > MAX_AGE_MS) {
    clearPlayerState().catch(() => {});
    return null;
  }
  return state;
}

/** Borra el estado guardado. */
export async function clearPlayerState(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(STATE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* noop */
  }
  try {
    localStorage.removeItem('inspira_player_state');
  } catch {
    /* noop */
  }
}
