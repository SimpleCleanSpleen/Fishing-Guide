import { Link } from 'react-router-dom';
import ConditionsCard from '../components/ConditionsCard.jsx';
import RiverCard from '../components/RiverCard.jsx';
import CatchCard from '../components/CatchCard.jsx';
import InfoTip from '../components/InfoTip.jsx';
import { Badge, Callout, LinkCard, StatCard } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import { useForecast, useGauges, useMoon } from '../utils/useConditions.js';
import { activityLabel, bitingNow } from '../services/bitingNow.js';
import { overview } from '../services/analytics.js';
import { TIME_LABELS } from '../data/species.js';
import { GLOSSARY } from '../data/basics.js';
import { fmtWeight } from '../utils/time.js';

export default function Home() {
  const { user } = useAuth();
  const { location } = useLocation();
  const { catches } = useData();
  const forecast = useForecast(location);
  const gauges = useGauges(location);
  const moon = useMoon();
  const today = forecast.data?.days?.[0];
  const biting = bitingNow(location, catches, { sunrise: today?.sunrise, sunset: today?.sunset });
  const stats = overview(catches);
  const tip = tipOfTheDay();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting()}{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-sm text-slate-500">Your fishing guide for {location.name} · {location.region}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <ConditionsCard forecast={forecast} moon={moon} gauge={gauges.data?.sites?.[0]} locationName={location.name} />

        <section className="card" aria-label="What's biting now">
          <h2 className="flex items-center gap-1 font-semibold">
            🐟 What&apos;s biting now
            <InfoTip>
              Species ranked for {biting.monthName}, {TIME_LABELS[biting.bucket]?.toLowerCase()}, from general seasonal patterns,
              boosted by your own catches this month. Tap a fish for its full guide page.
            </InfoTip>
          </h2>
          <p className="text-xs text-slate-500">{biting.monthName} · {TIME_LABELS[biting.bucket]}</p>
          <ul className="mt-2 divide-y divide-slate-100">
            {biting.rows.slice(0, 6).map((r) => {
              const a = activityLabel(r.score);
              return (
                <li key={r.name}>
                  <Link to={`/fish/${encodeURIComponent(r.name)}`} className="flex items-center gap-3 py-2 hover:bg-slate-50">
                    <span className="text-xl" aria-hidden>{r.sp.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{r.name}{r.caught && <span className="ml-1 text-xs text-emerald-600" title="You've caught this species">✓</span>}</span>
                      <span className="block truncate text-xs text-slate-500">Try: {r.sp.baits[0]}</span>
                    </span>
                    <Badge tone={a.tone}>{a.label}</Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link to="/fish" className="mt-2 inline-block text-sm font-medium text-river-700">Open the Fish Guide →</Link>
        </section>
      </div>

      <RiverCard gauges={gauges} />

      {user && catches.length > 0 && (
        <section aria-label="Your stats">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Your season</h2>
            <Link to="/journal/insights" className="text-sm font-medium text-river-700">See insights →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon="🎣" label="Catches" value={stats.total} hint={`${stats.thisMonth} this month`} />
            <StatCard icon="📖" label="Species" value={`${stats.speciesCount}/${location.commonSpecies.length}`} hint="in the Fish Guide" />
            <StatCard icon="🏆" label="Biggest" value={stats.biggest ? fmtWeight(stats.biggest.weightLb) : '–'} hint={stats.biggest?.species} />
            <StatCard icon="🪝" label="Top bait" value={<span className="text-base">{stats.topBait || '–'}</span>} />
          </div>
          <div className="mt-3 space-y-2">
            {catches.slice(0, 3).map((c) => <CatchCard key={c.id} c={c} compact />)}
          </div>
        </section>
      )}

      {(!user || catches.length === 0) && (
        <Callout icon="📝" title="Log your first catch">
          Every catch you log records the weather, pressure, moon and river level automatically. After a few trips,
          Insights will tell you <b>when</b> and <b>with what bait</b> you catch each fish best.{' '}
          <Link to="/log" className="font-semibold underline">Log a catch</Link>
        </Callout>
      )}

      <Callout icon="🎓" title={`Tip of the day: ${tip[0]}`}>{tip[1]}</Callout>

      <div className="grid gap-3 sm:grid-cols-3">
        <LinkCard to="/learn/basics" icon="🎯" title="Fishing Basics">Casting, hook sets, handling and release.</LinkCard>
        <LinkCard to="/learn/gear" icon="🧰" title="My Tackle Box">When & how to use every item you own.</LinkCard>
        <LinkCard to="/learn/safety" icon="⚠️" title="Safety, Advisories & Rules">Fish consumption advisories and license info.</LinkCard>
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function tipOfTheDay() {
  const entries = Object.entries(GLOSSARY);
  const day = Math.floor(Date.now() / 86400000);
  return entries[day % entries.length];
}
