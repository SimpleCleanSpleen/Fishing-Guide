import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import RequireAuth from '../components/RequireAuth.jsx';
import SpotOptions from '../components/SpotOptions.jsx';
import { FishForecast, SupplyList, useTripForecast, WeatherSummary } from '../components/TripForecast.jsx';
import { Callout, PageHeader } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import { getLocation, LOCATIONS } from '../data/locations/index.js';
import { addTrip, findAngler, updateTrip } from '../services/repository.js';
import { todayISO } from '../utils/time.js';

function nextSaturday() {
  const d = new Date();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
  return todayISO(d);
}

export default function TripForm() {
  const { id } = useParams();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={id ? 'Edit trip' : 'Plan a trip'} subtitle="We'll forecast what's biting and build your packing list." />
      <RequireAuth reason="Sign in to plan trips and invite friends.">
        <Gate id={id} />
      </RequireAuth>
    </div>
  );
}

function Gate({ id }) {
  const { username, profile } = useAuth();
  const { trips, loaded } = useData();
  if (profile === null || !loaded) return <div className="card animate-pulse py-10 text-center text-slate-400">Loading…</div>;
  if (!username) {
    return (
      <Callout tone="sky" icon="👋" title="Pick a username first">
        Invited anglers see who planned the trip by your username.{' '}
        <Link to={`/profile?next=${encodeURIComponent(id ? `/trips/${id}/edit` : '/trips/new')}`} className="font-semibold underline">Choose one</Link>
      </Callout>
    );
  }
  const existing = id ? trips.find((t) => t.id === id) : null;
  if (id && !existing) return <Callout tone="amber" icon="🤷">Trip not found. <Link to="/trips" className="underline">Back to trips</Link></Callout>;
  return <Form key={id || 'new'} existing={existing} />;
}

function Form({ existing }) {
  const { user, username } = useAuth();
  const { location: current } = useLocation();
  const { allSpots, spotById } = useData();
  const navigate = useNavigate();

  const [f, setF] = useState(() => ({
    title: existing?.title || '',
    date: existing?.date || nextSaturday(),
    time: existing?.time || '06:30',
    hours: existing?.hours || 3,
    locationId: existing?.locationId || current.id,
    spotId: existing?.spotId || '',
    notes: existing?.notes || '',
  }));
  const [people, setPeople] = useState(() => (existing
    ? Object.entries(existing.people || {}).filter(([uid]) => uid !== user.uid).map(([uid, name]) => ({ uid, name }))
    : []));
  const [invite, setInvite] = useState('');
  const [inviteErr, setInviteErr] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const loc = getLocation(f.locationId);
  const spots = f.locationId === current.id ? allSpots : loc.spots;
  const spot = f.spotId ? (spotById(f.spotId) || (existing?.spotId === f.spotId ? { name: existing.spotName, lat: existing.lat, lng: existing.lng, species: existing.spotSpecies } : null)) : null;
  const placeName = spot?.name || loc.name;

  const draft = useMemo(() => ({
    ...f,
    lat: spot?.lat ?? null,
    lng: spot?.lng ?? null,
    spotSpecies: spot?.species || [],
  }), [f, spot?.lat, spot?.lng, spot?.species]);
  const forecast = useTripForecast(draft);

  async function addInvite(e) {
    e?.preventDefault();
    setInviteErr(null);
    const name = invite.trim().replace(/^@/, '');
    if (!name) return;
    if (name.toLowerCase() === username.toLowerCase()) { setInviteErr("That's you! You're already on the trip."); return; }
    if (people.some((p) => p.name.toLowerCase() === name.toLowerCase())) { setInvite(''); return; }
    if (people.length >= 29) { setInviteErr('Trips can have up to 30 anglers.'); return; }
    try {
      const found = await findAngler(name);
      if (!found) { setInviteErr(`No angler named @${name}. Check the spelling, or ask them to pick a username on their profile page.`); return; }
      setPeople((p) => [...p, { uid: found.uid, name: found.name }]);
      setInvite('');
    } catch (e2) {
      setInviteErr(e2.message);
    }
  }

  async function save(e) {
    e.preventDefault();
    setErr(null);
    if (!f.date) { setErr('Pick a date.'); return; }
    const title = f.title.trim() || `Fishing at ${placeName}`;
    const peopleMap = { [user.uid]: username, ...Object.fromEntries(people.map((p) => [p.uid, p.name])) };
    const members = Object.keys(peopleMap);
    // Keep existing RSVPs for people still invited; the organizer is always going.
    const rsvp = Object.fromEntries(members.filter((uid) => existing?.rsvp?.[uid]).map((uid) => [uid, existing.rsvp[uid]]));
    rsvp[user.uid] = 'going';
    const data = {
      ownerUid: user.uid,
      ownerName: username,
      title: title.slice(0, 80),
      date: f.date,
      time: f.time || '06:30',
      hours: Number(f.hours) || 3,
      locationId: f.locationId,
      spotId: f.spotId || null,
      spotName: spot?.name || null,
      lat: spot?.lat ?? null,
      lng: spot?.lng ?? null,
      spotSpecies: spot?.species || [],
      notes: f.notes.trim().slice(0, 1000),
      members,
      people: peopleMap,
      rsvp,
    };
    setBusy(true);
    try {
      const id = existing ? (await updateTrip(existing.id, data), existing.id) : await addTrip(data);
      navigate(`/trips/${id}`);
    } catch (e2) {
      setErr(e2.message);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={save} className="card space-y-3">
        <Field label="Trip name" htmlFor="title">
          <input id="title" className="input" value={f.title} onChange={set('title')} placeholder={`Fishing at ${placeName}`} maxLength={80} />
        </Field>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Date" htmlFor="date">
            <input id="date" type="date" className="input" value={f.date} min={existing ? undefined : todayISO()} onChange={set('date')} required />
          </Field>
          <Field label="Start time" htmlFor="time">
            <input id="time" type="time" className="input" value={f.time} onChange={set('time')} />
          </Field>
          <Field label="How long" htmlFor="hours">
            <select id="hours" className="input" value={f.hours} onChange={set('hours')}>
              {[1, 2, 3, 4, 6, 8, 12].map((h) => <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Area" htmlFor="loc">
            <select id="loc" className="input" value={f.locationId} onChange={(e) => setF((x) => ({ ...x, locationId: e.target.value, spotId: '' }))}>
              {LOCATIONS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </Field>
          <Field label="Spot" htmlFor="spot">
            <select id="spot" className="input" value={f.spotId} onChange={set('spotId')}>
              <option value="">Somewhere in {loc.name}</option>
              <SpotOptions spots={spots} />
              {existing?.spotId && !spots.some((s) => s.id === existing.spotId) && <option value={existing.spotId}>{existing.spotName}</option>}
            </select>
          </Field>
        </div>
        {spot && !spot.shared && spot.custom && people.length > 0 && (
          <p className="text-xs text-slate-500">🔒 This is a private spot. Invited anglers will see its name and location on this trip.</p>
        )}

        <Field label="Invite anglers" htmlFor="invite">
          <div className="flex gap-2">
            <div className="flex flex-1 items-center rounded-xl ring-1 ring-slate-300 focus-within:ring-2 focus-within:ring-river-500">
              <span className="pl-3 text-slate-400">@</span>
              <input
                id="invite"
                className="w-full bg-transparent py-2.5 pr-3 outline-none"
                value={invite}
                onChange={(e) => setInvite(e.target.value.replace(/\s/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') addInvite(e); }}
                placeholder="username"
                autoCapitalize="none"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <button type="button" onClick={addInvite} className="btn-secondary">Invite</button>
          </div>
        </Field>
        {inviteErr && <p className="text-sm text-rose-600">{inviteErr}</p>}
        <div className="flex flex-wrap gap-1.5">
          <span className="chip bg-river-50">⭐ @{username} (you)</span>
          {people.map((p) => (
            <span key={p.uid} className="chip">
              @{p.name}
              <button type="button" onClick={() => setPeople((x) => x.filter((y) => y.uid !== p.uid))} className="ml-1 text-slate-400 hover:text-rose-600" aria-label={`Remove @${p.name}`}>✕</button>
            </span>
          ))}
        </div>

        <Field label="Notes" htmlFor="notes">
          <textarea id="notes" className="input" rows={2} value={f.notes} onChange={set('notes')} placeholder="Meet at the boat ramp parking lot, carpool from…" maxLength={1000} />
        </Field>
        {err && <p className="text-sm text-rose-600">{err}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="btn-primary flex-1">{busy ? 'Saving…' : existing ? 'Save changes' : people.length ? `Create trip & invite ${people.length}` : 'Create trip'}</button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
        </div>
      </form>

      {forecast && (
        <section className="card space-y-4">
          <h2 className="font-semibold">🔮 Forecast preview for {placeName}</h2>
          <WeatherSummary forecast={forecast} date={f.date} />
          <FishForecast forecast={forecast} limit={4} />
          <details>
            <summary className="cursor-pointer text-sm font-semibold text-river-700">Packing list ({forecast.supplies.reduce((n, g) => n + g.items.length, 0)} items)</summary>
            <div className="mt-2"><SupplyList forecast={forecast} /></div>
          </details>
        </section>
      )}
    </div>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-semibold">{label}</label>
      {children}
    </div>
  );
}
