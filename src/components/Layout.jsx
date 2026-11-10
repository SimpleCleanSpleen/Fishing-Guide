import { Suspense, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocation as useFishingLocation } from '../context/LocationContext.jsx';
import { useOnline } from '../utils/useOnline.js';

const NAV = [
  { to: '/', label: 'Home', icon: '🏠', end: true },
  { to: '/fish', label: 'Fish Guide', icon: '📖' },
  { to: '/log', label: 'Log', icon: '➕', primary: true },
  { to: '/map', label: 'Map', icon: '🗺️' },
  { to: '/journal', label: 'Journal', icon: '📓' },
];

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
      <main className="mx-auto w-full max-w-5xl px-4 pt-4">
        <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading…</div>}>
          <Outlet />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}

function Header() {
  const { user, signIn, signOut } = useAuth();
  const { location, locations, setLocationId } = useFishingLocation();
  const [menu, setMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-river-800">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="h-8 w-8" />
          <span className="hidden sm:inline">Fishing Guide</span>
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
              className={({ isActive }) => `rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-river-50 text-river-800' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {n.label}
            </NavLink>
          ))}
          <NavLink to="/learn" className={({ isActive }) => `rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-river-50 text-river-800' : 'text-slate-600 hover:bg-slate-100'}`}>Learn</NavLink>
          <Link to="/log" className="btn-primary ml-2 py-1.5">+ Log a catch</Link>
        </nav>

        <Link to="/learn" className="ml-auto rounded-lg px-2 py-1 text-sm font-medium text-river-800 md:hidden">🎓 Learn</Link>

        <div className="relative">
          {user ? (
            <button type="button" onClick={() => setMenu((m) => !m)} className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-river-100 font-semibold text-river-800 ring-1 ring-river-200" aria-label="Account menu" aria-expanded={menu}>
              {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : (user.displayName || '?')[0]}
            </button>
          ) : (
            <button type="button" onClick={signIn} className="btn-secondary px-3 py-1.5">Sign in</button>
          )}
          {menu && user && (
            <div className="absolute right-0 top-11 w-56 rounded-xl bg-white p-2 text-sm shadow-lg ring-1 ring-slate-200">
              <p className="truncate px-2 py-1 font-medium">{user.displayName}</p>
              {user.email && <p className="truncate px-2 pb-2 text-xs text-slate-500">{user.email}</p>}
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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Main">
      <ul className="grid h-16 grid-cols-5">
        {NAV.map((n) => (
          <li key={n.to}>
            <NavLink
              to={n.to}
              end={n.end}
              className={({ isActive }) => `flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${isActive ? 'text-river-700' : 'text-slate-500'}`}
            >
              {n.primary ? (
                <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-river-700 text-2xl text-white shadow-lg ring-4 ring-white" aria-hidden>+</span>
              ) : (
                <span className="text-xl" aria-hidden>{n.icon}</span>
              )}
              {n.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
