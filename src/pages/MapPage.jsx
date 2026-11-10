import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import InfoTip from '../components/InfoTip.jsx';
import { Badge, Callout, PageHeader } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import { addSpot, deleteSpot } from '../services/repository.js';

// Emoji pins via divIcon: no image files, so nothing breaks under the GitHub Pages base path.
const pin = (color, emoji, active) => L.divIcon({
  className: 'spot-pin',
  html: `<div style="display:flex;align-items:center;justify-content:center;width:${active ? 40 : 32}px;height:${active ? 40 : 32}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)"><span style="transform:rotate(45deg);font-size:${active ? 18 : 15}px">${emoji}</span></div>`,
  iconSize: [active ? 40 : 32, active ? 40 : 32],
  iconAnchor: [active ? 20 : 16, active ? 40 : 32],
  popupAnchor: [0, active ? -38 : -30],
});
const SEED_ICON = pin('#0f766e', '🎣');
const SEED_ICON_ACTIVE = pin('#0f766e', '🎣', true);
const MY_ICON = pin('#ea580c', '⭐');
const MY_ICON_ACTIVE = pin('#ea580c', '⭐', true);
const DRAFT_ICON = pin('#7c3aed', '📍', true);

export default function MapPage() {
  const { user } = useAuth();
  const { location } = useLocation();
  const { seedSpots, customSpots } = useData();
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState(null); // { lat, lng }
  const [filter, setFilter] = useState('all');
  const [map, setMap] = useState(null);

  const spots = useMemo(() => {
    const all = [...seedSpots, ...customSpots];
    return filter === 'mine' ? customSpots : filter === 'suggested' ? seedSpots : all;
  }, [seedSpots, customSpots, filter]);

  function focus(s) {
    setSelected(s.id);
    map?.flyTo([s.lat, s.lng], 14, { duration: 0.8 });
  }

  return (
    <div>
      <PageHeader title="Fishing Map" subtitle={`${seedSpots.length} suggested spots around ${location.name}${customSpots.length ? ` · ${customSpots.length} of yours` : ''}`} />
      <Callout tone="amber" icon="⚠️" className="mb-3">
        {location.spotsNotice}
      </Callout>

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="card self-start overflow-hidden p-0">
          <div className="h-[60vh] min-h-80 w-full">
            <MapContainer center={[location.center.lat, location.center.lng]} zoom={location.zoom} className="h-full w-full" ref={setMap} scrollWheelZoom>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
              <Recenter center={location.center} zoom={location.zoom} />
              {user && <ClickToPin onPick={setDraft} />}
              {spots.map((s) => (
                <Marker
                  key={s.id}
                  position={[s.lat, s.lng]}
                  icon={s.custom ? (selected === s.id ? MY_ICON_ACTIVE : MY_ICON) : (selected === s.id ? SEED_ICON_ACTIVE : SEED_ICON)}
                  eventHandlers={{ click: () => setSelected(s.id) }}
                >
                  <Popup><SpotPopup s={s} /></Popup>
                </Marker>
              ))}
              {draft && <Marker position={[draft.lat, draft.lng]} icon={DRAFT_ICON} />}
            </MapContainer>
          </div>
          <p className="flex items-center gap-1 border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
            {user ? 'Tap anywhere on the map to drop a pin for your own spot.' : 'Sign in to pin and save your own spots.'}
            <InfoTip>Your pins are saved privately to your account. Map tiles you&apos;ve viewed are cached so the map still shows with weak signal.</InfoTip>
          </p>
        </div>

        <aside className="space-y-3">
          {user && <AddSpotForm draft={draft} setDraft={setDraft} map={map} onSaved={() => setFilter('all')} />}

          <div className="card p-3">
            <div className="mb-2 flex gap-1 text-xs font-medium">
              {[['all', 'All'], ['suggested', 'Suggested'], ['mine', 'My spots']].map(([k, label]) => (
                <button key={k} type="button" onClick={() => setFilter(k)} className={`rounded-full px-3 py-1 ${filter === k ? 'bg-river-700 text-white' : 'bg-slate-100 text-slate-600'}`}>{label}</button>
              ))}
            </div>
            <ul className="max-h-[50vh] divide-y divide-slate-100 overflow-y-auto">
              {spots.map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => focus(s)} className={`w-full px-1 py-2 text-left ${selected === s.id ? 'bg-river-50' : 'hover:bg-slate-50'}`}>
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span aria-hidden>{s.custom ? '⭐' : '🎣'}</span>{s.name}
                    </span>
                    <span className="block pl-6 text-xs text-slate-500">{s.type}{s.species?.length ? ` · ${s.species.slice(0, 3).join(', ')}` : ''}</span>
                  </button>
                </li>
              ))}
              {!spots.length && <li className="py-4 text-center text-sm text-slate-500">No spots here yet.</li>}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Recenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => { map.setView([center.lat, center.lng], zoom); }, [center.lat, center.lng, zoom, map]);
  return null;
}

function ClickToPin({ onPick }) {
  useMapEvents({ click: (e) => onPick({ lat: +e.latlng.lat.toFixed(5), lng: +e.latlng.lng.toFixed(5) }) });
  return null;
}

function SpotPopup({ s }) {
  const { user } = useAuth();
  const directions = `https://www.openstreetmap.org/directions?to=${s.lat}%2C${s.lng}`;
  return (
    <div className="w-60 space-y-1.5 text-sm">
      <p className="text-base font-semibold">{s.name}</p>
      <div className="flex flex-wrap gap-1">
        {s.type && <Badge tone="river">{s.type}</Badge>}
        {s.approximate && <Badge tone="amber">Approximate: verify before visiting</Badge>}
        {s.custom && <Badge tone="amber">My spot</Badge>}
      </div>
      {(s.description || s.notes) && <p className="!my-1 text-slate-600">{s.description || s.notes}</p>}
      {s.species?.length > 0 && <p className="!my-1"><b>Fish:</b> {s.species.join(', ')}</p>}
      {s.beginnerTip && <p className="!my-1 rounded-lg bg-river-50 p-2 text-river-900">💡 {s.beginnerTip}</p>}
      {s.advisory && <p className="!my-1 rounded-lg bg-amber-50 p-2 text-amber-900">⚠️ {s.advisory} <Link to="/learn/safety">Details</Link></p>}
      {s.access && <p className="!my-1 text-xs text-slate-500">Access: {s.access}{s.amenities?.length ? ` · ${s.amenities.join(', ')}` : ''}</p>}
      <p className="!my-1 text-xs text-slate-400">{s.lat.toFixed(4)}, {s.lng.toFixed(4)}</p>
      <div className="flex flex-wrap gap-3 pt-1 text-sm font-medium">
        {user && <Link to={`/log?spot=${encodeURIComponent(s.id)}`}>+ Log a catch here</Link>}
        <a href={directions} target="_blank" rel="noreferrer">Directions ↗</a>
        {s.custom && user && (
          <button type="button" className="text-rose-600" onClick={() => window.confirm(`Delete "${s.name}"?`) && deleteSpot(user.uid, s.id)}>Delete</button>
        )}
      </div>
    </div>
  );
}

function AddSpotForm({ draft, setDraft, map, onSaved }) {
  const { user } = useAuth();
  const { location } = useLocation();
  const [name, setName] = useState('');
  const [type, setType] = useState('Bank spot');
  const [notes, setNotes] = useState('');
  const [coords, setCoords] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (draft) setCoords(`${draft.lat}, ${draft.lng}`); }, [draft]);

  function applyCoords(text) {
    setCoords(text);
    const m = text.match(/^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (m) {
      const lat = +m[1];
      const lng = +m[2];
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        setDraft({ lat, lng });
        map?.flyTo([lat, lng], 14);
        setErr(null);
      }
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) { setErr('Your browser does not share location.'); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => applyCoords(`${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`),
      () => setErr('Could not get your location. Check location permission.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function save(e) {
    e.preventDefault();
    if (!draft) { setErr('Tap the map, use GPS, or type coordinates first.'); return; }
    if (!name.trim()) { setErr('Give your spot a name.'); return; }
    setBusy(true);
    try {
      await addSpot(user.uid, { name: name.trim(), type, notes: notes.trim(), lat: draft.lat, lng: draft.lng, locationId: location.id });
      setName(''); setNotes(''); setCoords(''); setDraft(null); setErr(null);
      onSaved?.();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="card space-y-2 p-3">
      <p className="font-semibold">⭐ Save a spot</p>
      <div>
        <label className="label" htmlFor="coords">Coordinates
          <InfoTip>Tap the map, press &quot;Use my GPS&quot; while standing at the spot, or paste &quot;latitude, longitude&quot; (e.g. 36.5300, -87.3600) from Google Maps.</InfoTip>
        </label>
        <div className="flex gap-2">
          <input id="coords" className="input" value={coords} onChange={(e) => applyCoords(e.target.value)} placeholder="36.53000, -87.36000" inputMode="decimal" />
          <button type="button" onClick={useMyLocation} className="btn-secondary shrink-0 px-3" title="Use my GPS">📡</button>
        </div>
      </div>
      <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Spot name (e.g. Big rock below bridge)" maxLength={80} aria-label="Spot name" />
      <select className="input" value={type} onChange={(e) => setType(e.target.value)} aria-label="Spot type">
        {['Bank spot', 'River', 'Creek', 'Pond', 'Lake', 'Pier / dock', 'Boat ramp'].map((t) => <option key={t}>{t}</option>)}
      </select>
      <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes: parking, depth, what bites…" maxLength={500} aria-label="Notes" />
      {err && <p className="text-sm text-rose-600">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary flex-1">{busy ? 'Saving…' : 'Save spot'}</button>
        {draft && <button type="button" onClick={() => { setDraft(null); setCoords(''); }} className="btn-secondary">Clear</button>}
      </div>
    </form>
  );
}
