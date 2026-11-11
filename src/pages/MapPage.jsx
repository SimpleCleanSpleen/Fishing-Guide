import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, Tooltip, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import InfoTip from '../components/InfoTip.jsx';
import { Badge, Callout, PageHeader } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import FishIcon from '../components/FishIcon.jsx';
import DirectionsMenu, { DirectionsInline } from '../components/Directions.jsx';
import { addSharedSpot, addSpot, deleteSharedSpot, deleteSpot } from '../services/repository.js';
import { spotPhotos } from '../services/photos.js';
import { fmtDate, fmtWeight } from '../utils/time.js';

// Free basemaps, no keys. Satellite and Night get a labels layer on top so towns and roads still show.
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services';
const esriTiles = (name) => `${ESRI}/${name}/MapServer/tile/{z}/{y}/{x}`;
const BASEMAPS = {
  outdoors: {
    label: 'Map', icon: '🗺️', url: esriTiles('World_Topo_Map'), maxNativeZoom: 18, maxZoom: 19,
    attribution: 'Tiles &copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors, USGS',
  },
  satellite: {
    label: 'Satellite', icon: '🛰️', url: esriTiles('World_Imagery'), maxNativeZoom: 18, maxZoom: 19,
    attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
    labels: esriTiles('Reference/World_Boundaries_and_Places'),
  },
  topo: {
    label: 'Terrain', icon: '⛰️', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', subdomains: 'abc', maxNativeZoom: 17, maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
  },
  night: {
    label: 'Night', icon: '🌙', url: esriTiles('Canvas/World_Dark_Gray_Base'), maxNativeZoom: 16, maxZoom: 19,
    attribution: 'Tiles &copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
    labels: esriTiles('Canvas/World_Dark_Gray_Reference'),
  },
};
const BASEMAP_KEY = 'fishguide:basemap';

// Each kind of water gets its own pin color and icon.
const KINDS = {
  river: { label: 'River', emoji: '🌊', c1: '#075985', c2: '#38bdf8' },
  lake: { label: 'Lake & pond', emoji: '💧', c1: '#0f766e', c2: '#2dd4bf' },
  creek: { label: 'Creek', emoji: '🌿', c1: '#166534', c2: '#4ade80' },
  bay: { label: 'Pier & bay', emoji: '⚓', c1: '#1e3a8a', c2: '#818cf8' },
  community: { label: 'Shared by anglers', emoji: '👥', c1: '#7e22ce', c2: '#d8b4fe' },
  mine: { label: 'My spots', emoji: '⭐', c1: '#c2410c', c2: '#fb923c' },
};

// Who added a spot: Claude for the suggested ones, otherwise the angler's username.
function spotAuthor(s) {
  if (s.custom && s.shared) return { icon: '⭐', text: 'Shared by you' };
  if (s.custom) return { icon: '🔒', text: 'Your private spot' };
  if (s.shared) return { icon: '👤', text: `Added by @${s.ownerName}` };
  return { icon: '✨', text: `Added by ${s.addedBy || 'Claude'}` };
}

function waterKind(s) {
  if (s.custom) return 'mine';
  if (s.shared) return 'community';
  const t = (s.type || '').toLowerCase();
  if (/pier|bay|jetty|shore|tidal/.test(t)) return 'bay';
  if (/river|tailwater|dam/.test(t)) return 'river';
  if (/creek|stream/.test(t)) return 'creek';
  return 'lake';
}

const iconCache = new Map();
function pinIcon(kind, active = false) {
  const key = `${kind}:${active}`;
  if (!iconCache.has(key)) {
    const k = KINDS[kind];
    const size = active ? 44 : 34;
    iconCache.set(key, L.divIcon({
      className: 'fg-pin-wrap',
      html: `<div class="fg-pin${active ? ' is-active' : ''}" style="--c1:${k.c1};--c2:${k.c2};--size:${size}px">`
        + `${active ? '<span class="fg-pin-pulse"></span>' : ''}<div class="fg-pin-body"><span>${k.emoji}</span></div></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size + 4],
      tooltipAnchor: [size / 2 - 2, -size / 2],
    }));
  }
  return iconCache.get(key);
}
const DRAFT_ICON = L.divIcon({
  className: 'fg-pin-wrap',
  html: '<div class="fg-pin is-active" style="--c1:#6d28d9;--c2:#c084fc;--size:44px"><span class="fg-pin-pulse"></span><div class="fg-pin-body"><span>📍</span></div></div>',
  iconSize: [44, 44],
  iconAnchor: [22, 44],
});

function readBasemap() {
  try { return BASEMAPS[localStorage.getItem(BASEMAP_KEY)] ? localStorage.getItem(BASEMAP_KEY) : 'outdoors'; } catch { return 'outdoors'; }
}

export default function MapPage() {
  const { user } = useAuth();
  const { location } = useLocation();
  const { seedSpots, customSpots, communitySpots, catches } = useData();
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null); // { lat, lng }
  const [filter, setFilter] = useState('all');
  const [map, setMap] = useState(null);
  const [basemap, setBasemapState] = useState(readBasemap);
  const [me, setMe] = useState(null);

  const spots = useMemo(() => {
    const byFilter = { mine: customSpots, suggested: seedSpots, community: communitySpots };
    return byFilter[filter] || [...seedSpots, ...communitySpots, ...customSpots];
  }, [seedSpots, customSpots, communitySpots, filter]);
  const everyHere = [...seedSpots, ...communitySpots, ...customSpots];
  const selected = everyHere.find((s) => s.id === selectedId) || null;
  const kindsShown = [...new Set(everyHere.map(waterKind))];

  useEffect(() => { setSelectedId(null); }, [location.id]);

  function setBasemap(k) {
    setBasemapState(k);
    try { localStorage.setItem(BASEMAP_KEY, k); } catch { /* ignore */ }
  }

  function focus(s) {
    setSelectedId(s.id);
    map?.flyTo([s.lat, s.lng], Math.max(map.getZoom(), 14), { duration: 0.8 });
  }

  function fitAll() {
    const pts = everyHere.map((s) => [s.lat, s.lng]);
    if (map && pts.length) map.flyToBounds(pts, { padding: [40, 40], maxZoom: 13, duration: 0.8 });
  }

  function locateMe() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        setMe(pos);
        map?.flyTo([pos.lat, pos.lng], 14, { duration: 0.8 });
      },
      () => window.alert('Could not get your location. Check location permission.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const base = BASEMAPS[basemap];
  return (
    <div>
      <PageHeader title="Fishing Map" subtitle={`${seedSpots.length} suggested spots around ${location.name}${communitySpots.length ? ` · ${communitySpots.length} shared by anglers` : ''}${customSpots.length ? ` · ${customSpots.length} of yours` : ''}`} />
      <Callout tone="amber" icon="⚠️" className="mb-3">
        {location.spotsNotice}
      </Callout>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_23rem]">
        <div className="min-w-0 self-start space-y-3">
          <div className={`fg-map relative overflow-hidden rounded-3xl shadow-lg ring-1 ring-slate-900/10 ${basemap === 'night' ? 'is-night' : ''}`}>
            <div className="h-[62vh] min-h-96 w-full">
              <MapContainer center={[location.center.lat, location.center.lng]} zoom={location.zoom} className="h-full w-full" ref={setMap} scrollWheelZoom zoomControl={false}>
                <TileLayer key={basemap} url={base.url} attribution={base.attribution} subdomains={base.subdomains || 'abc'} maxZoom={base.maxZoom} maxNativeZoom={base.maxNativeZoom} />
                {base.labels && <TileLayer key={`${basemap}-labels`} url={base.labels} maxNativeZoom={base.maxNativeZoom} maxZoom={19} />}
                <ZoomControl position="bottomright" />
                <FitSpots spots={seedSpots} locationId={location.id} />
                {user && <ClickToPin onPick={setDraft} />}
                {spots.map((s) => (
                  <Marker
                    key={s.id}
                    position={[s.lat, s.lng]}
                    icon={pinIcon(waterKind(s), selectedId === s.id)}
                    zIndexOffset={selectedId === s.id ? 1000 : 0}
                    eventHandlers={{ click: () => setSelectedId(s.id) }}
                  >
                    <Tooltip direction="right" className="fg-tooltip">{s.name}</Tooltip>
                    <Popup className="fg-popup" minWidth={272} maxWidth={272} closeButton={false} autoPanPaddingTopLeft={[16, 140]} autoPanPaddingBottomRight={[60, 60]}>
                      <SpotPopup s={s} catches={catches} />
                    </Popup>
                  </Marker>
                ))}
                {draft && <Marker position={[draft.lat, draft.lng]} icon={DRAFT_ICON} />}
                {me && <CircleMarker center={[me.lat, me.lng]} radius={8} pathOptions={{ color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }} />}
              </MapContainer>
            </div>

            {/* Overlays sit above the map panes; the wrapper ignores clicks so the map stays usable. */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex items-start justify-between gap-2 p-3">
              <div className="fg-glass pointer-events-auto rounded-2xl px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-river-700">{location.region}</p>
                <p className="text-base font-bold leading-tight text-slate-900">🎣 {location.name}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="fg-glass pointer-events-auto flex rounded-2xl p-1" role="group" aria-label="Map style">
                  {Object.entries(BASEMAPS).map(([k, b]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setBasemap(k)}
                      aria-pressed={basemap === k}
                      title={b.label}
                      className={`flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-semibold transition ${basemap === k ? 'bg-river-700 text-white shadow' : 'text-slate-700 hover:bg-white/70'}`}
                    >
                      <span aria-hidden>{b.icon}</span><span className="hidden sm:inline">{b.label}</span>
                    </button>
                  ))}
                </div>
                <div className="pointer-events-auto flex gap-2">
                  <button type="button" onClick={fitAll} className="fg-glass fg-map-btn" title="Show all spots">⤢</button>
                  <button type="button" onClick={locateMe} className="fg-glass fg-map-btn" title="Show where I am">📡</button>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute bottom-0 left-0 z-[500] p-3 pr-16">
              <ul className="fg-glass pointer-events-auto flex flex-wrap gap-x-3 gap-y-1 rounded-2xl px-3 py-2 text-xs font-medium text-slate-700">
                {Object.entries(KINDS).filter(([k]) => kindsShown.includes(k)).map(([k, v]) => (
                  <li key={k} className="flex items-center gap-1.5">
                    <span className="fg-legend-dot" style={{ '--c1': v.c1, '--c2': v.c2 }} aria-hidden />{v.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="flex items-center gap-1 px-1 text-xs text-slate-500">
            {user ? 'Tap anywhere on the map to drop a pin for your own spot.' : 'Sign in to pin and save your own spots.'}
            <InfoTip>Your pins are saved privately to your account. Map tiles you&apos;ve viewed are cached so the map still shows with weak signal. Try Satellite to see drop-offs, weed beds and fallen trees.</InfoTip>
          </p>
        </div>

        <aside className="space-y-3">
          {selected && <SpotDetail s={selected} catches={catches} onClose={() => setSelectedId(null)} />}
          {user && <AddSpotForm draft={draft} setDraft={setDraft} map={map} onSaved={() => setFilter('all')} />}

          <div className="card p-3">
            <div className="mb-2 flex gap-1 text-xs font-medium">
              {[['all', 'All'], ['suggested', 'Suggested'], ['community', 'Shared'], ['mine', 'Mine']].map(([k, label]) => (
                <button key={k} type="button" onClick={() => setFilter(k)} className={`rounded-full px-3 py-1 ${filter === k ? 'bg-river-700 text-white' : 'bg-slate-100 text-slate-600'}`}>{label}</button>
              ))}
            </div>
            <ul className="max-h-[60vh] space-y-1 overflow-y-auto">
              {spots.map((s) => {
                const k = KINDS[waterKind(s)];
                const cover = spotPhotos(s)[0];
                return (
                  <li key={s.id}>
                    <button type="button" onClick={() => focus(s)} className={`flex w-full items-center gap-3 rounded-xl p-1.5 text-left transition ${selectedId === s.id ? 'bg-river-50 ring-1 ring-river-200' : 'hover:bg-slate-50'}`}>
                      <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-200">
                        <img src={cover.thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
                        <span className="fg-legend-dot absolute bottom-1 left-1 ring-2 ring-white" style={{ '--c1': k.c1, '--c2': k.c2 }} aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{s.name}</span>
                        <span className="block truncate text-xs text-slate-500">{s.type}{s.species?.length ? ` · ${s.species.slice(0, 3).join(', ')}` : ''}</span>
                        <span className="block truncate text-[11px] text-slate-400">{spotAuthor(s).icon} {spotAuthor(s).text}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
              {!spots.length && <li className="py-4 text-center text-sm text-slate-500">No spots here yet.</li>}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

// Frame every suggested spot when the page opens or the location changes.
function FitSpots({ spots, locationId }) {
  const map = useMap();
  useEffect(() => {
    if (spots.length) map.fitBounds(spots.map((s) => [s.lat, s.lng]), { padding: [48, 48], maxZoom: 13 });
  }, [locationId, map]);
  return null;
}

function ClickToPin({ onPick }) {
  useMapEvents({ click: (e) => onPick({ lat: +e.latlng.lat.toFixed(5), lng: +e.latlng.lng.toFixed(5) }) });
  return null;
}

function SpotHero({ s, photo, className = '' }) {
  const k = KINDS[waterKind(s)];
  return (
    <div className={`relative overflow-hidden bg-slate-800 ${className}`} style={{ background: `linear-gradient(135deg, ${k.c1}, ${k.c2})` }}>
      <img src={photo.src} alt={photo.caption} className="h-full w-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-3 text-white">
        <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-white/80"><span aria-hidden>{k.emoji}</span>{s.type}</p>
        <p className="text-lg font-bold leading-tight drop-shadow">{s.name}</p>
      </div>
    </div>
  );
}

function SpotPopup({ s, catches }) {
  const { user } = useAuth();
  const photos = spotPhotos(s);
  const here = catches.filter((c) => c.spotId === s.id);
  return (
    <div className="text-sm">
      <SpotHero s={s} photo={photos[0]} className="h-36" />
      <div className="space-y-1.5 p-3">
        <div className="flex flex-wrap gap-1">
          {s.approximate && <Badge tone="amber">Approximate</Badge>}
          {s.custom && <Badge tone="amber">My spot</Badge>}
          {here.length > 0 && <Badge tone="river">🐟 {here.length} caught here</Badge>}
          {photos.length > 1 && <Badge tone="slate">📷 {photos.length} photos</Badge>}
        </div>
        {(s.description || s.notes) && <p className="!my-1 line-clamp-3 text-slate-600">{s.description || s.notes}</p>}
        {s.species?.length > 0 && <p className="!my-1"><b>Fish:</b> {s.species.join(', ')}</p>}
        <p className="!my-1 text-xs text-slate-500">{spotAuthor(s).icon} {spotAuthor(s).text}</p>
        <div className="flex flex-wrap gap-3 pt-1 text-sm font-semibold">
          {user && <Link to={`/log?spot=${encodeURIComponent(s.id)}`}>+ Log a catch</Link>}
          <DirectionsInline lat={s.lat} lng={s.lng} label={s.name} />
        </div>
      </div>
    </div>
  );
}

function SpotDetail({ s, catches, onClose }) {
  const { user } = useAuth();
  const photos = spotPhotos(s);
  const [idx, setIdx] = useState(0);
  useEffect(() => { setIdx(0); }, [s.id]);
  const photo = photos[Math.min(idx, photos.length - 1)];
  const here = catches.filter((c) => c.spotId === s.id);

  return (
    <section className="card overflow-hidden p-0">
      <div className="relative">
        <SpotHero s={s} photo={photo} className="aspect-[16/10]" />
        <button type="button" onClick={onClose} className="absolute right-2 top-2 rounded-full bg-black/45 px-2.5 py-1 text-sm text-white backdrop-blur hover:bg-black/60" aria-label="Close">✕</button>
      </div>
      <p className="flex items-center justify-between gap-2 px-3 pt-1.5 text-[11px] text-slate-500">
        <span className="truncate">{photo.caption}</span>
        <a href={photo.href} target="_blank" rel="noreferrer" className="shrink-0 truncate" title={photo.credit}>{photo.aerial ? 'Open in Google Maps' : `📷 ${photo.credit}`} ↗</a>
      </p>
      {photos.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto px-3 pt-2">
          {photos.map((p, i) => (
            <button key={p.src} type="button" onClick={() => setIdx(i)} className={`h-12 w-16 shrink-0 overflow-hidden rounded-lg ring-2 transition ${i === idx ? 'ring-river-600' : 'opacity-70 ring-transparent hover:opacity-100'}`} title={p.caption}>
              <img src={p.thumb} alt={p.caption} className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2 p-3 text-sm">
        <div className="flex flex-wrap gap-1">
          {s.approximate && <Badge tone="amber">Approximate: verify before visiting</Badge>}
          {s.custom && <Badge tone="amber">My spot</Badge>}
        </div>
        {(s.description || s.notes) && <p className="leading-relaxed text-slate-600">{s.description || s.notes}</p>}
        {s.species?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {s.species.map((n) => <span key={n} className="chip"><FishIcon name={n} size={22} /> {n}</span>)}
          </div>
        )}
        {s.beginnerTip && <p className="rounded-xl bg-river-50 p-2.5 text-river-900">💡 {s.beginnerTip}</p>}
        {s.advisory && <p className="rounded-xl bg-amber-50 p-2.5 text-amber-900">⚠️ {s.advisory} <Link to="/learn/safety">Details</Link></p>}
        {s.access && <p className="text-xs text-slate-500">Access: {s.access}{s.amenities?.length ? ` · ${s.amenities.join(', ')}` : ''}</p>}

        {here.length > 0 && (
          <div>
            <p className="mb-1.5 font-semibold">🐟 Your catches here</p>
            <div className="grid grid-cols-3 gap-1.5">
              {here.slice(0, 6).map((c) => (
                <div key={c.id} className="relative aspect-square overflow-hidden rounded-lg bg-river-50">
                  {c.photo
                    ? <img src={c.photo} alt={`${c.species} catch`} className="h-full w-full object-cover" loading="lazy" />
                    : <span className="flex h-full items-center justify-center p-1.5"><FishIcon name={c.species} size={72} className="max-w-full" /></span>}
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-3 text-[10px] font-medium leading-tight text-white">
                    {c.species}{c.weightLb ? ` · ${fmtWeight(c.weightLb)}` : ''}<br />{fmtDate(c.date)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <SpotAttribution s={s} photos={photos} />
        <p className="text-xs text-slate-400">{s.lat.toFixed(4)}, {s.lng.toFixed(4)}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {user && <Link to={`/log?spot=${encodeURIComponent(s.id)}`} className="btn-primary px-3 py-2">+ Log a catch here</Link>}
          <DirectionsMenu lat={s.lat} lng={s.lng} label={s.name} />
          {s.custom && user && (
            <button type="button" className="btn-secondary px-3 py-2 text-rose-600" onClick={() => window.confirm(`Delete "${s.name}"?`) && (s.shared ? deleteSharedSpot(s.id) : deleteSpot(user.uid, s.id)).then(onClose)}>Delete</button>
          )}
        </div>
      </div>
    </section>
  );
}

function SpotAttribution({ s, photos }) {
  const { location } = useLocation();
  const author = spotAuthor(s);
  const credited = photos.filter((p) => !p.aerial);
  return (
    <details className="rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600" open={!s.custom && !s.shared}>
      <summary className="cursor-pointer font-semibold text-slate-700">{author.icon} {author.text}</summary>
      {!s.custom && !s.shared && <p className="mt-1.5 leading-relaxed">{location.spotsCredit}</p>}
      {s.sources?.length > 0 && (
        <p className="mt-1.5">Sources:{' '}
          {s.sources.map((src, i) => <span key={src.url}>{i > 0 && ' · '}<a href={src.url} target="_blank" rel="noreferrer" className="underline">{src.label}</a></span>)}
        </p>
      )}
      {credited.length > 0 && (
        <p className="mt-1.5">Photos via Wikimedia Commons:{' '}
          {credited.map((p, i) => <span key={p.href}>{i > 0 && ' · '}<a href={p.href} target="_blank" rel="noreferrer" className="underline">{p.credit}</a></span>)}
        </p>
      )}
      <p className="mt-1.5">Aerial view: Esri World Imagery.</p>
    </details>
  );
}

function AddSpotForm({ draft, setDraft, map, onSaved }) {
  const { user, username } = useAuth();
  const { location } = useLocation();
  const [name, setName] = useState('');
  const [type, setType] = useState('Bank spot');
  const [notes, setNotes] = useState('');
  const [share, setShare] = useState(false);
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
      const spot = { name: name.trim(), type, notes: notes.trim(), lat: draft.lat, lng: draft.lng, locationId: location.id };
      if (share) await addSharedSpot({ ...spot, ownerUid: user.uid, ownerName: username });
      else await addSpot(user.uid, spot);
      setName(''); setNotes(''); setCoords(''); setDraft(null); setErr(null); setShare(false);
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
      {username ? (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} className="mt-1" />
          <span>Share with other anglers<span className="block text-xs text-slate-500">Everyone will see this spot on the map, listed as added by @{username}.</span></span>
        </label>
      ) : (
        <p className="text-xs text-slate-500">Want to share spots with other anglers? <Link to="/profile" className="font-medium text-river-700">Pick a username</Link> first.</p>
      )}
      {err && <p className="text-sm text-rose-600">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary flex-1">{busy ? 'Saving…' : share ? 'Save & share spot' : 'Save spot'}</button>
        {draft && <button type="button" onClick={() => { setDraft(null); setCoords(''); }} className="btn-secondary">Clear</button>}
      </div>
    </form>
  );
}
