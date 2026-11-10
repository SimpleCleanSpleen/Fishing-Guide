import InfoTip from './InfoTip.jsx';
import { Badge } from './ui.jsx';
import { compass, describeWeather } from '../services/weather.js';
import { fishingOutlook } from '../services/analytics.js';
import { fmtClock } from '../utils/time.js';

const SCORE_COLORS = ['', 'bg-rose-500', 'bg-orange-400', 'bg-amber-400', 'bg-emerald-500', 'bg-emerald-600'];

export default function ConditionsCard({ forecast, moon, gauge, locationName }) {
  const { data, error, loading } = forecast;
  if (loading) return <div className="card h-56 animate-pulse" />;
  if (error || !data) {
    return (
      <div className="card text-sm text-slate-500">
        Couldn&apos;t load weather right now{error ? ` (${error.message})` : ''}. Check your connection and try again later.
      </div>
    );
  }
  const c = data.current;
  const today = data.days[0];
  const w = describeWeather(c.weatherCode);
  const outlook = fishingOutlook({ forecast: data, moon, gauge });

  return (
    <section className="card overflow-hidden p-0" aria-label="Today's fishing conditions">
      <div className="bg-gradient-to-br from-river-700 to-river-900 p-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-river-100">{locationName} · right now</p>
            <p className="mt-1 text-4xl font-bold">{Math.round(c.tempF)}°F <span className="text-3xl" aria-hidden>{w.emoji}</span></p>
            <p className="text-sm text-river-100">{w.label} · feels {Math.round(c.feelsF)}° · H {Math.round(today.hiF)}° L {Math.round(today.loF)}°</p>
          </div>
          {outlook && (
            <div className="text-right">
              <p className="flex items-center justify-end gap-1 text-xs uppercase tracking-wide text-river-100">
                Fishing outlook
                <InfoTip>A simple 1-5 rating from pressure trend, clouds, wind, temperature, moon phase and river flow. The reasons below explain it.</InfoTip>
              </p>
              <div className="mt-1 flex justify-end gap-1" aria-label={`${outlook.score} out of 5`}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className={`h-2.5 w-5 rounded-full ${i <= outlook.score ? SCORE_COLORS[outlook.score] : 'bg-white/20'}`} />
                ))}
              </div>
              <p className="mt-1 text-lg font-semibold">{outlook.label}</p>
            </div>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-px bg-slate-200 text-sm sm:grid-cols-4">
        <Stat label="Pressure" tip="Barometric (air) pressure. Falling pressure before a storm often triggers feeding; right after a cold front (rising) bites slow down.">
          {c.pressureInHg} inHg {c.pressureTrend && <TrendBadge trend={c.pressureTrend} />}
        </Stat>
        <Stat label="Wind" tip="A light breeze (5-15 mph) helps by rippling the surface. Fish the bank the wind blows toward: it pushes food there.">
          {Math.round(c.windMph)} mph {compass(c.windDir)}
        </Stat>
        <Stat label="Sun" tip="The hour around sunrise and the last two hours before sunset are usually the best bite windows.">
          ↑ {fmtClock(today.sunrise)} · ↓ {fmtClock(today.sunset)}
        </Stat>
        <Stat label="Moon" tip="Solunar theory: fish may be more active around new and full moons. It's a small factor compared to weather.">
          {moon.emoji} {moon.name}
        </Stat>
      </dl>

      {outlook && (
        <ul className="space-y-1.5 p-4 text-sm">
          {outlook.reasons.map(([sign, text]) => (
            <li key={text} className="flex gap-2">
              <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${sign === '+' ? 'bg-emerald-100 text-emerald-700' : sign === '-' ? 'bg-amber-100 text-amber-700' : sign === '!' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{sign}</span>
              <span>{text}</span>
            </li>
          ))}
          {today.rainChance != null && <li className="pl-7 text-xs text-slate-500">Rain chance today: {today.rainChance}% · UV {Math.round(today.uv ?? 0)}</li>}
          <li className="pl-7 text-xs text-slate-400">Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="underline">Open-Meteo.com</a></li>
          {data.stale && <li className="pl-7 text-xs text-amber-700">Showing saved data from {new Date(data.fetchedAt).toLocaleString()}.</li>}
        </ul>
      )}
    </section>
  );
}

function Stat({ label, tip, children }) {
  return (
    <div className="bg-white p-3">
      <dt className="flex items-center gap-1 text-xs text-slate-500">{label} <InfoTip>{tip}</InfoTip></dt>
      <dd className="mt-0.5 font-medium text-slate-900">{children}</dd>
    </div>
  );
}

export function TrendBadge({ trend }) {
  const map = { rising: ['↗ rising', 'sky'], falling: ['↘ falling', 'amber'], steady: ['→ steady', 'slate'] };
  const [label, tone] = map[trend] || [trend, 'slate'];
  return <Badge tone={tone}>{label}</Badge>;
}
