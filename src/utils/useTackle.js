import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { tackleFor } from '../data/tackle.js';

// The tackle box to recommend from: the owner's exact gear, or the signed-in angler's
// ticked items from the generic kit (all generic when nothing is ticked yet).
export function useTackle() {
  const { personalGear, profile } = useAuth();
  const owned = profile?.gear;
  return useMemo(() => tackleFor(personalGear, owned), [personalGear, owned]);
}
