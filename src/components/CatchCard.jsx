import { Link } from 'react-router-dom';
import { SPECIES, TIME_LABELS } from '../data/species.js';
import FishIcon from './FishIcon.jsx';
import { fmtDate, fmtWeight } from '../utils/time.js';

export default function CatchCard({ c, onDelete, compact = false }) {
  const sp = SPECIES[c.species] || SPECIES.Other;
  return (
    <article className="card flex gap-3 p-3">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-river-50">
        {c.photo
          ? <img src={c.photo} alt={`${c.species} catch`} className="h-full w-full object-cover" loading="lazy" />
          : <div className="flex h-full items-center justify-center p-1"><FishIcon name={c.species} size={72} /></div>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold">{c.species}</h3>
          <span className="shrink-0 text-sm font-semibold text-river-800">{fmtWeight(c.weightLb)}</span>
        </div>
        <p className="text-xs text-slate-500">
          {fmtDate(c.date)}{c.time ? ` · ${c.time}` : ''}{c.timeOfDay ? ` (${TIME_LABELS[c.timeOfDay]})` : ''}
          {c.lengthIn ? ` · ${c.lengthIn}"` : ''}
        </p>
        <p className="mt-0.5 truncate text-sm text-slate-600">
          {c.bait && <>🎣 {c.bait}</>}{c.spotName && <> · 📍 {c.spotName}</>}
        </p>
        {!compact && c.notes && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{c.notes}</p>}
        {!compact && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            {c.released && <span className="chip">🔄 Released</span>}
            {c.conditions?.pressureTrend && <span className="chip">Pressure {c.conditions.pressureTrend}</span>}
            {c.conditions?.tempF != null && <span className="chip">{Math.round(c.conditions.tempF)}°F</span>}
            {c.conditions?.moon && <span className="chip">{c.conditions.moon}</span>}
            <span className="ml-auto flex gap-3">
              <Link to={`/log/${c.id}`} className="font-medium text-river-700">Edit</Link>
              {onDelete && <button type="button" onClick={() => onDelete(c)} className="font-medium text-rose-600">Delete</button>}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
