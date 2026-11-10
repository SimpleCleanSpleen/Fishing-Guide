import { TIME_BUCKETS } from '../data/species.js';

// Bucket a "HH:MM" time into a time of day. When sunrise/sunset are known
// (from Open-Meteo), dawn/dusk are the hour either side of them.
export function timeOfDay(hhmm, sunrise, sunset) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  const mins = h * 60 + (m || 0);
  const sr = sunrise ? toMins(sunrise) : 6 * 60 + 30;
  const ss = sunset ? toMins(sunset) : 19 * 60 + 30;
  if (mins >= sr - 60 && mins < sr + 60) return 'dawn';
  if (mins >= ss - 60 && mins < ss + 60) return 'dusk';
  if (mins >= sr + 60 && mins < 11 * 60) return 'morning';
  if (mins >= 11 * 60 && mins < 14 * 60) return 'midday';
  if (mins >= 14 * 60 && mins < ss - 60) return 'afternoon';
  return 'night';
}

function toMins(isoOrHhmm) {
  const t = isoOrHhmm.includes('T') ? isoOrHhmm.split('T')[1] : isoOrHhmm;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export const isTimeBucket = (b) => TIME_BUCKETS.includes(b);

export function todayISO(d = new Date()) {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
export function nowHHMM(d = new Date()) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
export function fmtClock(iso) {
  if (!iso) return '–';
  const [h, m] = (iso.includes('T') ? iso.split('T')[1] : iso).split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${ap}`;
}
export function fmtDate(iso) {
  if (!iso) return '';
  const [y, mo, d] = iso.split('-').map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
export function daysBetween(aISO, bISO) {
  return Math.round((new Date(bISO) - new Date(aISO)) / 86400000);
}
export function fmtWeight(lb) {
  if (lb == null || lb === '' || Number.isNaN(+lb)) return '–';
  const whole = Math.floor(lb);
  const oz = Math.round((lb - whole) * 16);
  if (oz === 16) return `${whole + 1} lb`;
  return whole ? `${whole} lb ${oz} oz` : `${oz} oz`;
}
