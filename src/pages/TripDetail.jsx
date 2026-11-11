import { Link, useNavigate, useParams } from 'react-router-dom';
import RequireAuth from '../components/RequireAuth.jsx';
import TripChat from '../components/TripChat.jsx';
import DirectionsMenu from '../components/Directions.jsx';
import TripRecap from '../components/TripRecap.jsx';
import { FishForecast, SupplyList, useTripForecast, WeatherSummary } from '../components/TripForecast.jsx';
import { Badge, Callout } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import { getLocation } from '../data/locations/index.js';
import { deleteTrip } from '../services/repository.js';
import { tripDate, tripGoogleCalendarUrl, tripIcs } from '../services/tripPlan.js';
import { fmtClock, todayISO } from '../utils/time.js';
import { RSVP, RsvpButtons } from './Trips.jsx';

export default function TripDetail() {
  return (
    <div className="mx-auto max-w-2xl">
      <RequireAuth reason="Sign in to see this trip.">
        <Detail />
      </RequireAuth>
    </div>
  );
}

function Detail() {
  const { id } = useParams();
  const { trips, loaded } = useData();
  const trip = trips.find((t) => t.id === id);
  if (!loaded) return <div className="card animate-pulse py-10 text-center text-slate-400">Loading…</div>;
  if (!trip) {
    return (
      <Callout tone="amber" icon="🤷" title="Trip not found">
        It may have been cancelled, or you weren't invited. <Link to="/trips" className="underline">Back to trips</Link>
      </Callout>
    );
  }
  return <TripView trip={trip} />;
}

function TripView({ trip }) {
  const { user } = useAuth();
  const { setLocationId } = useLocation();
  const navigate = useNavigate();
  const forecast = useTripForecast(trip);
  const loc = getLocation(trip.locationId);
  const isOwner = trip.ownerUid === user.uid;
  const d = tripDate(trip);
  const placeName = trip.spotName || loc.name;
  const end = new Date(d.getTime() + (trip.hours || 3) * 3600 * 1000);

  const tripUrl = `${window.location.origin}${window.location.pathname}#/trips/${trip.id}`;

  function downloadIcs() {
    const blob = new Blob([tripIcs(trip, placeName, loc.timezone, tripUrl)], { type: 'text/calendar' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${trip.title.replace(/[^\w-]+/g, '-').toLowerCase() || 'fishing-trip'}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async function cancel() {
    if (!window.confirm(`Cancel "${trip.title}"? Everyone invited will lose it from their trips.`)) return;
    await deleteTrip(trip.id);
    navigate('/trips');
  }

  const people = trip.members.map((uid) => ({ uid, name: trip.people?.[uid] || 'angler', status: trip.rsvp?.[uid] }));
  people.sort((a, b) => (a.uid === trip.ownerUid ? -1 : b.uid === trip.ownerUid ? 1 : 0));

  return (
    <div className="space-y-4">
      <Link to="/trips" className="text-sm font-medium text-river-700">← All trips</Link>

      <section className="card">
        <p className="text-xs font-semibold uppercase tracking-wide text-river-700">
          {d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="mt-0.5 text-2xl font-bold tracking-tight">{trip.title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          🕒 {fmtClock(trip.time)} – {fmtClock(`${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`)}
          {' · '}📍 {placeName}{trip.spotName ? `, ${loc.name}` : ''}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">Planned by {isOwner ? 'you' : `@${trip.ownerName}`}</p>
        {trip.notes && <p className="mt-3 whitespace-pre-line rounded-xl bg-slate-50 p-2.5 text-sm text-slate-700">{trip.notes}</p>}

        {!isOwner && (
          <div className="mt-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Are you going?</p>
            <RsvpButtons trip={trip} />
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <DirectionsMenu lat={trip.lat ?? loc.center.lat} lng={trip.lng ?? loc.center.lng} label={placeName} />
          {trip.spotId && <button type="button" onClick={() => { setLocationId(trip.locationId); navigate('/map'); }} className="btn-secondary px-3 py-2">🗺️ Map</button>}
          <button type="button" onClick={downloadIcs} className="btn-secondary px-3 py-2" title="Includes reminders the evening before and 1 hour before">📅 Calendar + reminders</button>
          <a href={tripGoogleCalendarUrl(trip, placeName, loc.timezone, tripUrl)} target="_blank" rel="noreferrer" className="btn-secondary px-3 py-2">Google Calendar ↗</a>
          {isOwner && <Link to={`/trips/${trip.id}/edit`} className="btn-secondary px-3 py-2">✏️ Edit</Link>}
          {isOwner && <button type="button" onClick={cancel} className="btn-secondary px-3 py-2 text-rose-600">Cancel trip</button>}
        </div>
      </section>

      <section className="card">
        <h2 className="mb-2 font-semibold">👥 Who's coming</h2>
        <ul className="space-y-1.5">
          {people.map((p) => (
            <li key={p.uid} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate">
                @{p.name}
                {p.uid === user.uid && <span className="text-slate-400"> (you)</span>}
                {p.uid === trip.ownerUid && <span className="text-slate-400"> · organizer</span>}
              </span>
              {RSVP[p.status] ? <Badge tone={RSVP[p.status].tone}>{RSVP[p.status].icon} {RSVP[p.status].label}</Badge> : <Badge>Invited</Badge>}
            </li>
          ))}
        </ul>
      </section>

      {trip.date <= todayISO() && <TripRecap trip={trip} />}

      <TripChat trip={trip} />

      {forecast && (
        <>
          <section className="card space-y-4">
            <h2 className="font-semibold">🔮 Trip forecast</h2>
            <WeatherSummary forecast={forecast} date={trip.date} />
            <FishForecast forecast={forecast} />
            <p className="text-[11px] text-slate-400">
              Predictions blend general seasonal and time-of-day patterns for each fish{trip.spotSpecies?.length ? ', the fish known at this spot' : ''}, the moon, weather and your own catch log. Weather by Open-Meteo.
            </p>
          </section>
          <section className="card">
            <SupplyList forecast={forecast} tripId={trip.id} />
            <p className="mt-3 text-[11px] text-slate-400">Built from the fish you're likely to target, the forecast and your start time. Checkmarks are saved on this device.</p>
          </section>
        </>
      )}
    </div>
  );
}
