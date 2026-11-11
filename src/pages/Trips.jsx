import { Link } from 'react-router-dom';
import RequireAuth from '../components/RequireAuth.jsx';
import { Badge, Callout, EmptyState, PageHeader } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { getLocation } from '../data/locations/index.js';
import { setRsvp } from '../services/repository.js';
import { tripDate } from '../services/tripPlan.js';
import { fmtClock, todayISO } from '../utils/time.js';

export const RSVP = {
  going: { label: 'Going', icon: '✅', tone: 'emerald' },
  maybe: { label: 'Maybe', icon: '🤔', tone: 'amber' },
  declined: { label: "Can't go", icon: '❌', tone: 'slate' },
};

export default function Trips() {
  return (
    <div>
      <PageHeader title="Fishing Trips" subtitle="Plan a day on the water and invite friends.">
        <Link to="/trips/new" className="btn-primary">+ Plan a trip</Link>
      </PageHeader>
      <RequireAuth reason="Sign in to plan trips and see invitations from other anglers.">
        <TripList />
      </RequireAuth>
    </div>
  );
}

function TripList() {
  const { user, username } = useAuth();
  const { trips } = useData();
  const today = todayISO();
  const isInvite = (t) => t.ownerUid !== user.uid && !RSVP[t.rsvp?.[user.uid]];
  const invites = trips.filter((t) => isInvite(t) && t.date >= today);
  const upcoming = trips.filter((t) => !isInvite(t) && t.date >= today);
  const past = trips.filter((t) => t.date < today).reverse();

  return (
    <div className="space-y-5">
      {!username && (
        <Callout tone="sky" icon="👋" title="Pick a username first">
          Friends invite you by username, and it's how they'll see who planned a trip.{' '}
          <Link to="/profile?next=/trips" className="font-semibold underline">Choose one</Link>
        </Callout>
      )}

      {invites.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">📬 Invitations</h2>
          <ul className="space-y-2">{invites.map((t) => <TripRow key={t.id} t={t} invite />)}</ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Upcoming</h2>
        {upcoming.length ? (
          <ul className="space-y-2">{upcoming.map((t) => <TripRow key={t.id} t={t} />)}</ul>
        ) : (
          <EmptyState icon="🗓️" title="No trips planned" action={<Link to="/trips/new" className="btn-primary mt-2">Plan your first trip</Link>}>
            Pick a date and spot, and you'll get a forecast of what's biting plus a packing list.
          </EmptyState>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Past trips</h2>
          <ul className="space-y-2 opacity-80">{past.map((t) => <TripRow key={t.id} t={t} />)}</ul>
        </section>
      )}
    </div>
  );
}

function TripRow({ t, invite }) {
  const { user } = useAuth();
  const { unreadChat } = useData();
  const d = tripDate(t);
  const mine = t.rsvp?.[user.uid];
  const going = Object.values(t.rsvp || {}).filter((s) => s === 'going').length;
  return (
    <li className="card p-0">
      <Link to={`/trips/${t.id}`} className="flex items-center gap-3 p-3">
        <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-river-50 text-river-900 ring-1 ring-river-200">
          <span className="text-[10px] font-semibold uppercase">{d.toLocaleDateString(undefined, { month: 'short' })}</span>
          <span className="text-xl font-bold leading-none">{d.getDate()}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{t.title}</span>
          <span className="block truncate text-xs text-slate-500">
            {d.toLocaleDateString(undefined, { weekday: 'short' })} · {fmtClock(t.time)} · {t.spotName || getLocation(t.locationId).name}
          </span>
          <span className="block truncate text-xs text-slate-400">
            {t.ownerUid === user.uid ? 'You organized' : `From @${t.ownerName}`} · {going} going · {t.members.length} invited
          </span>
          {t.lastMessage && (
            <span className={`block truncate text-xs ${unreadChat(t) ? 'font-semibold text-river-800' : 'text-slate-400'}`}>
              💬 {t.lastMessage.uid === user.uid ? 'You' : `@${t.lastMessage.name}`}: {t.lastMessage.text}
            </span>
          )}
        </span>
        {unreadChat(t) && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-rose-600" title="New messages" />}
        {!invite && mine && RSVP[mine] && t.ownerUid !== user.uid && <Badge tone={RSVP[mine].tone}>{RSVP[mine].label}</Badge>}
      </Link>
      {invite && <RsvpButtons trip={t} className="border-t border-slate-100 px-3 py-2" />}
    </li>
  );
}

export function RsvpButtons({ trip, className = '' }) {
  const { user } = useAuth();
  const mine = trip.rsvp?.[user.uid];
  return (
    <div className={`flex gap-2 ${className}`}>
      {Object.entries(RSVP).map(([k, r]) => (
        <button
          key={k}
          type="button"
          onClick={() => setRsvp(trip.id, user.uid, k)}
          className={`flex-1 rounded-xl px-2 py-1.5 text-sm font-medium ring-1 ${mine === k ? 'bg-river-700 text-white ring-river-700' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'}`}
        >
          {r.icon} {r.label}
        </button>
      ))}
    </div>
  );
}
