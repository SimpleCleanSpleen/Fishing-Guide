// Moon phase computed locally (no API needed). Open-Meteo's free forecast API
// covers weather and sunrise/sunset; the moon is pure astronomy, so we calculate it.
const SYNODIC = 29.530588853; // days
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // a reference new moon

export function moonPhase(date = new Date()) {
  const days = (date.getTime() - KNOWN_NEW_MOON) / 86400000;
  const age = ((days % SYNODIC) + SYNODIC) % SYNODIC; // 0..29.53
  const fraction = age / SYNODIC; // 0 new, 0.5 full
  const illumination = Math.round(((1 - Math.cos(2 * Math.PI * fraction)) / 2) * 100);
  const idx = Math.floor((fraction * 8) + 0.5) % 8;
  const names = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
  const emojis = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
  // Many anglers find the days around new & full moon more active (solunar theory).
  const major = idx === 0 || idx === 4;
  return { age: +age.toFixed(1), fraction, illumination, name: names[idx], emoji: emojis[idx], major, key: names[idx] };
}
