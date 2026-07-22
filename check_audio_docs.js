const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyC0KwUBGcUzX3cOqpAKq_R1CmHbBLf2VWQ",
  authDomain: "inspira-bbe1e.firebaseapp.com",
  projectId: "inspira-bbe1e",
  storageBucket: "inspira-bbe1e.firebasestorage.app",
  messagingSenderId: "1076385178602",
  appId: "1:1076385178602:web:c3aaffc25e9c5b11ff7fac"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const snap = await getDocs(collection(db, 'audiobooks'));
  snap.forEach(doc => {
    const d = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`  title: ${d.title}`);
    console.log(`  audioUrl: ${d.audioUrl}`);
    console.log(`  audioFullUrl: ${d.audioFullUrl}`);
    console.log(`  previewUrl: ${d.previewUrl}`);
    console.log(`  contentType: ${d.contentType}`);
    console.log('---');
  });
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
