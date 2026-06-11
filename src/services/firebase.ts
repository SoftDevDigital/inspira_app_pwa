import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// HARDCODED CONFIG - Para debug de conexión
const firebaseConfig = {
  apiKey: 'AIzaSyC-8faexFjXXA76hm8PuSQRgPKT8DwxCls',
  authDomain: 'inspira-bbe1e.firebaseapp.com',
  projectId: 'inspira-bbe1e',
  storageBucket: 'inspira-bbe1e.firebasestorage.app',
  messagingSenderId: '392969772499',
  appId: '1:392969772499:web:b6fc380f9352ba71e96326',
  measurementId: 'G-SP0JLWDPJV'
};

console.info('[Firebase] Config HARDCODEADA:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
  apiKey: firebaseConfig.apiKey ? 'PRESENTE' : 'AUSENTE',
});

const app = initializeApp(firebaseConfig);

// FIX: Usar getFirestore sin databaseId explícito para usar el database por defecto
// El database (default) debería funcionar automáticamente
export const db = getFirestore(app);

console.info('[Firebase] Firestore inicializado con getFirestore (database por defecto)');

export const auth = getAuth(app);
export const storage = getStorage(app);

if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.warn('[Firebase Auth] No se pudo configurar browserLocalPersistence:', error);
  });
}

if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
  try {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('[Firestore] persistence failed-precondition');
      } else if (err.code === 'unimplemented') {
        console.warn('[Firestore] persistence unimplemented');
      } else {
        console.error('[Firestore] persistence error:', err);
      }
    });
  } catch (e) {
    console.warn('[Firestore] error al habilitar persistence:', e);
  }
}

// testConnection() eliminado - causaba reconexiones constantes al cargar
// El test de conexión se puede hacer manualmente desde la consola si es necesario
