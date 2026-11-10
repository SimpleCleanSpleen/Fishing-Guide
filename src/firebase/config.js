// ---------------------------------------------------------------------------
// FIREBASE WEB CONFIG (README step 4).
// Firebase console > Project settings > General > Your apps > Web app > Config.
//
// This web config is NOT a secret: it only identifies your project, and the
// Firestore security rules (firestore.rules) are what protect your data.
// It's fine to commit it. NEVER commit a *service account* key (.json) though.
//
// If these are replaced with PASTE_ placeholders the app runs in "demo mode" and
// saves everything in this browser only.
// ---------------------------------------------------------------------------
// This project is shared with Zombie Evac (same Google sign-in, same authorized
// github.io domain). Fishing data lives in its own `anglers/` collection.
export const firebaseConfig = {
  apiKey: 'AIzaSyD9Z7YY6sCtzRUS79W8tiskRXjG-xvu26U',
  authDomain: 'zombie-evac-vl6cz.firebaseapp.com',
  projectId: 'zombie-evac-vl6cz',
  storageBucket: 'zombie-evac-vl6cz.firebasestorage.app',
  messagingSenderId: '22331805414',
  appId: '1:22331805414:web:d9fd9e20e1538153e7b527',
};

export const isFirebaseConfigured =
  !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('PASTE_');
