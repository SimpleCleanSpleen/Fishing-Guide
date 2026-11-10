import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../firebase/init.js';

const AuthContext = createContext(null);
const DEMO_USER = { uid: 'demo-user', displayName: 'Demo Angler', email: null, photoURL: null, isDemo: true };
const DEMO_KEY = 'fishguide:demo-signed-in';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      try {
        if (localStorage.getItem(DEMO_KEY) === '1') setUser(DEMO_USER);
      } catch { /* storage blocked */ }
      setLoading(false);
      return undefined;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    error,
    isDemo: !isFirebaseConfigured,
    async signIn() {
      setError(null);
      if (!isFirebaseConfigured) {
        try { localStorage.setItem(DEMO_KEY, '1'); } catch { /* ignore */ }
        setUser(DEMO_USER);
        return;
      }
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (e) {
        // Some mobile browsers block pop-ups; fall back to a full-page redirect.
        if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') {
          await signInWithRedirect(auth, googleProvider);
        } else if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
          setError(e.code === 'auth/unauthorized-domain'
            ? 'This website isn\'t on your Firebase "Authorized domains" list yet. See README step 7.'
            : e.message);
        }
      }
    },
    async signOut() {
      if (!isFirebaseConfigured) {
        try { localStorage.removeItem(DEMO_KEY); } catch { /* ignore */ }
        setUser(null);
        return;
      }
      await fbSignOut(auth);
    },
  }), [user, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
