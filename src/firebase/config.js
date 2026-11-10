// ---------------------------------------------------------------------------
// PASTE YOUR FIREBASE WEB CONFIG HERE (README step 4).
// Firebase console > Project settings > General > Your apps > Web app > Config.
//
// This web config is NOT a secret: it only identifies your project, and the
// Firestore security rules (firestore.rules) are what protect your data.
// It's fine to commit it. NEVER commit a *service account* key (.json) though.
//
// While these are still placeholders the app runs in "demo mode" and saves
// everything in this browser only.
// ---------------------------------------------------------------------------
export const firebaseConfig = {
  apiKey: 'PASTE_API_KEY',
  authDomain: 'PASTE_PROJECT_ID.firebaseapp.com',
  projectId: 'PASTE_PROJECT_ID',
  storageBucket: 'PASTE_PROJECT_ID.firebasestorage.app',
  messagingSenderId: 'PASTE_SENDER_ID',
  appId: 'PASTE_APP_ID',
};

export const isFirebaseConfigured =
  !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('PASTE_');
