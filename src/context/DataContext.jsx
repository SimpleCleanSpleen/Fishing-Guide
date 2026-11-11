import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useLocation } from './LocationContext.jsx';
import { subscribeCatches, subscribeSharedSpots, subscribeSpots, subscribeTrips } from '../services/repository.js';
import { LOCATIONS } from '../data/locations/index.js';

const DataContext = createContext(null);
const CHAT_SEEN_KEY = 'fishguide:chatSeen';
const ALL_SEED_SPOTS = LOCATIONS.flatMap((l) => l.spots.map((s) => ({ ...s, locationId: l.id })));

export function DataProvider({ children }) {
  const { user } = useAuth();
  const { location } = useLocation();
  const [catches, setCatches] = useState([]);
  const [customSpots, setCustomSpots] = useState([]);
  const [sharedSpots, setSharedSpots] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loaded, setLoaded] = useState(false);
  // When you last read each trip's chat (this device only): { tripId: millis }.
  const [chatSeen, setChatSeen] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CHAT_SEEN_KEY)) || {}; } catch { return {}; }
  });
  const markChatSeen = useCallback((tripId, at) => {
    setChatSeen((s) => {
      if ((s[tripId] || 0) >= at) return s;
      const next = { ...s, [tripId]: at };
      try { localStorage.setItem(CHAT_SEEN_KEY, JSON.stringify(next)); } catch { /* storage off */ }
      return next;
    });
  }, []);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setCatches([]);
      setCustomSpots([]);
      setTrips([]);
      setLoaded(true);
      return undefined;
    }
    setLoaded(false);
    const onError = (e) => setError(e.message);
    const unsubC = subscribeCatches(user.uid, (items) => { setCatches(items); setLoaded(true); }, onError);
    const unsubS = subscribeSpots(user.uid, setCustomSpots, onError);
    const unsubT = subscribeTrips(user.uid, setTrips, onError);
    return () => { unsubC(); unsubS(); unsubT(); };
  }, [user]);

  // Spots other anglers shared are public, so they load even when signed out.
  useEffect(() => subscribeSharedSpots(location.id, setSharedSpots, () => setSharedSpots([])), [location.id]);

  const value = useMemo(() => {
    const custom = customSpots.map((s) => ({ ...s, custom: true }));
    const shared = sharedSpots.map((s) => ({ ...s, shared: true, custom: s.ownerUid === user?.uid }));
    const mine = [...custom.filter((s) => (s.locationId || 'clarksville-tn') === location.id), ...shared.filter((s) => s.custom)];
    const community = shared.filter((s) => !s.custom);
    const everySpot = [...ALL_SEED_SPOTS, ...custom, ...shared];
    // Catches/pins saved before locations existed belong to the default location.
    const inLocation = (x) => (x.locationId || 'clarksville-tn') === location.id;
    return {
      allCatches: catches,
      catches: catches.filter(inLocation),
      customSpots: mine,
      communitySpots: community,
      seedSpots: location.spots,
      allSpots: [...location.spots, ...mine, ...community],
      spotById: (id) => everySpot.find((s) => s.id === id),
      trips: [...trips].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
      unreadChat: (t) => !!t.lastMessage && t.lastMessage.uid !== user?.uid && t.lastMessage.at > (chatSeen[t.id] || 0),
      unreadChats: trips.filter((t) => t.lastMessage && t.lastMessage.uid !== user?.uid && t.lastMessage.at > (chatSeen[t.id] || 0)).length,
      markChatSeen,
      pendingInvites: trips.filter((t) => t.ownerUid !== user?.uid && !['going', 'maybe', 'declined'].includes(t.rsvp?.[user?.uid])).length,
      loaded,
      error,
    };
  }, [catches, customSpots, sharedSpots, trips, user, loaded, error, location, chatSeen, markChatSeen]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
