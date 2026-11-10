import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import InfoTip from '../components/InfoTip.jsx';
import { Badge, Bars, Callout, EmptyState, StatCard } from '../components/ui.jsx';
import { useData } from '../context/DataContext.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import { TIME_LABELS } from '../data/species.js';
import { countBy, overview, ranked, speciesInsights } from '../services/analytics.js';
import { fmtWeight } from '../utils/time.js';

export default function Insights() {
  const { catches, loaded } = useData();
  const { location } = useLocation();
  const stats = overview(catches);
  const speciesList = useMemo(() => ranked(countBy(catches, (c) => c.species)).map((r) => r.key), [catches]);
  const [picked, setPicked] = useState('');
  const species = picked || speciesList[0] || location.commonSpecies[0];

  if (!loaded) return <div className="card h-40 animate-pulse" />;
  if (!catches.length) {
    return (
      <EmptyState icon="📊" title="Insights unlock as you log" action={<Link to="/log" className="btn-primary mt-2">+ Log a catch</Link>}>
        Log a few catches and this page will show your best time of day, best season and most successful bait for each fish,
        plus the weather patterns that worked for you.
      </EmptyState>
    );
  }

  const byHour = Array.from({ length: 24 }, (_, h) => ({
    key: String(h),
    label: `${((h + 11) % 12) + 1}${h < 12 ? 'a' : 'p'}`,
    value: catches.filter((c) => Number(c.time?.split(':')[0]) === h).length,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon="🎣" label="Catches" value={stats.total} hint={`${stats.released} released`} />
        <StatCard icon="📖" label="Species" value={stats.speciesCount} />
        <StatCard icon="⚖️" label="Total weight" value={fmtWeight(stats.totalWeight)} />
        <StatCard icon="📍" label="Top spot" value={<span className="text-base">{stats.topSpot || '–'}</span>} />
      </div>

      <section className="card">
        <h2 className="flex items-center gap-1 font-semibold">⏰ When you catch fish (all species)
          <InfoTip>Your catches by hour of the day. Remember this also reflects when you go fishing, so try different times too!</InfoTip>
        </h2>
        <HourChart rows={byHour} />
      </section>

      <section className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">🎯 Species breakdown</h2>
          <select value={species} onChange={(e) => setPicked(e.target.value)} className="input w-auto" aria-label="Choose species">
            {[...new Set([...speciesList, ...location.commonSpecies])].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <SpeciesInsightPanel catches={catches} species={species} />
      </section>

      <Callout icon="🧪" title="How these recommendations work">
        For each fish we start with general guide knowledge (seasonal and daily patterns), then add your own catches on top.
        With only a few catches the guide leads; after about 10 catches of a species your own results take over.
        Everything is calculated on your device.
      </Callout>
    </div>
  );
}

export function SpeciesInsightPanel({ catches, species }) {
  const ins = speciesInsights(catches, species);
  const timeRows = ins.time.rows.map((r) => ({ key: r.key, label: TIME_LABELS[r.key], value: r.pct, sub: r.mine ? `${r.mine} 🐟` : '' }));
  const monthRows = ins.month.rows.map((r) => ({ key: r.key, value: r.pct, sub: r.mine ? `${r.mine} 🐟` : '' }));
  const toneMap = { slate: 'slate', amber: 'amber', sky: 'sky', emerald: 'emerald' };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-river-50 p-4 ring-1 ring-river-200">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-river-900">Best plan for {species}</p>
          <Badge tone={toneMap[ins.confidence.tone]}>{ins.confidence.label}</Badge>
        </div>
        <p className="text-xs text-river-800">{ins.confidence.detail}</p>
        <dl className="mt-3 grid gap-3 sm:grid-cols-3">
          <Rec label="Time of day" value={ins.recommendation.time} />
          <Rec label="Time of year" value={`${ins.recommendation.season} (peak ${ins.recommendation.month})`} />
          <Rec label={ins.recommendation.baitFromMyData ? 'Your best bait' : 'Suggested bait'} value={ins.recommendation.bait || 'Any small natural bait'} />
        </dl>
        {ins.recommendation.spot && <p className="mt-2 text-sm text-river-900">📍 Your best spot: <b>{ins.recommendation.spot}</b></p>}
        {ins.prior.tip && <p className="mt-2 text-sm text-river-900">💡 {ins.prior.tip}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-2 flex items-center gap-1 text-sm font-semibold text-slate-700">Time of day
            <InfoTip>Bar length = combined score (guide + your catches). Numbers show your catches in that window.</InfoTip>
          </h3>
          <Bars rows={timeRows} format={() => ''} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Month</h3>
          <Bars rows={monthRows} format={() => ''} />
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Baits that worked</h3>
        {ins.baits.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500"><th className="py-1">Bait</th><th>Catches</th><th>Avg weight</th></tr></thead>
              <tbody>
                {ins.baits.map((b, i) => (
                  <tr key={b.key} className="border-t border-slate-100">
                    <td className="py-1.5">{i === 0 && '🏆 '}{b.key}</td>
                    <td>{b.count}</td>
                    <td>{b.avgWeight ? fmtWeight(b.avgWeight) : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No {species} logged yet. Guide picks: {ins.prior.baits.join(', ') || '–'}.</p>
        )}
      </div>

      {ins.n > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-1 text-sm font-semibold text-slate-700">Conditions when you caught them
            <InfoTip>Recorded automatically from Open-Meteo (weather), USGS (river) and the moon calendar at the time of each catch.</InfoTip>
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Pattern title="Pressure trend" rows={ins.conditions.pressure} />
            <Pattern title="Sky" rows={ins.conditions.sky} />
            <Pattern title="Air temperature" rows={ins.conditions.temp} />
            <Pattern title="Moon phase" rows={ins.conditions.moon} />
            <Pattern title="River flow" rows={ins.conditions.river} />
            <Pattern title="Spots" rows={ins.spots} />
          </div>
        </div>
      )}
    </div>
  );
}

function Rec({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-river-100">
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-900">{value || '–'}</dd>
    </div>
  );
}

function Pattern({ title, rows }) {
  if (!rows.length) return null;
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <Bars rows={rows.slice(0, 4).map((r) => ({ key: r.key, value: r.count }))} />
    </div>
  );
}

function HourChart({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="mt-3">
      <div className="flex h-28 items-end gap-0.5" role="img" aria-label="Catches by hour of day">
        {rows.map((r) => (
          <div key={r.key} className="flex h-full flex-1 items-end" title={`${r.label}: ${r.value}`}>
            <div className={`w-full rounded-t ${r.value === max && r.value > 0 ? 'bg-river-600' : 'bg-river-200'}`} style={{ height: `${(r.value / max) * 100}%`, minHeight: r.value ? 4 : 1 }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        <span>12a</span><span>6a</span><span>12p</span><span>6p</span><span>11p</span>
      </div>
      <p className="mt-2 text-xs text-slate-500">Tip: your dawn/dusk windows today are on the Home screen.</p>
    </div>
  );
}

