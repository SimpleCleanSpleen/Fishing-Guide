import { Link } from 'react-router-dom';
import FishIcon from './FishIcon.jsx';
import { useTripForecast } from './TripForecast.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { getLocation } from '../data/locations/index.js';
import { tripDate } from '../services/tripPlan.js';
import { describeWeather } from '../services/weather.js';
import { daysBetween, fmtClock, todayISO } from '../utils/time.js';

// Home-screen reminder for your next trip in the coming week, with its live forecast.
export default function UpcomingTrip() {
  const { user } = useAuth();
  const { trips } = useData();
  if (!user) return null;
  const today = todayISO();
  const next = trips.find((t) => t.date >= today && daysBetween(today, t.date) <= 7 && t.rsvp?.[user.uid] !== 'declined');
  return next ? <Card trip={next} /> : null;
}

function Card({ trip }) {
  const { user } = useAuth();
  const { unreadChat } = useData();
  const f = useTripForecast(trip);
  const days = daysBetween(todayISO(), trip.date);
  const d = tripDate(trip);
  const when = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : d.toLocaleDateString(undefined, { weekday: 'long' });
  const invited = trip.ownerUid !== user.uid && !trip.rsvp?.[user.uid];
  const w = f?.weather;
  const top = f?.fish.rows.slice(0, 3) || [];
  const toPack = f ? f.supplies.flatMap((g) => g.items).filter((i) => i.need || i.buy).length : 0;

  return (
    <Link to={`/trips/${trip.id}`} className="card block bg-gradient-to-br from-amber-50 to-white ring-amber-200 transition hover:ring-amber-300">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
        🗓️ {invited ? 'Trip invitation' : 'Upcoming trip'} · {when}, {fmtClock(trip.time)}
      </p>
      <p className="mt-0.5 text-lg font-bold text-slate-900">{trip.title}</p>
      <p className="text-sm text-slate-600">📍 {trip.spotName || getLocation(trip.locationId).name}</p>
      {w && (
        <p className="mt-2 text-sm text-slate-700">
          {describeWeather(w.weatherCode).emoji} {describeWeather(w.weatherCode).label}, {Math.round(w.hiF)}°/{Math.round(w.loF)}°F · ☔ {w.rainChance ?? 0}% · 💨 {Math.round(w.maxWindMph)} mph
        </p>
      )}
      {top.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span>Likely biting:</span>
          {top.map((r) => <span key={r.name} className="chip bg-white"><FishIcon name={r.name} size={22} /> {r.name}</span>)}
        </div>
      )}
      <p className="mt-2 text-sm font-semibold text-river-700">
        {invited ? 'Reply to the invitation →' : `Packing list${toPack ? ` (${toPack} to buy)` : ''}${unreadChat(trip) ? ' · 💬 new messages' : ''} →`}
      </p>
    </Link>
  );
}
