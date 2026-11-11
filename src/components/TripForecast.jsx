import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import FishIcon from './FishIcon.jsx';
import { Badge } from './ui.jsx';
import { useData } from '../context/DataContext.jsx';
import { getLocation } from '../data/locations/index.js';
import { activityLabel } from '../services/bitingNow.js';
import { tripFish, tripOutlook, tripSupplies } from '../services/tripPlan.js';
import { describeWeather, getTripWeather } from '../services/weather.js';
import { TIME_LABELS } from '../data/species.js';
import { fmtClock, todayISO } from '../utils/time.js';
import { useAsync } from '../utils/useAsync.js';

// Everything the planner predicts for a trip: weather (when it's within the 16-day
// forecast window), which fish should be active, and what to pack.
export function useTripForecast(trip) {
  const { allCatches } = useData();
  const location = getLocation(trip.locationId);
  const lat = trip.lat ?? location.center.lat;
  const lng = trip.lng ?? location.center.lng;
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(trip.date || '');
  const wx = useAsync(
    () => (valid ? getTripWeather({ lat, lng }, trip.date, trip.time, location.timezone) : Promise.resolve(null)).catch(() => null),
    [lat, lng, trip.date, trip.time, location.timezone, valid],
  );
  const weather = wx.data;
  return useMemo(() => {
    if (!valid) return null;
    const spot = { species: trip.spotSpecies || [] };
    const fish = tripFish(trip, location, spot, allCatches, weather);
    return {
      location,
      weather,
      weatherLoading: wx.loading,
      fish,
      outlook: tripOutlook(fish, weather),
      supplies: tripSupplies(trip, fish, weather, location),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.date, trip.time, trip.locationId, (trip.spotSpecies || []).join(), allCatches, weather, wx.loading, valid]);
}

export function WeatherSummary({ forecast, date }) {
  const { weather: w, weatherLoading, fish } = forecast;
  if (weatherLoading) return <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />;
  if (!w) {
    return (
      <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">📅 Seasonal outlook</p>
        <p className="mt-0.5">
          {date < todayISO()
            ? 'This trip has passed.'
            : 'The detailed weather forecast opens up 16 days before the trip.'}{' '}
          Fish predictions below use typical patterns for the month and time of day. {fish.moon.emoji} {fish.moon.name}.
        </p>
      </div>
    );
  }
  const d = describeWeather(w.weatherCode);
  const h = w.atHour;
  return (
    <div className="rounded-2xl bg-gradient-to-br from-river-700 to-river-900 p-3 text-white">
      <div className="flex items-center gap-3">
        <span className="text-4xl" aria-hidden>{d.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{d.label} · {Math.round(w.hiF)}° / {Math.round(w.loF)}°F</p>
          <p className="text-xs text-white/80">
            ☔ {w.rainChance ?? 0}% · 💨 up to {Math.round(w.maxWindMph)} mph · 🌅 {fmtClock(w.sunrise)} · 🌇 {fmtClock(w.sunset)}
          </p>
        </div>
      </div>
      <p className="mt-2 border-t border-white/15 pt-2 text-xs text-white/85">
        At your start time: {Math.round(h.tempF)}°F, wind {Math.round(h.windMph)} mph, {h.cloudCover}% cloud
        {h.pressureTrend ? `, pressure ${h.pressureTrend}` : ''} · {fish.moon.emoji} {fish.moon.name}
      </p>
    </div>
  );
}

export function FishForecast({ forecast, limit = 6 }) {
  const { fish, outlook } = forecast;
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
        Likely active · {TIME_LABELS[fish.bucket] || 'All day'}
      </p>
      {outlook && <p className="mb-2 text-sm text-slate-600">{outlook}</p>}
      <ul className="divide-y divide-slate-100">
        {fish.rows.slice(0, limit).map((r) => {
          const a = activityLabel(r.score);
          return (
            <li key={r.name}>
              <Link to={`/fish/${encodeURIComponent(r.name)}`} className="flex items-center gap-3 py-2 hover:bg-slate-50">
                <FishIcon name={r.name} size={48} className="shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{r.name}</span>
                  <span className="block truncate text-xs text-slate-500">{r.atSpot && <span className="text-river-700">📍 Here · </span>}Try: {r.sp.baits.slice(0, 2).join(' or ') || 'local bait'}</span>
                </span>
                <span className="h-2 w-16 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                  <span className="block h-full rounded-full bg-river-500" style={{ width: `${Math.min(100, r.score * 100)}%` }} />
                </span>
                <Badge tone={a.tone}>{a.label}</Badge>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Packing checklist. Ticks are remembered on this device only (each angler packs their own bag).
export function SupplyList({ forecast, tripId }) {
  const key = `fishguide:packed:${tripId || 'draft'}`;
  const [packed, setPacked] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(packed)); } catch { /* storage off */ }
  }, [key, packed]);
  const all = forecast.supplies.flatMap((g) => g.items);
  const done = all.filter((i) => packed[i.id]).length;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-500">
        <span>Recommended supplies</span>
        {tripId && <span className="normal-case tracking-normal">{done}/{all.length} packed</span>}
      </div>
      <div className="space-y-3">
        {forecast.supplies.map((g) => (
          <div key={g.group}>
            <p className="mb-1 text-sm font-semibold text-slate-800">{g.group}</p>
            <ul className="space-y-1">
              {g.items.map((it) => (
                <li key={it.id}>
                  <label className={`flex cursor-pointer items-start gap-2 rounded-xl p-1.5 text-sm hover:bg-slate-50 ${packed[it.id] ? 'text-slate-400 line-through' : ''}`}>
                    {tripId && <input type="checkbox" className="mt-1" checked={!!packed[it.id]} onChange={(e) => setPacked((p) => ({ ...p, [it.id]: e.target.checked }))} />}
                    <span aria-hidden>{it.icon}</span>
                    <span className="min-w-0">
                      {it.gearId ? <Link to="/learn/gear" title="In your tackle box: see how to use it" className="font-medium text-slate-800 hover:underline">{it.name}</Link> : <span className="font-medium text-slate-800">{it.name}</span>}
                      {it.why && <span className="block text-xs text-slate-500 no-underline">{it.why}</span>}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
