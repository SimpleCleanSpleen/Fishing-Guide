import { createContext, useContext, useMemo, useState } from 'react';
import { DEFAULT_LOCATION_ID, getLocation, LOCATIONS } from '../data/locations/index.js';

const LocationContext = createContext(null);
const KEY = 'fishguide:location';

export function LocationProvider({ children }) {
  const [id, setId] = useState(() => {
    try { return localStorage.getItem(KEY) || DEFAULT_LOCATION_ID; } catch { return DEFAULT_LOCATION_ID; }
  });
  const value = useMemo(() => ({
    location: getLocation(id),
    locations: LOCATIONS,
    setLocationId(next) {
      setId(next);
      try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
    },
  }), [id]);
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export const useLocation = () => useContext(LocationContext);
