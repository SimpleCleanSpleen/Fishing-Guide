import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { tackleFor } from '../data/tackle.js';

// The tackle box to recommend from: the owner's exact gear, or a generic starter kit.
export function useTackle() {
  const { personalGear } = useAuth();
  return useMemo(() => tackleFor(personalGear), [personalGear]);
}
