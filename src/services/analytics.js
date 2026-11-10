// All analytics run in the browser (no Cloud Functions needed).
// Recommendation method, in plain words:
//   score(option) = PRIOR_STRENGTH x guide-knowledge weight  +  your catches with that option
// With 0-2 catches the guide knowledge leads; by ~10 catches your own data dominates.
import { MONTHS, SPECIES, TIME_BUCKETS, TIME_LABELS } from '../data/species.js';
import { moonPhase } from './moon.js';

const PRIOR_STRENGTH = 3;

export const SEASONS = {
  Winter: [11, 0, 1], Spring: [2, 3, 4], Summer: [5, 6, 7], Fall: [8, 9, 10],
};
export const seasonOf = (monthIdx) => Object.keys(SEASONS).find((s) => SEASONS[s].includes(monthIdx));
export const monthOf = (c) => (c.date ? Number(c.date.split('-')[1]) - 1 : null);

export function countBy(items, keyFn) {
  const out = {};
  for (const it of items) {
    const k = keyFn(it);
    if (k == null || k === '') continue;
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

export function ranked(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([key, count]) => ({ key, count }));
}

export function skyOf(cloudCover) {
  if (cloudCover == null) return null;
  if (cloudCover < 30) return 'Sunny';
  if (cloudCover < 70) return 'Partly cloudy';
  return 'Overcast';
}

export function tempBand(f) {
  if (f == null) return null;
  if (f < 45) return 'Cold (<45°F)';
  if (f < 60) return 'Cool (45-60°F)';
  if (f < 75) return 'Mild (60-75°F)';
  if (f < 88) return 'Warm (75-88°F)';
  return 'Hot (88°F+)';
}

export function moonOf(c) {
  if (c.conditions?.moon) return c.conditions.moon;
  if (!c.date) return null;
  const [y, m, d] = c.date.split('-').map(Number);
  return moonPhase(new Date(y, m - 1, d, 12)).name;
}

export function overview(catches) {
  const weights = catches.filter((c) => +c.weightLb > 0);
  const biggest = weights.reduce((best, c) => (!best || +c.weightLb > +best.weightLb ? c : best), null);
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return {
    total: catches.length,
    speciesCount: new Set(catches.map((c) => c.species)).size,
    biggest,
    totalWeight: weights.reduce((s, c) => s + +c.weightLb, 0),
    thisMonth: catches.filter((c) => c.date?.startsWith(ym)).length,
    released: catches.filter((c) => c.released).length,
    topSpecies: ranked(countBy(catches, (c) => c.species))[0]?.key,
    topSpot: ranked(countBy(catches, (c) => c.spotName))[0]?.key,
    topBait: ranked(countBy(catches, (c) => c.bait))[0]?.key,
  };
}

function blend(priorWeights, keys, userCounts) {
  const n = Object.values(userCounts).reduce((s, v) => s + v, 0);
  const rows = keys.map((k, i) => {
    const prior = priorWeights?.[i] ?? 0.5;
    const mine = userCounts[k] || 0;
    return { key: k, prior, mine, score: prior * PRIOR_STRENGTH + mine };
  });
  const max = Math.max(...rows.map((r) => r.score), 0.0001);
  rows.forEach((r) => { r.pct = r.score / max; });
  return { rows, n };
}

export function confidence(n) {
  if (n === 0) return { label: 'Guide knowledge only', tone: 'slate', detail: 'Log catches of this fish to personalize.' };
  if (n < 5) return { label: 'Early pattern', tone: 'amber', detail: `Based on ${n} of your catches + guide knowledge.` };
  if (n < 15) return { label: 'Growing pattern', tone: 'sky', detail: `Based on ${n} of your catches + guide knowledge.` };
  return { label: 'Strong pattern', tone: 'emerald', detail: `Based mostly on your ${n} catches.` };
}

export function speciesInsights(catches, species) {
  const mine = catches.filter((c) => c.species === species);
  const prior = SPECIES[species] || SPECIES.Other;

  const time = blend(prior.timeWeights, TIME_BUCKETS, countBy(mine, (c) => c.timeOfDay));
  const month = blend(prior.monthWeights, MONTHS, countBy(mine, (c) => (monthOf(c) != null ? MONTHS[monthOf(c)] : null)));

  const seasonPrior = Object.keys(SEASONS).map((s) => avg(SEASONS[s].map((m) => prior.monthWeights[m])));
  const season = blend(seasonPrior, Object.keys(SEASONS), countBy(mine, (c) => (monthOf(c) != null ? seasonOf(monthOf(c)) : null)));

  // Baits: your results first (count + average weight), guide picks as fallback.
  const baitStats = {};
  for (const c of mine) {
    if (!c.bait) continue;
    const b = (baitStats[c.bait] ||= { key: c.bait, count: 0, weight: 0, weighed: 0 });
    b.count += 1;
    if (+c.weightLb > 0) { b.weight += +c.weightLb; b.weighed += 1; }
  }
  const baits = Object.values(baitStats)
    .map((b) => ({ ...b, avgWeight: b.weighed ? b.weight / b.weighed : null }))
    .sort((a, b) => b.count - a.count || (b.avgWeight || 0) - (a.avgWeight || 0));

  const conditions = {
    pressure: ranked(countBy(mine, (c) => c.conditions?.pressureTrend)),
    sky: ranked(countBy(mine, (c) => skyOf(c.conditions?.cloudCover))),
    temp: ranked(countBy(mine, (c) => tempBand(c.conditions?.tempF))),
    moon: ranked(countBy(mine, moonOf)),
    river: ranked(countBy(mine, (c) => c.conditions?.riverTrend)),
  };

  const bestTime = top(time.rows);
  const bestMonth = top(month.rows);
  const bestSeason = top(season.rows);

  return {
    species,
    n: mine.length,
    prior,
    confidence: confidence(mine.length),
    time,
    month,
    season,
    baits,
    spots: ranked(countBy(mine, (c) => c.spotName)),
    conditions,
    biggest: mine.reduce((b, c) => (+c.weightLb > +(b?.weightLb || 0) ? c : b), null),
    recommendation: {
      time: bestTime && TIME_LABELS[bestTime.key],
      month: bestMonth?.key,
      season: bestSeason?.key,
      bait: baits[0]?.key || prior.baits[0] || null,
      baitFromMyData: !!baits[0],
      spot: ranked(countBy(mine, (c) => c.spotName))[0]?.key || null,
    },
  };
}

const top = (rows) => rows.reduce((b, r) => (!b || r.score > b.score ? r : b), null);
const avg = (a) => a.reduce((s, v) => s + v, 0) / a.length;

// "Should I go today?" A simple, explainable 1-5 score from today's conditions.
export function fishingOutlook({ forecast, moon, gauge }) {
  if (!forecast) return null;
  const c = forecast.current;
  const reasons = [];
  let score = 3;

  if (c.pressureTrend === 'falling') { score += 1; reasons.push(['+', 'Pressure is falling: fish often feed actively before a front.']); }
  if (c.pressureTrend === 'rising') { score -= 0.5; reasons.push(['-', 'Pressure is rising after a front: bites can be slower. Fish slower and deeper.']); }
  if (c.pressureTrend === 'steady') reasons.push(['=', 'Pressure is steady: normal, predictable fishing.']);

  if (c.cloudCover >= 60) { score += 0.5; reasons.push(['+', 'Cloudy skies: fish roam more and are less spooky.']); }
  if (c.windMph >= 5 && c.windMph <= 15) { score += 0.5; reasons.push(['+', 'A light breeze ripples the water and hides your line.']); }
  if (c.windMph > 18) { score -= 1; reasons.push(['-', 'Strong wind makes casting and bite detection hard. Try a sheltered bank.']); }
  if (c.tempF < 40) { score -= 1; reasons.push(['-', 'Cold: fish are sluggish. Fish slowly, midday is best.']); }
  if (c.tempF > 92) { score -= 0.5; reasons.push(['-', 'Very hot: go early or late and stay hydrated.']); }
  if (moon?.major) { score += 0.5; reasons.push(['+', `${moon.name}: many anglers report more activity near new & full moons.`]); }
  if ([95, 96, 99].includes(c.weatherCode)) { score = 1; reasons.unshift(['!', 'Thunderstorms: stay off the water. Graphite & carbon rods conduct electricity!']); }

  const flow = gauge?.flow;
  if (flow?.change24h != null && flow.value) {
    const pct = flow.change24h / Math.max(1, flow.value - flow.change24h);
    if (pct > 0.25) { score -= 0.5; reasons.push(['-', 'River flow is rising fast: muddy water and strong current. Fish slack water near the bank.']); }
  }

  score = Math.max(1, Math.min(5, Math.round(score)));
  const labels = { 1: 'Stay home', 2: 'Tough', 3: 'Fair', 4: 'Good', 5: 'Great' };
  return { score, label: labels[score], reasons };
}
