// Trip planner: forecast which fish should be active on the trip's date & time, and
// build a packing list from the target fish, the weather and the time of day.
import { bitingNow } from './bitingNow.js';
import { moonPhase } from './moon.js';
import { tackleFor } from '../data/tackle.js';
import { timeOfDay } from '../utils/time.js';

// Parse "YYYY-MM-DD" + "HH:MM" as local time (new Date(iso) would be UTC midnight).
export function tripDate(trip) {
  const [y, m, d] = trip.date.split('-').map(Number);
  const [hh, mm] = (trip.time || '07:00').split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

// Fish forecast. If the trip has a spot with a species list, fish known there rank
// first; the rest of the area's common species follow at a discount.
export function tripFish(trip, location, spot, catches, weather) {
  const when = tripDate(trip);
  const { bucket, rows } = bitingNow(location, catches, { sunrise: weather?.sunrise, sunset: weather?.sunset, date: when });
  const atSpot = new Set(spot?.species || []);
  const moon = moonPhase(when);
  const ranked = rows.map((r) => {
    let score = r.score;
    if (atSpot.size && !atSpot.has(r.name)) score *= 0.6;
    if (moon.major) score *= 1.05;
    // A sharp pressure drop before a front often turns fish on; high bright skies slow them.
    const p = weather?.atHour?.pressureTrend;
    if (p === 'falling') score *= 1.1;
    if (p === 'rising' && (weather?.atHour?.cloudCover ?? 50) < 20) score *= 0.9;
    return { ...r, score: Math.min(1.2, score), atSpot: atSpot.has(r.name) };
  }).sort((a, b) => b.score - a.score);
  return { bucket, moon, rows: ranked };
}

// Map a species' bait strings onto tackle-box items, or a shopping item if you don't own it.
const BAIT_TO_GEAR = [
  [/senko/i, 'senko'], [/spinnerbait/i, 'spinnerbait'], [/trout magnet/i, 'trout-magnet'],
  [/powerbait/i, 'powerbait'], [/aberdeen/i, 'hooks-aberdeen'],
];
const BAIT_SHOP = /nightcrawler|live worm|minnow|shad|cut bait|chicken liver|bloodworm|shrimp|corn|bluegill/i;

// Build the packing list. Each item: { id, name, icon, why, group, gearId?, buy? }
// `tackle` (from useTackle) decides between the owner's exact gear and a generic kit.
export function tripSupplies(trip, fish, weather, location, tackle = tackleFor(false)) {
  const gear = (id) => tackle.gear.find((g) => g.id === id);
  const items = new Map();
  const add = (id, group, name, icon, why, extra = {}) => {
    if (!items.has(id)) items.set(id, { id, group, name, icon, why, ...extra });
    return items.get(id);
  };
  const fromGear = (gid, group, why) => {
    const g = gear(gid);
    // `need`: the angler has set up their tackle box and doesn't own this yet.
    return g ? add(gid, group, g.name, g.icon, why, { gearId: gid, need: tackle.setUp && !g.owned }) : null;
  };
  // Items picked for particular fish read "for Crappie, Bluegill" rather than repeating.
  const forFish = (item, prefix, fishName, suffix = '') => {
    if (!item) return;
    item.fishFor = item.fishFor || { prefix, suffix, names: [] };
    if (!item.fishFor.names.includes(fishName)) item.fishFor.names.push(fishName);
  };

  // Essentials every trip.
  fromGear('rod-reel', 'Essentials', 'Your main rod');
  fromGear('line', 'Essentials', 'Spare line for re-tying after snags');
  fromGear('plano', 'Essentials', 'Keeps the baits below organized');
  fromGear('pliers', 'Essentials', 'Unhooking and cutting line');
  add('license', 'Essentials', 'Fishing license (on your phone or printed)', '🪪', location?.license?.general || 'Check local license rules');
  add('water', 'Essentials', 'Water & snacks', '🥤', null);

  // Baits for the top fish (only species with a reasonable chance).
  // If the spot lists its fish, only pack for those.
  const spotKnown = fish.rows.some((r) => r.atSpot);
  const targets = fish.rows.filter((r) => r.score >= 0.3 && (!spotKnown || r.atSpot)).slice(0, 4);
  for (const r of targets) {
    for (const bait of r.sp.baits.slice(0, 2)) {
      const hit = BAIT_TO_GEAR.find(([re]) => re.test(bait));
      if (hit) forFish(fromGear(hit[1], 'Baits & tackle'), 'For', r.name);
      else if (BAIT_SHOP.test(bait)) forFish(add(`buy:${bait.toLowerCase()}`, 'Buy on the way (bait shop)', bait, '🛒', null, { buy: true }), 'For', r.name);
    }
    if (/bass|pickerel|snakehead/i.test(r.name)) forFish(fromGear('hooks-ewg', 'Baits & tackle'), 'Rig soft plastics for', r.name);
    if (/sunfish|bluegill|pumpkinseed|perch|crappie|trout|spot|croaker/i.test(r.name)) forFish(fromGear('hooks-aberdeen', 'Baits & tackle'), 'Small hooks for', r.name);
    if (/catfish|carp|striped|drum|snakehead/i.test(r.name)) {
      forFish(fromGear('net', 'Landing & keeping'), 'Big fish possible:', r.name);
      forFish(fromGear('rod-holders', 'Comfort'), 'Bait-and-wait fishing for', r.name);
      forFish(add('sinkers', 'Baits & tackle', 'Egg sinkers & swivels (Carolina rig)', '⚫'), 'Keeps bait on the bottom for', r.name);
    }
    if (/trout|crappie|perch|bluegill|sunfish|white bass/i.test(r.name)) forFish(add('bobber', 'Baits & tackle', 'Small slip floats / bobbers', '🔴'), 'Easy bite detection for', r.name);
  }
  if (targets.some((r) => r.name === 'Rainbow Trout') && location?.license?.trout) {
    add('trout-stamp', 'Essentials', 'Trout add-on / stamp', '🎟️', location.license.trout);
  }
  fromGear('scale', 'Landing & keeping', 'Weigh catches for your journal');

  // Weather and time of day.
  const bucket = timeOfDay(trip.time, weather?.sunrise, weather?.sunset);
  const month = tripDate(trip).getMonth();
  const hot = weather ? weather.hiF >= 80 : month >= 5 && month <= 7;
  const warm = weather ? weather.hiF >= 65 : month >= 4 && month <= 8;
  const cold = weather ? weather.loF <= 45 : month <= 1 || month === 11;
  const wet = weather ? weather.rainChance >= 40 : false;
  if (warm) fromGear('bug-spray', 'Comfort', 'Mosquitoes & ticks near the water');
  const daylight = !['night', 'dusk'].includes(bucket) || Number(trip.hours) >= 6;
  if (daylight && (hot || (weather && weather.uv >= 6))) {
    add('sunscreen', 'Comfort', 'Sunscreen, hat & polarized sunglasses', '🧴', weather ? `UV index ${Math.round(weather.uv)}` : 'Summer sun');
    fromGear('umbrella', 'Comfort', 'Shade on the bank');
  }
  if (wet) add('rain', 'Comfort', 'Rain jacket & a dry bag for your phone', '🧥', `${weather.rainChance}% chance of rain`);
  if (cold) add('layers', 'Comfort', 'Warm layers, hat & gloves', '🧤', weather ? `Low of ${Math.round(weather.loF)}°F` : 'Cold-season trip');
  if (weather && weather.maxWindMph >= 15) add('wind', 'Comfort', 'Heavier jig heads / sinkers for wind', '💨', `Wind up to ${Math.round(weather.maxWindMph)} mph`);
  if (bucket === 'night' || bucket === 'dusk' || bucket === 'dawn') add('headlamp', 'Comfort', 'Headlamp or flashlight', '🔦', bucket === 'night' ? 'Night trip' : `It'll be dim at ${bucket}`);
  add('towel', 'Comfort', 'Old towel & hand wipes', '🧻', 'Slime, bait and sunscreen');
  fromGear('knife', 'Landing & keeping', null);
  add('cooler', 'Landing & keeping', 'Cooler with ice (if keeping fish)', '🧊', 'Check size & creel limits first');

  const order = ['Essentials', 'Baits & tackle', 'Buy on the way (bait shop)', 'Landing & keeping', 'Comfort'];
  const list = [...items.values()].map(({ fishFor, ...it }) => (fishFor
    ? { ...it, why: `${fishFor.prefix} ${fishFor.names.join(', ')}${fishFor.suffix}` }
    : it));
  return order.map((group) => ({ group, items: list.filter((i) => i.group === group) })).filter((g) => g.items.length);
}

// A one-paragraph read on the day, like a fishing game's daily forecast.
export function tripOutlook(fish, weather) {
  const top = fish.rows[0];
  const parts = [];
  if (top) parts.push(`${top.name} should be your best bet${top.atSpot ? ' at this spot' : ''}`);
  if (fish.moon.major) parts.push(`the ${fish.moon.name.toLowerCase()} is a solunar peak`);
  const p = weather?.atHour?.pressureTrend;
  if (p === 'falling') parts.push('falling pressure often gets fish feeding');
  if (p === 'rising') parts.push('rising pressure after a front can slow the bite, so fish slower and smaller');
  if (weather?.rainChance >= 60) parts.push('expect rain');
  if (weather?.maxWindMph >= 20) parts.push('it could be too windy to cast light lures well');
  if (!parts.length) return null;
  const s = parts.join(', and ');
  return `${s[0].toUpperCase()}${s.slice(1)}.`;
}

// Calendar file so everyone can add the trip to their phone's calendar.
// Times are written as local wall-clock time in the trip's timezone (TZID). Two alarms act
// as reminders: 7 PM the evening before, and an hour before the start.
export function tripIcs(trip, placeName, tz = 'America/New_York', url = '') {
  const start = tripDate(trip);
  const end = new Date(start.getTime() + (Number(trip.hours) || 3) * 3600 * 1000);
  const z = (n) => String(n).padStart(2, '0');
  const local = (d) => `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}T${z(d.getHours())}${z(d.getMinutes())}00`;
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (t) => String(t || '').replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
  const eveBefore = new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1, 19, 0);
  const minsBefore = Math.max(60, Math.round((start - eveBefore) / 60000));
  const alarm = (mins, text) => ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(text)}`, `TRIGGER:-PT${mins}M`, 'END:VALARM'];
  const details = [trip.notes, url && `Forecast, packing list & chat: ${url}`].filter(Boolean).join('\n\n');
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Fishing Guide//Trips//EN', 'BEGIN:VEVENT',
    `UID:${trip.id}@fishing-guide`, `DTSTAMP:${fmt(new Date())}`, `DTSTART;TZID=${tz}:${local(start)}`, `DTEND;TZID=${tz}:${local(end)}`,
    `SUMMARY:${esc(`🎣 ${trip.title}`)}`, `LOCATION:${esc(placeName)}`, `DESCRIPTION:${esc(details)}`,
    ...(url ? [`URL:${url}`] : []),
    ...alarm(minsBefore, `Tomorrow: ${trip.title}. Check the forecast and pack your gear!`),
    ...alarm(60, `${trip.title} starts in 1 hour`),
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

// "Add to Google Calendar" link (Google applies the user's default reminders).
export function tripGoogleCalendarUrl(trip, placeName, tz, url = '') {
  const start = tripDate(trip);
  const end = new Date(start.getTime() + (Number(trip.hours) || 3) * 3600 * 1000);
  const z = (n) => String(n).padStart(2, '0');
  const local = (d) => `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}T${z(d.getHours())}${z(d.getMinutes())}00`;
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: `🎣 ${trip.title}`,
    dates: `${local(start)}/${local(end)}`,
    ctz: tz,
    location: placeName,
    details: [trip.notes, url && `Forecast, packing list & chat: ${url}`].filter(Boolean).join('\n\n'),
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}
