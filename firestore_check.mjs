import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirestore, doc, setDoc, getDocFromServer } from 'firebase/firestore';

const cfg = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(cfg);
const auth = getAuth(app);
const db = initializeFirestore(app, { experimentalForceLongPolling: false, useFetchStreams: true });

const timeout = (label, ms = 9000) => new Promise((_, reject) => setTimeout(() => reject(new Error(label)), ms));

try {
  const cred = await Promise.race([
    signInWithEmailAndPassword(auth, 'alexis.correa026@gmail.com', '123456'),
    timeout('auth-timeout')
  ]);
  const uid = cred.user.uid;
  const ref = doc(db, 'users', uid);
  const payload = { onboardingCompleted: true, _integrationTestAt: new Date().toISOString() };

  await Promise.race([
    setDoc(ref, payload, { merge: true }),
    timeout('setDoc-timeout')
  ]);

  const snap = await Promise.race([
    getDocFromServer(ref),
    timeout('getDocFromServer-timeout')
  ]);

  console.log('WRITE_OK', snap.exists(), snap.data()?._integrationTestAt);
} catch (e) {
  console.error('WRITE_FAIL', e.code || '', e.message || e);
  process.exit(1);
}
