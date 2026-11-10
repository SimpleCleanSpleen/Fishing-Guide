import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useLocation } from './LocationContext.jsx';
import { subscribeCatches, subscribeSpots } from '../services/repository.js';
import { LOCATIONS } from '../data/locations/index.js';

const DataContext = createContext(null);
const ALL_SEED_SPOTS = LOCATIONS.flatMap((l) => l.spots.map((s) => ({ ...s, locationId: l.id })));

export function DataProvider({ children }) {
  const { user } = useAuth();
  const { location } = useLocation();
  const [catches, setCatches] = useState([]);
  const [customSpots, setCustomSpots] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setCatches([]);
      setCustomSpots([]);
      setLoaded(true);
      return undefined;
    }
    setLoaded(false);
    const onError = (e) => setError(e.message);
    const unsubC = subscribeCatches(user.uid, (items) => { setCatches(items); setLoaded(true); }, onError);
    const unsubS = subscribeSpots(user.uid, setCustomSpots, onError);
    return () => { unsubC(); unsubS(); };
  }, [user]);

  const value = useMemo(() => {
    const custom = customSpots.map((s) => ({ ...s, custom: true }));
    const everySpot = [...ALL_SEED_SPOTS, ...custom];
    // Catches/pins saved before locations existed belong to the default location.
    const inLocation = (x) => (x.locationId || 'clarksville-tn') === location.id;
    return {
      allCatches: catches,
      catches: catches.filter(inLocation),
      customSpots: custom.filter(inLocation),
      seedSpots: location.spots,
      allSpots: [...location.spots, ...custom.filter(inLocation)],
      spotById: (id) => everySpot.find((s) => s.id === id),
      loaded,
      error,
    };
  }, [catches, customSpots, loaded, error, location]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
