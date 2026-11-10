// Open-Meteo (https://open-meteo.com): free, no API key. We cache responses so a
// normal day of use makes only a handful of requests.
import { cachedFetchJson } from './cache.js';
import { daysBetween, todayISO } from '../utils/time.js';

const DEFAULT_TZ = 'America/Chicago';
const UNITS = 'temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch';
const HOURLY_VARS = 'temperature_2m,pressure_msl,cloud_cover,wind_speed_10m,precipitation,weather_code';

const r2 = (n) => Math.round(n * 100) / 100;
export const hPaToInHg = (h) => (h == null ? null : +(h * 0.02953).toFixed(2));

export function pressureTrend(nowHpa, earlierHpa) {
  if (nowHpa == null || earlierHpa == null) return null;
  const d = nowHpa - earlierHpa; // change over ~3 hours
  if (d > 1) return 'rising';
  if (d < -1) return 'falling';
  return 'steady';
}

// Current conditions + 3-day forecast for the home screen.
export async function getForecast({ lat, lng }, tz = DEFAULT_TZ) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${r2(lat)}&longitude=${r2(lng)}`
    + '&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m'
    + `&hourly=${HOURLY_VARS},precipitation_probability`
    + '&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,weather_code'
    + `&${UNITS}&timezone=${encodeURIComponent(tz)}&past_days=1&forecast_days=3`;
  const { data, fetchedAt, stale } = await cachedFetchJson(`fc:${r2(lat)},${r2(lng)}`, url, 30 * 60 * 1000);

  const cur = data.current;
  const times = data.hourly.time;
  const nowIdx = Math.max(0, times.findIndex((t) => t >= cur.time.slice(0, 13)));
  const earlier = data.hourly.pressure_msl[Math.max(0, nowIdx - 3)];
  const todayIdx = Math.max(0, data.daily.time.indexOf(cur.time.slice(0, 10)));

  return {
    fetchedAt,
    stale,
    current: {
      tempF: cur.temperature_2m,
      feelsF: cur.apparent_temperature,
      humidity: cur.relative_humidity_2m,
      precipIn: cur.precipitation,
      cloudCover: cur.cloud_cover,
      windMph: cur.wind_speed_10m,
      windDir: cur.wind_direction_10m,
      gustMph: cur.wind_gusts_10m,
      pressureHpa: cur.pressure_msl,
      pressureInHg: hPaToInHg(cur.pressure_msl),
      pressureTrend: pressureTrend(cur.pressure_msl, earlier),
      weatherCode: cur.weather_code,
    },
    days: data.daily.time.slice(todayIdx).map((d, i) => ({
      date: d,
      sunrise: data.daily.sunrise[todayIdx + i],
      sunset: data.daily.sunset[todayIdx + i],
      hiF: data.daily.temperature_2m_max[todayIdx + i],
      loF: data.daily.temperature_2m_min[todayIdx + i],
      rainChance: data.daily.precipitation_probability_max[todayIdx + i],
      uv: data.daily.uv_index_max[todayIdx + i],
      weatherCode: data.daily.weather_code[todayIdx + i],
    })),
    hourly: times.map((t, i) => ({
      time: t,
      tempF: data.hourly.temperature_2m[i],
      pressureHpa: data.hourly.pressure_msl[i],
      rainChance: data.hourly.precipitation_probability?.[i],
      weatherCode: data.hourly.weather_code[i],
    })).slice(nowIdx, nowIdx + 24),
  };
}

// Weather at a specific date & hour, recorded with each catch so Insights can find
// patterns (pressure, temperature, cloud cover...). Past data never changes, so it is
// cached forever.
export async function getConditionsAt({ lat, lng }, dateISO, hhmm, tz = DEFAULT_TZ) {
  const hour = Number((hhmm || '12:00').split(':')[0]);
  const prev = shiftDate(dateISO, -1);
  const age = daysBetween(dateISO, todayISO());
  if (age < -14) return null; // too far in the future to forecast
  // Recent days come from the forecast API; older days from the historical archive.
  const host = age <= 60 ? 'https://api.open-meteo.com/v1/forecast' : 'https://archive-api.open-meteo.com/v1/archive';
  const url = `${host}?latitude=${r2(lat)}&longitude=${r2(lng)}&start_date=${prev}&end_date=${dateISO}`
    + `&hourly=${HOURLY_VARS}&daily=sunrise,sunset&${UNITS}&timezone=${encodeURIComponent(tz)}`;
  const ttl = age > 1 ? Infinity : 60 * 60 * 1000;
  const { data } = await cachedFetchJson(`at:${r2(lat)},${r2(lng)}:${dateISO}`, url, ttl);

  const idx = data.hourly.time.indexOf(`${dateISO}T${String(hour).padStart(2, '0')}:00`);
  if (idx < 0) return null;
  const h = data.hourly;
  const dIdx = data.daily.time.indexOf(dateISO);
  return {
    tempF: h.temperature_2m[idx],
    pressureHpa: h.pressure_msl[idx],
    pressureInHg: hPaToInHg(h.pressure_msl[idx]),
    pressureTrend: pressureTrend(h.pressure_msl[idx], h.pressure_msl[idx - 3]),
    cloudCover: h.cloud_cover[idx],
    windMph: h.wind_speed_10m[idx],
    precipIn: h.precipitation[idx],
    weatherCode: h.weather_code[idx],
    sunrise: data.daily.sunrise[dIdx] ?? null,
    sunset: data.daily.sunset[dIdx] ?? null,
  };
}

function shiftDate(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

// WMO weather codes -> words + emoji
export function describeWeather(code) {
  const map = {
    0: ['Clear', '☀️'], 1: ['Mostly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'],
    45: ['Fog', '🌫️'], 48: ['Fog', '🌫️'],
    51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌧️'],
    61: ['Light rain', '🌦️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'],
    66: ['Freezing rain', '🌧️'], 67: ['Freezing rain', '🌧️'],
    71: ['Light snow', '🌨️'], 73: ['Snow', '🌨️'], 75: ['Heavy snow', '❄️'], 77: ['Snow grains', '🌨️'],
    80: ['Showers', '🌦️'], 81: ['Showers', '🌧️'], 82: ['Heavy showers', '⛈️'],
    85: ['Snow showers', '🌨️'], 86: ['Snow showers', '🌨️'],
    95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm + hail', '⛈️'], 99: ['Thunderstorm + hail', '⛈️'],
  };
  const [label, emoji] = map[code] || ['–', '🌡️'];
  return { label, emoji };
}

export function compass(deg) {
  if (deg == null) return '';
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8];
}
