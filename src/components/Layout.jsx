import { Suspense, useState } from 'react';
import { Link, NavLink, Outlet, useLocation as useRoute } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { useLocation as useFishingLocation } from '../context/LocationContext.jsx';
import { useOnline } from '../utils/useOnline.js';

const NAV = [
  { to: '/', label: 'Home', icon: '🏠', end: true },
  { to: '/fish', label: 'Fish Guide', icon: '📖' },
  { to: '/log', label: 'Log', icon: '➕', primary: true },
  { to: '/map', label: 'Map', icon: '🗺️' },
  { to: '/trips', label: 'Trips', icon: '🗓️', badge: true },
  { to: '/journal', label: 'Journal', icon: '📓' },
];

// Red dot: trip invitations you haven't answered plus trips with unread chat messages.
function InviteBadge({ className = '' }) {
  const { pendingInvites, unreadChats } = useData();
  const n = pendingInvites + unreadChats;
  if (!n) return null;
  return <span className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white ${className}`}>{n}</span>;
}

function UsernameNudge() {
  const { user, profile, username } = useAuth();
  const route = useRoute();
  if (!user || profile === null || username || route.pathname === '/profile') return null;
  return (
    <div className="bg-river-50 px-4 py-1.5 text-center text-xs text-river-900">
      👋 Pick a username so friends can invite you on trips.{' '}
      <Link to="/profile" className="font-semibold underline">Choose one</Link>
    </div>
  );
}

export default function Layout() {
  const online = useOnline();
  const { isDemo } = useAuth();
  return (
    <div className="min-h-dvh pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-8">
      <Header />
      {!online && (
        <div className="bg-amber-100 px-4 py-1.5 text-center text-xs font-medium text-amber-900">
          📶 Offline: showing saved data. Catches you log now will sync when you reconnect.
        </div>
      )}
      {isDemo && (
        <div className="bg-sky-50 px-4 py-1.5 text-center text-xs text-sky-900">
          Demo mode: data is saved in this browser only. Connect Firebase (see README) for Google Sign-In & sync.
        </div>
      )}
      <UsernameNudge />
      <main className="mx-auto w-full max-w-5xl px-2 pt-3 sm:px-4">
        {/* The device's screen: every page renders inside it. */}
        <div className="screen-panel px-3 py-4 sm:px-5 sm:py-5">
          <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading…</div>}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

function Header() {
  const { user, username, signIn, signOut } = useAuth();
  const { location, locations, setLocationId } = useFishingLocation();
  const [menu, setMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-black/25 bg-shell-900/95 text-white shadow-[0_2px_0_rgb(255_255_255/0.06)] backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2 text-white">
          {/* The device's camera lens + indicator lights (decorative). */}
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/90 ring-2 ring-black/30" aria-hidden>
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="h-7 w-7" />
          </span>
          <span className="hidden font-pixel text-lg sm:inline">Fishing Guide</span>
          <span className="hidden items-center gap-1 sm:flex" aria-hidden>
            <span className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_6px_rgb(251_113_133)]" />
            <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_6px_rgb(252_211_77)]" />
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgb(52_211_153)]" />
          </span>
        </Link>

        <label className="relative">
          <span className="sr-only">Location</span>
          <select
            value={location.id}
            onChange={(e) => setLocationId(e.target.value)}
            className="appearance-none rounded-full bg-river-50 py-1 pl-7 pr-3 text-sm font-medium text-river-900 ring-1 ring-river-200 focus:outline-none focus:ring-2 focus:ring-river-500"
          >
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs" aria-hidden>📍</span>
        </label>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {NAV.filter((n) => !n.primary).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => `rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-white/15 text-white ring-1 ring-white/25' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}
            >
              {n.label}
              {n.badge && <InviteBadge className="ml-1" />}
            </NavLink>
          ))}
          <NavLink to="/learn" className={({ isActive }) => `rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-white/15 text-white ring-1 ring-white/25' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}>Learn</NavLink>
          <Link to="/log" className="btn ml-2 bg-amber-400 py-1.5 text-shell-900 shadow-[0_3px_0_#92400e] hover:bg-amber-300 active:shadow-[0_1px_0_#92400e]">+ Log a catch</Link>
        </nav>

        <Link to="/learn" className="ml-auto rounded-lg px-2 py-1 text-sm font-medium text-white md:hidden">🎓 Learn</Link>

        <div className="relative">
          {user ? (
            <button type="button" onClick={() => setMenu((m) => !m)} className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-river-100 font-semibold text-river-800 ring-2 ring-white/70" aria-label="Account menu" aria-expanded={menu}>
              {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : (user.displayName || '?')[0]}
            </button>
          ) : (
            <button type="button" onClick={signIn} className="btn-secondary px-3 py-1.5">Sign in</button>
          )}
          {menu && user && (
            <div className="absolute right-0 top-11 w-56 rounded-xl bg-white p-2 text-sm shadow-lg ring-1 ring-slate-200">
              <p className="truncate px-2 py-1 font-medium">{user.displayName}</p>
              {user.email && <p className="truncate px-2 pb-2 text-xs text-slate-500">{user.email}</p>}
              <Link to="/profile" onClick={() => setMenu(false)} className="block rounded-lg px-2 py-1.5 hover:bg-slate-50">
                {username ? <>👤 @{username}</> : <span className="font-medium text-river-700">👋 Pick a username</span>}
              </Link>
              <Link to="/trips" onClick={() => setMenu(false)} className="flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-slate-50">🗓️ My trips <InviteBadge /></Link>
              <button type="button" onClick={() => { setMenu(false); signOut(); }} className="w-full rounded-lg px-2 py-1.5 text-left text-rose-600 hover:bg-rose-50">Sign out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-black/25 bg-shell-900/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_0_rgb(255_255_255/0.06)] backdrop-blur md:hidden" aria-label="Main">
      <ul className="grid h-16 grid-cols-6">
        {NAV.map((n) => (
          <li key={n.to}>
            <NavLink
              to={n.to}
              end={n.end}
              className={({ isActive }) => `group relative flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${isActive ? 'text-white' : 'text-white/65'}`}
            >
              {({ isActive }) => (
                <>
                  {/* Lit indicator above the active button. */}
                  {!n.primary && <span className={`absolute top-1 h-1 w-6 rounded-full transition ${isActive ? 'bg-amber-300 shadow-[0_0_6px_rgb(252_211_77)]' : 'bg-white/10'}`} aria-hidden />}
                  {n.primary ? (
                    <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-2xl font-bold text-shell-900 shadow-[0_3px_0_#92400e] ring-4 ring-shell-900 transition group-active:translate-y-[2px] group-active:shadow-[0_1px_0_#92400e]" aria-hidden>+</span>
                  ) : (
                    <span className="relative text-xl" aria-hidden>{n.icon}{n.badge && <InviteBadge className="absolute -right-2.5 -top-1" />}</span>
                  )}
                  {n.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
