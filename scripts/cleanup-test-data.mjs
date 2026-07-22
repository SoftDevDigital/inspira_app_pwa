import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

/**
 * Script auxiliar (OPCIONAL) para limpieza de datos de prueba.
 *
 * Uso recomendado (siempre primero en dry-run):
 *   FIREBASE_ADMIN_EMAIL="tu_email" FIREBASE_ADMIN_PASSWORD="tu_password" node scripts/cleanup-test-data.mjs --dry-run
 *
 * Ejecutar borrado real:
 *   FIREBASE_ADMIN_EMAIL="tu_email" FIREBASE_ADMIN_PASSWORD="tu_password" node scripts/cleanup-test-data.mjs --execute
 */

const DRY_RUN = process.argv.includes('--dry-run') || !process.argv.includes('--execute');
const ADMIN_EMAIL = process.env.FIREBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.FIREBASE_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Faltan variables de entorno FIREBASE_ADMIN_EMAIL y/o FIREBASE_ADMIN_PASSWORD.');
  process.exit(1);
}

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

const TEST_REGEX = /(test|prueba|demo|mock|franco|nirvana|test no vip|test05|test02|test002)/i;

const COLLECTIONS = [
  { name: 'users', fields: ['name', 'email'] },
  { name: 'speakers', fields: ['name', 'role', 'bio'] },
  { name: 'audiobooks', fields: ['title', 'author', 'category', 'description'] },
  { name: 'books', fields: ['title', 'author', 'review'] },
  { name: 'events', fields: ['title', 'description'] },
];

const hasTestMarker = (data, fields) => {
  return fields.some((field) => {
    const value = data?.[field];
    return typeof value === 'string' && TEST_REGEX.test(value);
  });
};

async function run() {
  await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
  console.log(`[cleanup-test-data] Autenticado como ${ADMIN_EMAIL}`);
  console.log(`[cleanup-test-data] Modo: ${DRY_RUN ? 'DRY-RUN (sin borrar)' : 'EJECUCIÓN (borra docs)'}`);

  let totalCandidates = 0;
  let totalDeleted = 0;

  for (const target of COLLECTIONS) {
    const snap = await getDocs(collection(db, target.name));
    const matches = snap.docs.filter((d) => hasTestMarker(d.data(), target.fields));
    totalCandidates += matches.length;

    if (matches.length === 0) {
      console.log(`\n[${target.name}] sin coincidencias.`);
      continue;
    }

    console.log(`\n[${target.name}] coincidencias: ${matches.length}`);
    for (const d of matches) {
      const data = d.data();
      const label = data.name || data.title || data.email || d.id;
      console.log(` - ${d.id} :: ${label}`);

      if (!DRY_RUN) {
        await deleteDoc(doc(db, target.name, d.id));
        totalDeleted += 1;
      }
    }
  }

  console.log('\nResumen:');
  console.log(` - Candidatos detectados: ${totalCandidates}`);
  if (DRY_RUN) {
    console.log(' - Borrados: 0 (modo dry-run)');
  } else {
    console.log(` - Borrados reales: ${totalDeleted}`);
  }
}

run().catch((err) => {
  console.error('[cleanup-test-data] Error:', err?.message || err);
  process.exit(1);
});
