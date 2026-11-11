// Data access layer. Components never talk to Firestore directly; they call these
// functions, which use Cloud Firestore when Firebase is configured and fall back to
// browser localStorage in demo mode. Collections:
//   anglers/{uid}                    your profile ({ username, gear: { gearId: 'brand/model' } })
//   anglers/{uid}/catches/{catchId}
//   anglers/{uid}/spots/{spotId}     private pins
//   anglerNames/{lowercase name}     claims a unique username ({ uid, name })
//   trips/{tripId}                   shared by the organizer and invited anglers (members[])
//   trips/{tripId}/messages/{msgId}  trip chat, readable by the trip's members
//   trips/{tripId}/recaps/{uid}      catches a member chose to share from the trip day
//   sharedSpots/{spotId}             pins people chose to share, with their username
// (The Firebase project is shared with Zombie Evac, which uses users/{uid}; the
// separate top-level collection keeps the two apps' data apart.)
import {
  collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where, writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/init.js';

// ---------- Firestore implementation ----------
const ROOT = 'anglers';
const fsCol = (uid, name) => collection(db, ROOT, uid, name);

function fsSubscribe(uid, name, cb, onError) {
  const q = query(fsCol(uid, name), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: toMillis(d.data().createdAt) })));
  }, onError);
}

function toMillis(ts) {
  if (!ts) return Date.now(); // pending server timestamp (offline write)
  if (typeof ts === 'number') return ts;
  return ts.toMillis ? ts.toMillis() : Date.now();
}

// Writes resolve immediately from the local cache when offline, so don't block the UI
// on the network round-trip: Firestore queues them and syncs later.
const fsAdd = (uid, name, data) => {
  const ref = doc(fsCol(uid, name));
  const p = setDoc(ref, { ...stripUndefined(data), createdAt: serverTimestamp() });
  return settle(p).then(() => ref.id);
};
const fsUpdate = (uid, name, id, data) => {
  const p = updateDoc(doc(db, ROOT, uid, name, id), { ...stripUndefined(data), updatedAt: serverTimestamp() });
  return settle(p);
};
const fsDelete = (uid, name, id) => {
  const p = deleteDoc(doc(db, ROOT, uid, name, id));
  return settle(p);
};

// Resolve when the server confirms, or after 2 s if we're offline (Firestore keeps the
// write queued and syncs later). Failures that arrive after that (e.g. rules) are logged.
function settle(p) {
  p.catch((e) => console.warn('Firestore write failed:', e));
  return Promise.race([p, new Promise((resolve) => { setTimeout(resolve, 2000); })]);
}

function stripUndefined(obj) {
  return JSON.parse(JSON.stringify(obj, (_, v) => (v === undefined ? null : v)));
}

// ---------- localStorage (demo mode) implementation ----------
const listeners = new Map(); // key -> Set<cb>
const lsKey = (uid, name) => `fishguide:${uid}:${name}`;

function lsRead(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function lsWrite(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    throw new Error('This browser is out of storage space for demo mode. Remove a photo or set up Firebase (see README).');
  }
  (listeners.get(key) || []).forEach((cb) => cb(items));
}
function lsSubscribe(uid, name, cb) {
  const key = lsKey(uid, name);
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(cb);
  cb(lsRead(key));
  return () => listeners.get(key).delete(cb);
}
const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
async function lsAdd(uid, name, data) {
  const key = lsKey(uid, name);
  const item = { ...data, id: newId(), createdAt: Date.now() };
  lsWrite(key, [item, ...lsRead(key)]);
  return item.id;
}
async function lsUpdate(uid, name, id, data) {
  const key = lsKey(uid, name);
  lsWrite(key, lsRead(key).map((it) => (it.id === id ? { ...it, ...data, updatedAt: Date.now() } : it)));
}
async function lsDelete(uid, name, id) {
  const key = lsKey(uid, name);
  lsWrite(key, lsRead(key).filter((it) => it.id !== id));
}

// ---------- Usernames, trips & shared spots (Firestore) ----------
export const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
const nameId = (name) => name.trim().toLowerCase();
const withId = (d) => ({ id: d.id, ...d.data(), createdAt: toMillis(d.data().createdAt) });

const fsSocial = {
  subscribeProfile: (uid, cb, onError) => onSnapshot(doc(db, ROOT, uid), (snap) => cb(snap.data() || {}), onError),
  // mergeFields replaces the whole gear map, so un-ticked items really disappear.
  saveGear: (uid, gear) => settle(setDoc(doc(db, ROOT, uid), { gear }, { mergeFields: ['gear'] })),
  async findAngler(name) {
    const snap = await getDoc(doc(db, 'anglerNames', nameId(name)));
    return snap.exists() ? snap.data() : null;
  },
  async claimUsername(uid, name, oldName) {
    const taken = await fsSocial.findAngler(name);
    if (taken && taken.uid !== uid) throw new Error(`@${taken.name} is already taken. Try another name.`);
    // The rules only accept a name your profile points to, so write both together.
    const batch = writeBatch(db);
    batch.set(doc(db, ROOT, uid), { username: name }, { merge: true });
    if (taken) batch.update(doc(db, 'anglerNames', nameId(name)), { name });
    else batch.set(doc(db, 'anglerNames', nameId(name)), { uid, name });
    if (oldName && nameId(oldName) !== nameId(name)) batch.delete(doc(db, 'anglerNames', nameId(oldName)));
    await batch.commit();
  },
  subscribeTrips(uid, cb, onError) {
    const q = query(collection(db, 'trips'), where('members', 'array-contains', uid));
    return onSnapshot(q, (snap) => cb(snap.docs.map(withId)), onError);
  },
  addTrip(data) {
    const ref = doc(collection(db, 'trips'));
    return settle(setDoc(ref, { ...stripUndefined(data), createdAt: serverTimestamp() })).then(() => ref.id);
  },
  updateTrip: (id, data) => settle(updateDoc(doc(db, 'trips', id), { ...stripUndefined(data), updatedAt: serverTimestamp() })),
  setRsvp: (id, uid, status) => settle(updateDoc(doc(db, 'trips', id), { [`rsvp.${uid}`]: status, updatedAt: serverTimestamp() })),
  async deleteTrip(id) {
    // Remove the chat and recaps first: the rules check trip ownership, which needs the trip to exist.
    for (const sub of ['messages', 'recaps']) {
      const snap = await getDocs(collection(db, 'trips', id, sub));
      for (let i = 0; i < snap.docs.length; i += 400) {
        const batch = writeBatch(db);
        snap.docs.slice(i, i + 400).forEach((m) => batch.delete(m.ref));
        await batch.commit();
      }
    }
    return settle(deleteDoc(doc(db, 'trips', id)));
  },
  subscribeMessages(tripId, cb, onError) {
    const q = query(collection(db, 'trips', tripId, 'messages'), orderBy('createdAt', 'desc'), limit(200));
    return onSnapshot(q, (snap) => cb(snap.docs.map(withId).reverse()), onError);
  },
  async sendMessage(tripId, { uid, name, text }) {
    const ref = doc(collection(db, 'trips', tripId, 'messages'));
    const at = Date.now();
    const batch = writeBatch(db);
    batch.set(ref, { uid, name, text, createdAt: serverTimestamp() });
    // A preview on the trip itself powers the "new messages" badge without extra reads.
    batch.update(doc(db, 'trips', tripId), { lastMessage: { uid, name, text: text.slice(0, 80), at } });
    return settle(batch.commit());
  },
  deleteMessage: (tripId, id) => settle(deleteDoc(doc(db, 'trips', tripId, 'messages', id))),
  subscribeRecaps: (tripId, cb, onError) => onSnapshot(collection(db, 'trips', tripId, 'recaps'), (snap) => cb(snap.docs.map((d) => ({ uid: d.id, ...d.data() }))), onError),
  saveRecap: (tripId, uid, data) => settle(setDoc(doc(db, 'trips', tripId, 'recaps', uid), { ...stripUndefined(data), updatedAt: serverTimestamp() })),
  deleteRecap: (tripId, uid) => settle(deleteDoc(doc(db, 'trips', tripId, 'recaps', uid))),
  subscribeSharedSpots(locationId, cb, onError) {
    const q = query(collection(db, 'sharedSpots'), where('locationId', '==', locationId));
    return onSnapshot(q, (snap) => cb(snap.docs.map(withId)), onError);
  },
  addSharedSpot(data) {
    const ref = doc(collection(db, 'sharedSpots'));
    return settle(setDoc(ref, { ...stripUndefined(data), createdAt: serverTimestamp() })).then(() => ref.id);
  },
  deleteSharedSpot: (id) => settle(deleteDoc(doc(db, 'sharedSpots', id))),
};

// ---------- Usernames, trips & shared spots (demo mode) ----------
// One shared list per kind in localStorage; "other anglers" only exist in this browser.
function lsList(key) {
  return {
    read: () => lsRead(key),
    write: (items) => lsWrite(key, items),
    subscribe(cb, filter = () => true) {
      if (!listeners.has(key)) listeners.set(key, new Set());
      const wrapped = (items) => cb(items.filter(filter));
      listeners.get(key).add(wrapped);
      wrapped(lsRead(key));
      return () => listeners.get(key).delete(wrapped);
    },
  };
}
const lsNames = lsList('fishguide:names');
const lsTrips = lsList('fishguide:trips');
const lsShared = lsList('fishguide:sharedSpots');
const lsProfiles = lsList('fishguide:profiles');
const lsMessages = lsList('fishguide:tripMessages');
const lsRecaps = lsList('fishguide:tripRecaps');

const lsSocial = {
  subscribeProfile: (uid, cb) => lsProfiles.subscribe((items) => cb(items.find((p) => p.id === uid) || {})),
  async saveGear(uid, gear) {
    const prev = lsProfiles.read().find((p) => p.id === uid) || {};
    lsProfiles.write([...lsProfiles.read().filter((p) => p.id !== uid), { ...prev, id: uid, gear }]);
  },
  findAngler: async (name) => lsNames.read().find((n) => n.id === nameId(name)) || null,
  async claimUsername(uid, name, oldName) {
    const taken = lsNames.read().find((n) => n.id === nameId(name));
    if (taken && taken.uid !== uid) throw new Error(`@${taken.name} is already taken. Try another name.`);
    const keep = lsNames.read().filter((n) => n.id !== nameId(name) && (!oldName || n.id !== nameId(oldName)));
    lsNames.write([...keep, { id: nameId(name), uid, name }]);
    const prev = lsProfiles.read().find((p) => p.id === uid) || {};
    lsProfiles.write([...lsProfiles.read().filter((p) => p.id !== uid), { ...prev, id: uid, username: name }]);
  },
  subscribeTrips: (uid, cb) => lsTrips.subscribe(cb, (t) => t.members?.includes(uid)),
  async addTrip(data) {
    const id = newId();
    lsTrips.write([{ ...data, id, createdAt: Date.now() }, ...lsTrips.read()]);
    return id;
  },
  async updateTrip(id, data) { lsTrips.write(lsTrips.read().map((t) => (t.id === id ? { ...t, ...data, updatedAt: Date.now() } : t))); },
  async setRsvp(id, uid, status) { lsTrips.write(lsTrips.read().map((t) => (t.id === id ? { ...t, rsvp: { ...t.rsvp, [uid]: status } } : t))); },
  async deleteTrip(id) {
    lsMessages.write(lsMessages.read().filter((m) => m.tripId !== id));
    lsRecaps.write(lsRecaps.read().filter((r) => r.tripId !== id));
    lsTrips.write(lsTrips.read().filter((t) => t.id !== id));
  },
  subscribeMessages: (tripId, cb) => lsMessages.subscribe(cb, (m) => m.tripId === tripId),
  async sendMessage(tripId, { uid, name, text }) {
    const at = Date.now();
    lsMessages.write([...lsMessages.read(), { id: newId(), tripId, uid, name, text, createdAt: at }]);
    lsTrips.write(lsTrips.read().map((t) => (t.id === tripId ? { ...t, lastMessage: { uid, name, text: text.slice(0, 80), at } } : t)));
  },
  async deleteMessage(tripId, id) { lsMessages.write(lsMessages.read().filter((m) => m.id !== id)); },
  subscribeRecaps: (tripId, cb) => lsRecaps.subscribe(cb, (r) => r.tripId === tripId),
  async saveRecap(tripId, uid, data) {
    lsRecaps.write([...lsRecaps.read().filter((r) => !(r.tripId === tripId && r.uid === uid)), { ...data, tripId, uid, updatedAt: Date.now() }]);
  },
  async deleteRecap(tripId, uid) { lsRecaps.write(lsRecaps.read().filter((r) => !(r.tripId === tripId && r.uid === uid))); },
  subscribeSharedSpots: (locationId, cb) => lsShared.subscribe(cb, (s) => s.locationId === locationId),
  async addSharedSpot(data) {
    const id = newId();
    lsShared.write([{ ...data, id, createdAt: Date.now() }, ...lsShared.read()]);
    return id;
  },
  async deleteSharedSpot(id) { lsShared.write(lsShared.read().filter((s) => s.id !== id)); },
};

// ---------- Public API ----------
const impl = isFirebaseConfigured
  ? { subscribe: fsSubscribe, add: fsAdd, update: fsUpdate, remove: fsDelete }
  : { subscribe: lsSubscribe, add: lsAdd, update: lsUpdate, remove: lsDelete };

export const subscribeCatches = (uid, cb, onError) => impl.subscribe(uid, 'catches', cb, onError);
export const addCatch = (uid, data) => impl.add(uid, 'catches', data);
export const updateCatch = (uid, id, data) => impl.update(uid, 'catches', id, data);
export const deleteCatch = (uid, id) => impl.remove(uid, 'catches', id);

export const subscribeSpots = (uid, cb, onError) => impl.subscribe(uid, 'spots', cb, onError);
export const addSpot = (uid, data) => impl.add(uid, 'spots', data);
export const updateSpot = (uid, id, data) => impl.update(uid, 'spots', id, data);
export const deleteSpot = (uid, id) => impl.remove(uid, 'spots', id);

const social = isFirebaseConfigured ? fsSocial : lsSocial;
export const subscribeProfile = (uid, cb, onError) => social.subscribeProfile(uid, cb, onError);
export const findAngler = (name) => social.findAngler(name);
export const saveGear = (uid, gear) => social.saveGear(uid, gear);
export function claimUsername(uid, name, oldName) {
  if (!USERNAME_RE.test(name)) return Promise.reject(new Error('Use 3-20 letters, numbers or underscores.'));
  return social.claimUsername(uid, name.trim(), oldName);
}

export const subscribeTrips = (uid, cb, onError) => social.subscribeTrips(uid, cb, onError);
export const addTrip = (data) => social.addTrip(data);
export const updateTrip = (id, data) => social.updateTrip(id, data);
export const setRsvp = (id, uid, status) => social.setRsvp(id, uid, status);
export const deleteTrip = (id) => social.deleteTrip(id);

export const subscribeMessages = (tripId, cb, onError) => social.subscribeMessages(tripId, cb, onError);
export function sendMessage(tripId, msg) {
  const text = msg.text.trim().slice(0, 1000);
  if (!text) return Promise.resolve();
  return social.sendMessage(tripId, { ...msg, text });
}
export const deleteMessage = (tripId, id) => social.deleteMessage(tripId, id);

export const subscribeRecaps = (tripId, cb, onError) => social.subscribeRecaps(tripId, cb, onError);
export const saveRecap = (tripId, uid, data) => social.saveRecap(tripId, uid, data);
export const deleteRecap = (tripId, uid) => social.deleteRecap(tripId, uid);

export const subscribeSharedSpots = (locationId, cb, onError) => social.subscribeSharedSpots(locationId, cb, onError);
export const addSharedSpot = (data) => social.addSharedSpot(data);
export const deleteSharedSpot = (id) => social.deleteSharedSpot(id);
