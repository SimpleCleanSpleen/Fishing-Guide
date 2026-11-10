// "What's biting now": rank the location's common species for the current month and
// time of day, like the activity charts in fishing games, using guide knowledge
// boosted by your own catches.
import { MONTHS, SPECIES, TIME_BUCKETS } from '../data/species.js';
import { timeOfDay, nowHHMM } from '../utils/time.js';

export function bitingNow(location, catches, { sunrise, sunset, date = new Date() } = {}) {
  const month = date.getMonth();
  const bucket = timeOfDay(nowHHMM(date), sunrise, sunset);
  const tIdx = TIME_BUCKETS.indexOf(bucket);
  const rows = (location.commonSpecies || []).map((name) => {
    const sp = SPECIES[name] || SPECIES.Other;
    const mine = catches.filter((c) => c.species === name);
    const mineMonth = mine.filter((c) => Number(c.date?.split('-')[1]) - 1 === month).length;
    const guide = sp.monthWeights[month] * (0.5 + 0.5 * sp.timeWeights[tIdx]);
    const score = guide + Math.min(0.5, mineMonth * 0.1);
    return { name, sp, score, guide, mineMonth, caught: mine.length > 0 };
  });
  return { bucket, monthName: MONTHS[month], rows: rows.sort((a, b) => b.score - a.score) };
}

export function activityLabel(score) {
  if (score >= 0.8) return { label: 'Hot', tone: 'rose' };
  if (score >= 0.55) return { label: 'Active', tone: 'emerald' };
  if (score >= 0.3) return { label: 'Fair', tone: 'amber' };
  return { label: 'Slow', tone: 'slate' };
}
