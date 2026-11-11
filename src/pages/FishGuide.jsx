import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, PageHeader } from '../components/ui.jsx';
import FishIcon from '../components/FishIcon.jsx';
import InfoTip from '../components/InfoTip.jsx';
import { useData } from '../context/DataContext.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import { dexNo, SPECIES } from '../data/species.js';
import { IDENTIFY } from '../data/identify.js';
import { activityLabel, bitingNow } from '../services/bitingNow.js';
import { fmtWeight } from '../utils/time.js';

export default function FishGuide() {
  const { location } = useLocation();
  const { catches } = useData();
  const [sort, setSort] = useState('active');
  const biting = bitingNow(location, catches);
  const caught = biting.rows.filter((r) => r.caught).length;
  const total = biting.rows.length;
  const rows = sort === 'active' ? biting.rows
    : sort === 'dex' ? [...biting.rows].sort((a, b) => (dexNo(a.name) || '999').localeCompare(dexNo(b.name) || '999'))
      : [...biting.rows].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <PageHeader title="Fish Guide" subtitle={`Every fish you can catch around ${location.name}`}>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="input w-auto py-1.5 text-sm" aria-label="Sort">
          <option value="active">Most active now</option>
          <option value="dex">Dex No.</option>
          <option value="az">A-Z</option>
        </select>
      </PageHeader>

      <div className="card mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 font-semibold">Collection: {caught} / {total} species caught
            <InfoTip>Like the fish log in a fishing game: every species you log here gets checked off. Try to catch them all!</InfoTip>
          </span>
          <span className="text-river-700">{Math.round((caught / total) * 100)}%</span>
        </div>
        {/* One block per species, like a game's collection meter. */}
        <div className="mt-2 flex gap-1" aria-hidden>
          {biting.rows.map((r) => (
            <span key={r.name} title={r.name} className={`h-3 flex-1 rounded-sm ${r.caught ? 'bg-river-600 shadow-[inset_0_-2px_0_rgb(0_0_0/0.2)]' : 'bg-slate-200'}`} />
          ))}
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {rows.map((r) => {
          const a = activityLabel(r.score);
          const mine = catches.filter((c) => c.species === r.name);
          const best = mine.reduce((b, c) => (+c.weightLb > +(b?.weightLb || 0) ? c : b), null);
          return (
            <li key={r.name}>
              <Link to={`/fish/${encodeURIComponent(r.name)}`} className="card flex h-full flex-col gap-1 p-3 transition hover:ring-river-300">
                <div className="flex items-start justify-between">
                  <Badge tone={a.tone}>{a.label}</Badge>
                  {dexNo(r.name) && <span className="font-pixel text-xs text-slate-500">No.{dexNo(r.name)}</span>}
                </div>
                <div className="lcd flex h-16 items-center justify-center rounded-lg">
                  <FishIcon name={r.name} size={96} className="max-h-14 w-auto" />
                </div>
                <span className="font-semibold leading-tight">{r.name}</span>
                <span className="text-xs text-slate-500">{(SPECIES[r.name] || SPECIES.Other).group} · {IDENTIFY[r.name]?.size?.split(';')[0] || ''}</span>
                <span className="mt-auto pt-1 text-xs font-medium">
                  {r.caught
                    ? <span className="text-emerald-700">✓ Caught {mine.length}×{best?.weightLb ? ` · PB ${fmtWeight(best.weightLb)}` : ''}</span>
                    : <span className="text-slate-400">Not caught yet</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
