import { Link, useParams } from 'react-router-dom';
import { Bars, Callout, PageHeader } from '../components/ui.jsx';
import FishIcon, { FishArtCredit } from '../components/FishIcon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import { dexNo, MONTHS, SPECIES, TIME_BUCKETS, TIME_LABELS } from '../data/species.js';
import { IDENTIFY } from '../data/identify.js';
import { useTackle } from '../utils/useTackle.js';
import { SpeciesInsightPanel } from './Insights.jsx';

export default function FishDetail() {
  const name = decodeURIComponent(useParams().species);
  const { user } = useAuth();
  const { location } = useLocation();
  const { catches, seedSpots } = useData();
  const sp = SPECIES[name] || SPECIES.Other;
  const tackle = useTackle();
  const id = IDENTIFY[name];
  const where = seedSpots.filter((s) => s.species?.some((x) => x === name || (name.includes('Catfish') && x === 'Catfish')));
  const now = new Date().getMonth();

  return (
    <div className="space-y-4">
      <Link to="/fish" className="text-sm font-medium text-river-700">← Fish Guide</Link>
      <PageHeader title={name} subtitle={`${dexNo(name) ? `No. ${dexNo(name)} · ` : ''}${sp.group}`} />
      <div className="card space-y-2 p-2">
        <div className="lcd flex items-center justify-center rounded-lg px-4 py-8">
          <FishIcon name={name} size={320} className="h-auto max-w-full drop-shadow-[0_4px_0_rgb(0_0_0/0.35)]" />
        </div>
        <div className="px-2 pb-1"><FishArtCredit name={name} /></div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card space-y-2 text-sm">
          <h2 className="font-semibold">How to recognize it</h2>
          <p>{id?.look || 'No description yet.'}</p>
          {id?.size && <p><b>Typical size:</b> {id.size}</p>}
          {id?.habitat && <p><b>Where it lives:</b> {id.habitat}</p>}
          {sp.tip && <Callout icon="💡">{sp.tip}</Callout>}
        </section>

        <section className="card space-y-2 text-sm">
          <h2 className="font-semibold">{tackle.personal ? 'Best baits from your tackle box' : 'Best baits to try'}</h2>
          <ul className="list-disc space-y-1 pl-5">{sp.baits.map((b) => <li key={b}>{tackle.bait(b)}</li>)}</ul>
          <Link to="/learn/gear" className="font-medium text-river-700">How to rig them →</Link>
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card">
          <h2 className="mb-2 font-semibold">Season (general pattern)</h2>
          <Bars rows={MONTHS.map((m, i) => ({ key: m, value: sp.monthWeights[i], sub: i === now ? 'now' : '' }))} format={() => ''} />
        </section>
        <section className="card">
          <h2 className="mb-2 font-semibold">Time of day (general pattern)</h2>
          <Bars rows={TIME_BUCKETS.map((b, i) => ({ key: b, label: TIME_LABELS[b], value: sp.timeWeights[i] }))} format={() => ''} />
        </section>
      </div>

      <section className="card">
        <h2 className="mb-2 font-semibold">Where to find it near {location.name}</h2>
        {where.length ? (
          <ul className="divide-y divide-slate-100">
            {where.map((s) => (
              <li key={s.id} className="py-2 text-sm">
                <Link to="/map" className="font-medium text-river-800">{s.name}</Link>
                <span className="text-slate-500"> · {s.type}</span>
                <p className="text-xs text-slate-500">{s.beginnerTip}</p>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-slate-500">Not listed at the suggested spots. Try the main river or ask at a local bait shop.</p>}
        <p className="mt-2 text-xs text-amber-700">Spot locations are approximate: verify before visiting.</p>
      </section>

      {user && (
        <section className="card">
          <h2 className="mb-3 font-semibold">Your {name} insights</h2>
          <SpeciesInsightPanel catches={catches} species={name} />
        </section>
      )}

      <Callout tone="amber" icon="📜" title="Size & creel limits">
        Limits for {name} vary by water body. Check the current {location.regulations.agency} rules before keeping any fish.{' '}
        <Link to="/learn/safety" className="font-semibold underline">Regulations & advisories</Link>
      </Callout>
    </div>
  );
}
