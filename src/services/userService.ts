import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types';
import { handleFirestoreError, OperationType } from './firestoreErrorHandler';

/**
 * Envuelve una promesa con un timeout. Si la promesa no resuelve en `ms`
 * milisegundos, se rechaza con un error de timeout. Esto evita que las
 * operaciones de Firestore se queden colgadas indefinidamente cuando la
 * conexión a la nube está lenta o caída (lo que antes bloqueaba el login).
 */
const withTimeout = <T>(promise: Promise<T>, ms: number, label = 'Firestore'): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout después de ${ms}ms`)), ms)
    ),
  ]);
};

const sanitizeData = (data: any) => {
  const clean: any = {};
  Object.keys(data || {}).forEach((key) => {
    const value = data[key];
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        clean[key] = sanitizeData(value);
      } else {
        clean[key] = value;
      }
    }
  });
  return clean;
};

const normalizeUserPayload = (data: Partial<User>): Partial<User> => {
  const normalized: Partial<User> & { birthdate?: string } = { ...data };

  // Compatibilidad: algunas partes del producto hablan de birthdate y otras de birthDate.
  if ((normalized as any).birthdate && !normalized.birthDate) {
    normalized.birthDate = (normalized as any).birthdate;
  }
  if (normalized.birthDate && !(normalized as any).birthdate) {
    (normalized as any).birthdate = normalized.birthDate;
  }

  // Si hay rango cargado desde onboarding, el flag debe quedar consistente.
  if (normalized.current_rank && normalized.onboardingCompleted !== true) {
    normalized.onboardingCompleted = true;
  }

  return normalized;
};

export const userService = {
  async createUser(user: User): Promise<boolean> {
    const path = `users/${user.id}`;
    try {
      const baseUser: User = {
        ...user,
        id: user.id,
        email: (user.email || '').toLowerCase(),
        createdAt: user.createdAt || new Date().toISOString(),
      };
      const cleanUser = sanitizeData(normalizeUserPayload(baseUser));
      console.info('[userService.createUser] Escribiendo documento:', path, cleanUser);
      await setDoc(doc(db, 'users', user.id), cleanUser, { merge: true });
      console.info('[userService.createUser] OK:', path);
      return true;
    } catch (error) {
      console.error('[userService.createUser] ERROR:', path, error);
      handleFirestoreError(error, OperationType.CREATE, path);
      return false;
    }
  },

  async getUser(userId: string): Promise<User | null> {
    const path = `users/${userId}`;
    const docRef = doc(db, 'users', userId);

    try {
      // getDoc usa la caché local como respaldo automático: si el servidor no
      // responde y hay persistencia/IndexedDB, devuelve el dato cacheado. Esto
      // hace el login resistente a problemas de red (a diferencia de
      // getDocFromServer, que SIEMPRE exige una conexión viva al servidor).
      // Lo envolvemos en un timeout para no quedar colgados indefinidamente.
      console.info('[userService.getUser] Leyendo (caché + servidor):', path);
      const snap = await withTimeout(getDoc(docRef), 8000, 'getUser');

      if (!snap.exists()) {
        console.warn('[userService.getUser] Documento no existe en Firestore:', path);
        return null;
      }

      const data = snap.data() as User;
      const source = snap.metadata.fromCache ? 'caché local' : 'servidor';
      console.info(`[userService.getUser] OK (origen: ${source}):`, path);
      return { ...data, id: data.id || userId };
    } catch (error) {
      // IMPORTANTE: distinguimos "no existe" (devolvemos null arriba) de un
      // error de red/timeout (lanzamos aquí). NO llamamos a handleFirestoreError
      // porque éste relanza, y queremos un error limpio y propio. La capa
      // superior (App.tsx) capturará este error y usará el perfil cacheado,
      // preservando onboardingCompleted, en lugar de crear un usuario temporal
      // o de provocar un auto-deslogueo.
      console.warn('[userService.getUser] No se pudo leer el perfil (red/timeout):', path, error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<boolean> {
    const path = `users/${userId}`;
    try {
      const normalized = normalizeUserPayload({
        ...updates,
        id: userId,
      });
      const cleanUpdates = sanitizeData(normalized);
      console.info('[userService.updateUser] setDoc merge en:', path, cleanUpdates);
      // Timeout para que una escritura colgada (canal Write de Firestore caído)
      // no bloquee al llamador. Si vence, devolvemos false sin relanzar.
      await withTimeout(
        setDoc(doc(db, 'users', userId), cleanUpdates, { merge: true }),
        8000,
        'updateUser'
      );
      console.info('[userService.updateUser] OK:', path);
      return true;
    } catch (error) {
      console.error('[userService.updateUser] ERROR:', path, error);
      handleFirestoreError(error, OperationType.UPDATE, path);
      return false;
    }
  },

  async getAllUsers(): Promise<User[]> {
    const path = 'users';
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      return querySnapshot.docs.map((d) => ({ id: d.id, ...(d.data() as User) }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  subscribeToUsers(callback: (users: User[]) => void) {
    const path = 'users';
    return onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const users = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as User) }));
        callback(users);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  subscribeToUser(userId: string, callback: (user: User | null) => void) {
    const path = `users/${userId}`;
    return onSnapshot(
      doc(db, 'users', userId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as User;
          callback({ ...data, id: data.id || userId });
        } else {
          callback(null);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  },
};
