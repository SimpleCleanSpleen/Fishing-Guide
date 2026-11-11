import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import RequireAuth from '../components/RequireAuth.jsx';
import { Callout, PageHeader } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { claimUsername, USERNAME_RE } from '../services/repository.js';

export default function Profile() {
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Your profile" subtitle="Your username is how other anglers find and invite you." />
      <RequireAuth reason="Sign in to pick a username, plan trips and share spots.">
        <UsernameForm />
      </RequireAuth>
    </div>
  );
}

function UsernameForm() {
  const { user, profile, username } = useAuth();
  const { trips, customSpots, catches } = useData();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next');
  const [name, setName] = useState(username || '');
  const [err, setErr] = useState(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (username) setName(username); }, [username]);

  const valid = USERNAME_RE.test(name.trim());
  const unchanged = name.trim() === username;

  async function save(e) {
    e.preventDefault();
    setErr(null); setSaved(false);
    if (!valid) { setErr('Use 3-20 letters, numbers or underscores (no spaces).'); return; }
    setBusy(true);
    try {
      await claimUsername(user.uid, name.trim(), username);
      setSaved(true);
      if (next && next.startsWith('/')) navigate(next);
    } catch (e2) {
      setErr(e2.code === 'permission-denied' ? 'That username is taken. Try another one.' : e2.message);
    } finally {
      setBusy(false);
    }
  }

  if (profile === null) return <div className="card animate-pulse py-10 text-center text-slate-400">Loading…</div>;

  return (
    <div className="space-y-4">
      {!username && (
        <Callout tone="sky" icon="👋" title="Pick a username">
          Friends type it to invite you on trips, and it's shown next to any spot you share on the map.
        </Callout>
      )}
      <form onSubmit={save} className="card space-y-3">
        <label htmlFor="username" className="block text-sm font-semibold">Username</label>
        <div className="flex items-center gap-1 rounded-xl ring-1 ring-slate-300 focus-within:ring-2 focus-within:ring-river-500">
          <span className="pl-3 text-slate-400">@</span>
          <input
            id="username"
            className="w-full bg-transparent py-2.5 pr-3 outline-none"
            value={name}
            onChange={(e) => { setName(e.target.value.replace(/\s/g, '')); setSaved(false); }}
            placeholder="bass_master"
            maxLength={20}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
          />
        </div>
        <p className="text-xs text-slate-500">3-20 letters, numbers or underscores. Names are unique, ignoring capitals.</p>
        {err && <p className="text-sm text-rose-600">{err}</p>}
        {saved && <p className="text-sm text-emerald-700">Saved! You're @{username || name.trim()}.</p>}
        <button type="submit" disabled={busy || !valid || unchanged} className="btn-primary w-full">
          {busy ? 'Saving…' : username ? 'Change username' : 'Claim username'}
        </button>
        {username && <p className="text-xs text-slate-500">Changing it frees your old name. Spots you already shared keep the name they were shared under.</p>}
      </form>

      <div className="card grid grid-cols-3 gap-2 text-center text-sm">
        <Link to="/trips" className="rounded-xl p-2 hover:bg-slate-50"><span className="block text-xl font-bold">{trips.length}</span>Trips</Link>
        <Link to="/map" className="rounded-xl p-2 hover:bg-slate-50"><span className="block text-xl font-bold">{customSpots.length}</span>Spots here</Link>
        <Link to="/journal" className="rounded-xl p-2 hover:bg-slate-50"><span className="block text-xl font-bold">{catches.length}</span>Catches here</Link>
      </div>
    </div>
  );
}
