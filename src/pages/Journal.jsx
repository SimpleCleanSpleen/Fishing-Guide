import { useMemo, useState } from 'react';
import { Link, NavLink, useLocation as useRouterLocation, useParams } from 'react-router-dom';
import CatchCard from '../components/CatchCard.jsx';
import RequireAuth from '../components/RequireAuth.jsx';
import { Callout, EmptyState, PageHeader } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import { deleteCatch, updateCatch } from '../services/repository.js';
import { buildConditions } from '../services/enrich.js';
import Insights from './Insights.jsx';

export default function Journal() {
  const { tab = 'catches' } = useParams();
  return (
    <RequireAuth reason="Sign in to see your fishing journal and personal insights.">
      <PageHeader title="My Journal" subtitle="Your catches and what they reveal." />
      <div className="mb-4 inline-flex rounded-xl bg-slate-100 p-1 text-sm font-medium" role="tablist">
        <Tab to="/journal" active={tab === 'catches'}>📓 Catches</Tab>
        <Tab to="/journal/insights" active={tab === 'insights'}>📊 Insights</Tab>
      </div>
      {tab === 'insights' ? <Insights /> : <CatchList />}
    </RequireAuth>
  );
}

function Tab({ to, active, children }) {
  return (
    <NavLink to={to} role="tab" aria-selected={active} className={`rounded-lg px-4 py-1.5 ${active ? 'bg-white text-river-800 shadow-sm' : 'text-slate-600'}`}>
      {children}
    </NavLink>
  );
}

function CatchList() {
  const { user } = useAuth();
  const { location } = useLocation();
  const { catches, loaded } = useData();
  const routerLocation = useRouterLocation();
  const [species, setSpecies] = useState('');
  const [spot, setSpot] = useState('');
  const [q, setQ] = useState('');
  const [filling, setFilling] = useState(false);

  const speciesList = useMemo(() => [...new Set(catches.map((c) => c.species))].sort(), [catches]);
  const spotList = useMemo(() => [...new Set(catches.map((c) => c.spotName).filter(Boolean))].sort(), [catches]);
  const pending = catches.filter((c) => c.conditionsPending);

  const filtered = catches
    .filter((c) => !species || c.species === species)
    .filter((c) => !spot || c.spotName === spot)
    .filter((c) => !q || `${c.notes} ${c.bait} ${c.species} ${c.spotName}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));

  async function onDelete(c) {
    if (window.confirm(`Delete this ${c.species} from ${c.date}? This can't be undone.`)) {
      await deleteCatch(user.uid, c.id);
    }
  }

  async function fillMissing() {
    setFilling(true);
    for (const c of pending) {
      const env = await buildConditions({ date: c.date, time: c.time, lat: c.lat, lng: c.lng }, location);
      if (!env.conditionsPending) await updateCatch(user.uid, c.id, env);
    }
    setFilling(false);
  }

  if (!loaded) return <div className="card h-40 animate-pulse" />;
  if (!catches.length) {
    return (
      <EmptyState title="No catches yet" action={<Link to="/log" className="btn-primary mt-2">+ Log your first catch</Link>}>
        Every fish counts, even tiny bluegill! The more you log, the smarter your Insights get.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-3">
      {routerLocation.state?.saved && <Callout tone="emerald" icon="✅">Catch saved! Nice work.</Callout>}
      {pending.length > 0 && (
        <Callout tone="amber" icon="📶" title={`${pending.length} catch${pending.length > 1 ? 'es are' : ' is'} missing weather data`}>
          They were logged offline.{' '}
          <button type="button" onClick={fillMissing} disabled={filling} className="font-semibold underline">
            {filling ? 'Fetching…' : 'Fetch it now'}
          </button>
        </Callout>
      )}
      <div className="grid gap-2 sm:grid-cols-3">
        <select value={species} onChange={(e) => setSpecies(e.target.value)} className="input" aria-label="Filter by species">
          <option value="">All species</option>
          {speciesList.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={spot} onChange={(e) => setSpot(e.target.value)} className="input" aria-label="Filter by spot">
          <option value="">All spots</option>
          {spotList.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} className="input" placeholder="Search notes, baits…" aria-label="Search" />
      </div>
      <p className="text-sm text-slate-500">{filtered.length} of {catches.length} catches</p>
      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((c) => <CatchCard key={c.id} c={c} onDelete={onDelete} />)}
      </div>
    </div>
  );
}
