import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import FishIcon from './FishIcon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { deleteRecap, saveRecap, subscribeRecaps } from '../services/repository.js';
import { fmtClock, fmtDate, fmtWeight } from '../utils/time.js';

// What a shared catch keeps: no photo, notes or exact coordinates.
function summarize(c, spotById) {
  return {
    species: c.species || 'Other',
    weightLb: c.weightLb ? +c.weightLb : null,
    lengthIn: c.lengthIn ? +c.lengthIn : null,
    time: c.time || null,
    bait: c.bait || null,
    spot: spotById(c.spotId)?.name || null,
    released: c.released ?? null,
  };
}

// Order-insensitive comparison (Firestore may return map keys in a different order).
const sameCatches = (a, b) => JSON.stringify((a || []).map((o) => Object.keys(o).sort().map((k) => [k, o[k] ?? null])))
  === JSON.stringify((b || []).map((o) => Object.keys(o).sort().map((k) => [k, o[k] ?? null])));

// After the trip: everyone can share the catches they logged that day into one group recap.
export default function TripRecap({ trip }) {
  const { user, username } = useAuth();
  const { allCatches, spotById } = useData();
  const [recaps, setRecaps] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => subscribeRecaps(trip.id, setRecaps, (e) => { setErr(e.message); setRecaps([]); }), [trip.id]);

  const myDay = useMemo(
    () => allCatches.filter((c) => c.date === trip.date).sort((a, b) => (a.time || '').localeCompare(b.time || '')).map((c) => summarize(c, spotById)),
    [allCatches, trip.date, spotById],
  );
  const mine = recaps?.find((r) => r.uid === user.uid);

  // Once you've shared, keep your part of the recap in step with your log (edits, late entries).
  useEffect(() => {
    if (mine && !sameCatches(mine.catches, myDay)) {
      saveRecap(trip.id, user.uid, { name: username || mine.name, catches: myDay }).catch((e) => setErr(e.message));
    }
  }, [mine, myDay, trip.id, user.uid, username]);

  const share = () => saveRecap(trip.id, user.uid, { name: username || user.displayName || 'angler', catches: myDay }).catch((e) => setErr(e.message));
  const unshare = () => deleteRecap(trip.id, user.uid).catch((e) => setErr(e.message));

  const all = (recaps || []).flatMap((r) => r.catches.map((c) => ({ ...c, who: r.name, uid: r.uid })));
  const bySpecies = Object.entries(all.reduce((m, c) => ({ ...m, [c.species]: (m[c.species] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);
  const biggest = all.filter((c) => c.weightLb).sort((a, b) => b.weightLb - a.weightLb)[0];

  return (
    <section className="card space-y-3">
      <div>
        <h2 className="font-semibold">🏆 Trip recap</h2>
        <p className="text-xs text-slate-500">Catches each angler logged on this day and chose to share. Photos and notes stay private.</p>
      </div>

      {recaps === null ? (
        <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
      ) : all.length > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Fish caught" value={all.length} />
            <Stat label="Species" value={bySpecies.length} />
            <Stat label="Biggest" value={biggest ? fmtWeight(biggest.weightLb) : '–'} hint={biggest ? `${biggest.species} · @${biggest.who}` : null} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {bySpecies.map(([sp, n]) => (
              <span key={sp} className="chip"><FishIcon name={sp} size={22} /> {sp} ×{n}</span>
            ))}
          </div>
          <ul className="divide-y divide-slate-100">
            {recaps.filter((r) => r.catches.length).map((r) => (
              <li key={r.uid} className="py-2">
                <p className="text-sm font-semibold">@{r.name}{r.uid === user.uid && <span className="font-normal text-slate-400"> (you)</span>} · {r.catches.length} fish</p>
                <ul className="mt-1 space-y-0.5">
                  {r.catches.map((c, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <FishIcon name={c.species} size={28} className="shrink-0" />
                      <span className="min-w-0 truncate">
                        <b className="font-medium text-slate-800">{c.species}</b>
                        {c.weightLb ? ` · ${fmtWeight(c.weightLb)}` : ''}{c.lengthIn ? ` · ${c.lengthIn}"` : ''}
                        {c.time ? ` · ${fmtClock(c.time)}` : ''}{c.bait ? ` · ${c.bait}` : ''}{c.spot ? ` · ${c.spot}` : ''}
                        {c.released ? ' · released' : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="rounded-xl bg-slate-50 p-3 text-center text-sm text-slate-500">No catches shared yet.</p>
      )}

      <div className="rounded-xl bg-river-50 p-3 text-sm text-river-900">
        {mine ? (
          <p>
            You're sharing {myDay.length} catch{myDay.length === 1 ? '' : 'es'} from {fmtDate(trip.date)}. New catches you log for that day are added automatically.{' '}
            <button type="button" onClick={unshare} className="font-medium underline">Stop sharing</button>
          </p>
        ) : myDay.length ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>You logged {myDay.length} catch{myDay.length === 1 ? '' : 'es'} that day.</span>
            <button type="button" onClick={share} className="btn-primary px-3 py-1.5">Share to recap</button>
          </div>
        ) : (
          <p>No catches in your log for that day. <Link to="/log" className="font-medium underline">Log one</Link> (set the date to {fmtDate(trip.date)}) and share it here.</p>
        )}
      </div>
      {err && <p className="text-sm text-rose-600">{err}</p>}
    </section>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2">
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      {hint && <p className="truncate text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}
