import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import InfoTip from '../components/InfoTip.jsx';
import RequireAuth from '../components/RequireAuth.jsx';
import { Callout, PageHeader } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import SpotOptions from '../components/SpotOptions.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import { SPECIES_NAMES } from '../data/species.js';
import { useTackle } from '../utils/useTackle.js';
import { addCatch, updateCatch } from '../services/repository.js';
import { compressImage } from '../services/image.js';
import { buildConditions } from '../services/enrich.js';
import { nowHHMM, todayISO } from '../utils/time.js';

export default function LogCatch() {
  return (
    <RequireAuth reason="Sign in to log catches. They're saved to your private account and power your Insights.">
      <LogCatchForm />
    </RequireAuth>
  );
}

const EMPTY = {
  species: '', customSpecies: '', lb: '', oz: '', lengthIn: '', bait: '', customBait: '',
  spotId: '', date: todayISO(), time: nowHHMM(), notes: '', released: true, photo: null,
};

function LogCatchForm() {
  const { quickBaits } = useTackle();
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { location } = useLocation();
  const { allCatches, allSpots, spotById } = useData();
  const existing = id ? allCatches.find((c) => c.id === id) : null;

  const [form, setForm] = useState(() => ({ ...EMPTY, date: todayISO(), time: nowHHMM(), spotId: params.get('spot') || '' }));
  const [photoInfo, setPhotoInfo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const loadedId = useRef(null);

  // Load the catch being edited once it arrives from the database.
  useEffect(() => {
    if (!existing || loadedId.current === existing.id) return;
    loadedId.current = existing.id;
    const lbNum = +existing.weightLb || 0;
    const known = SPECIES_NAMES.includes(existing.species);
    const knownBait = quickBaits.includes(existing.bait);
    setForm({
      ...EMPTY,
      species: known ? existing.species : 'Other',
      customSpecies: known ? '' : existing.species,
      lb: lbNum ? String(Math.floor(lbNum)) : '',
      oz: lbNum ? String(Math.round((lbNum % 1) * 16)) : '',
      lengthIn: existing.lengthIn ?? '',
      bait: knownBait ? existing.bait : (existing.bait ? 'Other' : ''),
      customBait: knownBait ? '' : (existing.bait || ''),
      spotId: existing.spotId || '',
      date: existing.date || todayISO(),
      time: existing.time || '',
      notes: existing.notes || '',
      released: !!existing.released,
      photo: existing.photo || null,
    });
  }, [existing]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const speciesOptions = useMemo(() => {
    const local = location.commonSpecies;
    return [...local, ...SPECIES_NAMES.filter((s) => !local.includes(s) && s !== 'Other'), 'Other'];
  }, [location]);

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg(null);
    try {
      const out = await compressImage(file);
      setForm((f) => ({ ...f, photo: out.dataUrl }));
      setPhotoInfo(`${out.width}×${out.height}px · ${out.kb} KB`);
    } catch (err) {
      setMsg({ tone: 'error', text: err.message });
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    const species = form.species === 'Other' ? form.customSpecies.trim() || 'Other' : form.species;
    if (!species) { setMsg({ tone: 'error', text: 'Pick a species (choose "Other" if unsure).' }); return; }
    setBusy(true);
    setMsg(null);
    try {
      const spot = spotById(form.spotId);
      const lat = spot?.lat ?? location.center.lat;
      const lng = spot?.lng ?? location.center.lng;
      const weightLb = (+form.lb || 0) + (+form.oz || 0) / 16;
      const changedWhenWhere = !existing || existing.date !== form.date || existing.time !== form.time || existing.spotId !== form.spotId;
      const env = changedWhenWhere
        ? await buildConditions({ date: form.date, time: form.time, lat, lng }, location)
        : { conditions: existing.conditions, conditionsPending: existing.conditionsPending, timeOfDay: existing.timeOfDay };

      const data = {
        species,
        weightLb: weightLb ? +weightLb.toFixed(3) : null,
        lengthIn: form.lengthIn === '' ? null : +form.lengthIn,
        bait: form.bait === 'Other' ? form.customBait.trim() || 'Other' : form.bait || null,
        spotId: form.spotId || null,
        spotName: spot?.name || null,
        lat, lng,
        locationId: location.id,
        date: form.date,
        time: form.time || null,
        notes: form.notes.trim(),
        released: form.released,
        photo: form.photo || null,
        ...env,
      };
      if (existing) await updateCatch(user.uid, existing.id, data);
      else await addCatch(user.uid, data);
      // Clear the form: React Router keeps this page mounted while the Journal loads,
      // so a quick "log another" must not see the previous catch's values.
      setForm({ ...EMPTY, date: todayISO(), time: nowHHMM() });
      setPhotoInfo(null);
      navigate('/journal', { state: { saved: true } });
    } catch (err) {
      setMsg({ tone: 'error', text: err.message || 'Could not save. Try again.' });
    } finally {
      setBusy(false);
    }
  }

  if (id && !existing) {
    return <div className="card py-10 text-center text-slate-500">Loading catch… <Link to="/journal" className="text-river-700">Back to journal</Link></div>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={existing ? 'Edit catch' : 'Log a catch'} subtitle="Weather, pressure, moon & river level are added automatically." />
      <form onSubmit={onSubmit} className="space-y-4">
        <section className="card space-y-4">
          <div>
            <label className="label" htmlFor="species">Species *
              <InfoTip>Not sure what you caught? Snap a photo, choose &quot;Other&quot; and describe it. You can compare it with the Fish Guide later.</InfoTip>
            </label>
            <select id="species" required value={form.species} onChange={set('species')} className="input">
              <option value="">Choose a fish…</option>
              <optgroup label={`Common in ${location.name}`}>
                {speciesOptions.slice(0, location.commonSpecies.length).map((s) => <option key={s}>{s}</option>)}
              </optgroup>
              <optgroup label="Other species">
                {speciesOptions.slice(location.commonSpecies.length).map((s) => <option key={s}>{s}</option>)}
              </optgroup>
            </select>
            {form.species === 'Other' && (
              <input className="input mt-2" placeholder="What was it? (e.g. Rock Bass)" value={form.customSpecies} onChange={set('customSpecies')} maxLength={60} />
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label" htmlFor="lb">Pounds
                <InfoTip>Read the KastKing scale in lb mode. If it shows 2.35 lb, type 2.35 here and leave ounces empty, or enter lb and oz separately.</InfoTip>
              </label>
              <input id="lb" type="number" inputMode="decimal" min="0" step="0.01" className="input" value={form.lb} onChange={set('lb')} placeholder="0" />
            </div>
            <div>
              <label className="label" htmlFor="oz">Ounces</label>
              <input id="oz" type="number" inputMode="decimal" min="0" max="15.9" step="0.1" className="input" value={form.oz} onChange={set('oz')} placeholder="0" />
            </div>
            <div>
              <label className="label" htmlFor="len">Length (in)
                <InfoTip>Measure from the tip of the closed mouth to the end of the tail, with the tail pinched together. Many size limits use this &quot;total length&quot;.</InfoTip>
              </label>
              <input id="len" type="number" inputMode="decimal" min="0" step="0.25" className="input" value={form.lengthIn} onChange={set('lengthIn')} placeholder="0" />
            </div>
          </div>
        </section>

        <section className="card space-y-3">
          <label className="label">Bait / lure used
            <InfoTip>Logging the bait every time is what lets Insights find your most successful bait for each fish.</InfoTip>
          </label>
          <div className="flex flex-wrap gap-2">
            {quickBaits.map((b) => (
              <button
                type="button"
                key={b}
                onClick={() => setForm((f) => ({ ...f, bait: f.bait === b ? '' : b }))}
                className={`rounded-full px-3 py-1.5 text-sm ring-1 ${form.bait === b ? 'bg-river-700 text-white ring-river-700' : 'bg-white text-slate-700 ring-slate-300'}`}
                aria-pressed={form.bait === b}
              >
                {b}
              </button>
            ))}
          </div>
          {form.bait === 'Other' && <input className="input" placeholder="Describe the bait" value={form.customBait} onChange={set('customBait')} maxLength={80} />}
        </section>

        <section className="card space-y-4">
          <div>
            <label className="label" htmlFor="spot">Spot</label>
            <select id="spot" value={form.spotId} onChange={set('spotId')} className="input">
              <option value="">Somewhere in {location.name}</option>
              <SpotOptions spots={allSpots} />
            </select>
            <p className="mt-1 text-xs text-slate-500">Fishing somewhere new? <Link to="/map" className="font-medium text-river-700">Pin it on the map</Link> first.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="date">Date</label>
              <input id="date" type="date" required className="input" value={form.date} max={todayISO()} onChange={set('date')} />
            </div>
            <div>
              <label className="label" htmlFor="time">Time
                <InfoTip>Used to work out time of day (dawn, morning, midday, afternoon, dusk, night) using that day&apos;s real sunrise and sunset.</InfoTip>
              </label>
              <input id="time" type="time" className="input" value={form.time} onChange={set('time')} />
            </div>
          </div>
        </section>

        <section className="card space-y-3">
          <label className="label" htmlFor="photo">Photo
            <InfoTip>Photos are shrunk to 800px and compressed on your phone before saving, so they upload fast even on weak signal.</InfoTip>
          </label>
          {form.photo && (
            <div className="relative">
              <img src={form.photo} alt="Catch preview" className="max-h-72 w-full rounded-xl object-cover" />
              <button type="button" onClick={() => { setForm((f) => ({ ...f, photo: null })); setPhotoInfo(null); }} className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white">Remove</button>
            </div>
          )}
          <input id="photo" type="file" accept="image/*" capture="environment" onChange={onPhoto} className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-river-50 file:px-3 file:py-2 file:font-medium file:text-river-800" />
          {photoInfo && <p className="text-xs text-slate-500">Compressed: {photoInfo}</p>}
        </section>

        <section className="card space-y-3">
          <div>
            <label className="label" htmlFor="notes">Notes</label>
            <textarea id="notes" rows={3} className="input" value={form.notes} onChange={set('notes')} maxLength={1000} placeholder="Water clarity, depth, how it bit, what worked…" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.released} onChange={set('released')} className="h-5 w-5 rounded accent-river-700" />
            Released it 🔄
          </label>
        </section>

        {msg && <Callout tone={msg.tone === 'error' ? 'rose' : 'emerald'} icon={msg.tone === 'error' ? '⚠️' : '✅'}>{msg.text}</Callout>}

        <div className="flex gap-3">
          <button type="submit" disabled={busy} className="btn-primary flex-1 py-3 text-base">
            {busy ? 'Saving & checking weather…' : existing ? 'Save changes' : 'Save catch'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary py-3">Cancel</button>
        </div>
      </form>
    </div>
  );
}
