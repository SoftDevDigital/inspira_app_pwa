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

const LS_KEY = 'inspira_player_state';

/**
 * Guarda (o actualiza) el estado del reproductor.
 *
 * IMPORTANTE (fix BUG #1): SIEMPRE escribe primero en localStorage de forma
 * SÍNCRONA. Esto garantiza que el estado (incluida la posición real) quede
 * persistido incluso cuando la página se cierra en el evento `beforeunload`,
 * ya que IndexedDB es asíncrono y su Promise no llega a completar antes de que
 * el navegador destruya la página. IndexedDB se usa como respaldo adicional.
 */
export async function savePlayerState(state: PlayerState): Promise<void> {
  // 1. SIEMPRE guardar en localStorage sincrónicamente (garantizado antes del unload).
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }

  // 2. También guardar en IndexedDB (best effort, asíncrono).
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(state, STATE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* noop - localStorage ya tiene el respaldo */
  }
}

/**
 * Recupera el estado guardado (o null si no existe / está vencido).
 *
 * Fix BUG #1: compara los timestamps de IndexedDB y localStorage y usa el más
 * reciente, porque el guardado periódico puede dejar valores distintos en cada
 * almacén (localStorage se escribe siempre; IndexedDB a veces no alcanza).
 */
export async function loadPlayerState(): Promise<PlayerState | null> {
  let idbState: PlayerState | null = null;
  let lsState: PlayerState | null = null;

  // Intentar IndexedDB.
  try {
    const db = await openDB();
    idbState = await new Promise<PlayerState | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(STATE_KEY);
      req.onsuccess = () => resolve((req.result as PlayerState) || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    idbState = null;
  }

  // Intentar localStorage.
  try {
    const raw = localStorage.getItem(LS_KEY);
    lsState = raw ? (JSON.parse(raw) as PlayerState) : null;
  } catch {
    lsState = null;
  }

  // Usar el más reciente (comparar timestamps).
  let state: PlayerState | null = null;
  if (idbState && lsState) {
    state = (idbState.timestamp || 0) >= (lsState.timestamp || 0) ? idbState : lsState;
  } else {
    state = idbState || lsState;
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
