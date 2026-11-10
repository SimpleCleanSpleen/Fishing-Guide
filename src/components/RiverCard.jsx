import { useState } from 'react';
import InfoTip from './InfoTip.jsx';
import { TrendBadge } from './ConditionsCard.jsx';
import { riverTrendLabel } from '../services/usgs.js';

export default function RiverCard({ gauges }) {
  const [showAll, setShowAll] = useState(false);
  const { data, error, loading } = gauges;
  if (loading) return <div className="card h-32 animate-pulse" />;
  if (error) return <div className="card text-sm text-slate-500">River gauges unavailable right now ({error.message}).</div>;
  if (!data?.sites.length) return null;
  const list = showAll ? data.sites : data.sites.slice(0, 1);

  return (
    <section className="card" aria-label="River conditions">
      <h2 className="flex items-center gap-1 font-semibold">
        🌊 River & creek gauges
        <InfoTip>
          Live readings from USGS stream gauges. Flow (cfs = cubic feet per second) and stage (water height) that are rising fast
          mean muddy water and strong current: fish slack water close to the bank. Stable or slowly falling water is usually best.
        </InfoTip>
      </h2>
      <ul className="mt-2 divide-y divide-slate-100">
        {list.map((s) => (
          <li key={s.code} className="py-2">
            <a href={s.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-river-800 hover:underline">{s.name}</a>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {s.flow && <span>Flow <b>{s.flow.value.toLocaleString()}</b> cfs {riverTrendLabel(s.flow) && <TrendBadge trend={riverTrendLabel(s.flow)} />}</span>}
              {s.stage && <span>Stage <b>{s.stage.value}</b> ft {s.stage.change24h != null && <span className="text-xs text-slate-500">({s.stage.change24h >= 0 ? '+' : ''}{s.stage.change24h} ft / 24h)</span>}</span>}
              {s.waterTemp && <span>Water <b>{s.waterTemp.value}°F</b></span>}
            </div>
          </li>
        ))}
      </ul>
      {data.sites.length > 1 && (
        <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-1 text-sm font-medium text-river-700">
          {showAll ? 'Show less' : `Show ${data.sites.length - 1} more gauge${data.sites.length > 2 ? 's' : ''}`}
        </button>
      )}
      <p className="mt-2 text-xs text-slate-400">Source: USGS Water Services (provisional data){data.stale ? ' · saved copy' : ''}</p>
    </section>
  );
}
