// Adds environmental conditions to a catch (weather, pressure trend, moon, river).
import { getConditionsAt } from './weather.js';
import { getRiverGauges, riverTrendLabel } from './usgs.js';
import { moonPhase } from './moon.js';
import { timeOfDay, todayISO } from '../utils/time.js';

const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

export async function buildConditions({ date, time, lat, lng }, location) {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = (time || '12:00').split(':').map(Number);
  const moon = moonPhase(new Date(y, m - 1, d, hh, mm));
  const conditions = { moon: moon.name, moonIllumination: moon.illumination };
  let pending = false;

  try {
    const w = await withTimeout(getConditionsAt({ lat, lng }, date, time, location.timezone), 8000);
    if (w) Object.assign(conditions, w);
  } catch {
    pending = true; // offline: we'll fill it in later from the Journal
  }

  // River level is only meaningful for "live" logs (today).
  if (date === todayISO()) {
    try {
      const g = await withTimeout(getRiverGauges(location), 6000);
      const site = g.sites[0];
      if (site) {
        conditions.riverSite = site.name;
        conditions.riverFlowCfs = site.flow?.value ?? null;
        conditions.riverStageFt = site.stage?.value ?? null;
        conditions.riverTrend = riverTrendLabel(site.flow || site.stage);
        conditions.waterTempF = site.waterTemp?.value ?? null;
      }
    } catch { /* optional */ }
  }

  return {
    conditions,
    conditionsPending: pending,
    timeOfDay: timeOfDay(time, conditions.sunrise, conditions.sunset),
  };
}
