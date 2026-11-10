// USGS Water Services (https://waterservices.usgs.gov): free, no key, US only.
// Instead of hard-coding gauge numbers we ask USGS for every active stream gauge in
// the location's bounding box (location.usgs.bbox), then rank the main river first
// (location.usgs.preferName, e.g. "cumberland" for Clarksville).
import { cachedFetchJson } from './cache.js';

const PARAMS = { '00060': 'flow', '00065': 'stage', '00010': 'waterTemp' };

export async function getRiverGauges(location) {
  const cfg = location?.usgs;
  if (!cfg?.bbox) return { fetchedAt: Date.now(), stale: false, sites: [] };
  const url = `https://waterservices.usgs.gov/nwis/iv/?format=json&bBox=${cfg.bbox}`
    + `&parameterCd=${Object.keys(PARAMS).join(',')}&siteType=ST&siteStatus=active&period=PT24H`;
  const { data, fetchedAt, stale } = await cachedFetchJson(`usgs:${location.id}`, url, 60 * 60 * 1000);

  const sites = new Map();
  for (const ts of data?.value?.timeSeries || []) {
    const code = ts.sourceInfo.siteCode[0].value;
    const param = PARAMS[ts.variable.variableCode[0].value];
    const vals = (ts.values?.[0]?.value || []).filter((v) => v.value !== '' && +v.value > -999990);
    if (!param || !vals.length) continue;
    const loc = ts.sourceInfo.geoLocation?.geogLocation;
    const site = sites.get(code) || {
      code,
      name: titleCase(ts.sourceInfo.siteName),
      lat: loc?.latitude,
      lng: loc?.longitude,
      url: `https://waterdata.usgs.gov/monitoring-location/${code}/`,
    };
    const latest = +vals[vals.length - 1].value;
    const first = +vals[0].value;
    let value = latest;
    if (param === 'waterTemp') value = +(latest * 9 / 5 + 32).toFixed(1); // °C -> °F
    site[param] = {
      value,
      unit: { flow: 'cfs', stage: 'ft', waterTemp: '°F' }[param],
      at: vals[vals.length - 1].dateTime,
      change24h: param === 'waterTemp' ? null : +(latest - first).toFixed(2),
    };
    sites.set(code, site);
  }
  const prefer = new RegExp(cfg.preferName || '^$', 'i');
  const list = [...sites.values()].sort((a, b) => score(b, prefer) - score(a, prefer));
  return { fetchedAt, stale, sites: list };
}

const score = (s, prefer) => (prefer.test(s.name) ? 10 : 0) + (s.flow ? 2 : 0) + (s.stage ? 1 : 0);

function titleCase(s = '') {
  return s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase()).replace(/\bTn\b/, 'TN').replace(/\bNr\b/, 'near');
}

export function riverTrendLabel(reading) {
  if (!reading || reading.change24h == null) return null;
  const pct = reading.value ? reading.change24h / Math.max(1, reading.value - reading.change24h) : 0;
  if (pct > 0.1) return 'rising';
  if (pct < -0.1) return 'falling';
  return 'steady';
}
