// Data access layer. Components never talk to Firestore directly; they call these
// functions, which use Cloud Firestore when Firebase is configured and fall back to
// browser localStorage in demo mode. Collections:
//   anglers/{uid}/catches/{catchId}
//   anglers/{uid}/spots/{spotId}
// (The Firebase project is shared with Zombie Evac, which uses users/{uid}; the
// separate top-level collection keeps the two apps' data apart.)
import {
  collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc,
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

// Writes that fail after we stopped waiting (e.g. rules rejected them) are logged.
function settle(p) {
  p.catch((e) => console.warn('Firestore write failed:', e));
  return settle(p);
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
