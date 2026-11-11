// Two tackle boxes: the app owner's exact gear (data/gear.js, brand names and all) and a
// generic beginner kit for everyone else. Everything that recommends gear or bait asks
// useTackle() which one applies to the signed-in angler.
import { GEAR } from './gear.js';

// SHA-256 of the owner's lower-cased sign-in email. Only the hash is stored so the
// address itself never appears in this public repo.
export const OWNER_EMAIL_SHA256 = 'afa812a3703ddb3d50bed3545789d102299156cc356268f176064e95cdcfa5cb';

export async function isOwnerEmail(email) {
  if (!email || !globalThis.crypto?.subtle) return false;
  const bytes = new TextEncoder().encode(email.trim().toLowerCase());
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  const hex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return hex === OWNER_EMAIL_SHA256;
}

// Generic versions of the brand-specific items. Fields not listed keep the owner's text
// (which is already brand-neutral for things like knots, the knife and the net).
const GENERIC = {
  'rod-reel': {
    name: 'Spinning rod & reel combo (6-7 ft, medium-light, 2500-3000 size reel)',
    how: [
      'Telescopic rods: extend from the TIP (thinnest) end, one section at a time, twisting gently so the guides (line rings) line up. Collapse from the thickest section after rinsing off grit.',
      'Reel handle: most spinning reels swap the handle to either side. Right-handed casters usually reel with the left hand.',
      'Drag (the knob on the front of the spool): set it so a firm pull on the line makes it slip at about 1/3 of line strength, roughly 2.5-3 lb for 8 lb line. Test by pulling line by hand: it should slip smoothly before the line could snap.',
      'Bail: the wire arm. Open it to cast, close it (by turning the handle) to reel.',
    ],
  },
  line: {
    name: '6-8 lb monofilament line',
    knots: GEAR.find((g) => g.id === 'line').knots.map((k) => (k.name === 'Palomar Knot'
      ? { ...k, use: 'The strongest easy knot. Great for worm hooks and small jig heads.' }
      : k)),
    tips: ['Clear or low-vis green line is hardest for fish to see; high-vis line is easier for you to watch for bites. Either is fine to start.'],
  },
  'trout-magnet': {
    name: 'Small jigs & grubs (1/64-1/32 oz)',
    when: 'A tiny jig head with a soft plastic grub catches almost everything small-to-medium: trout, crappie, bluegill, white perch, white bass, even bass.',
    how: [
      'Thread the grub onto the jig head: insert the hook point into the flat end, push it in about 1/4 inch, then poke the point out the TOP so it rides straight. Crooked = spinning = fewer bites.',
      'Under a float (best for beginners): clip a float 2-4 feet above the jig. Cast, let it settle, then twitch the rod every few seconds. When the float dips or moves sideways, reel down and lift.',
      'Without a float: cast, count to 3-10 to let it sink, then reel very slowly with tiny twitches.',
    ],
    tips: ['Bright colors for muddy water or cloudy days, white/natural for clear water.', 'Tie it on with a Palomar or Improved Clinch and slide the knot to the top of the eye so the jig hangs level.'],
  },
  powerbait: {
    name: 'Scented trout dough bait',
    how: [
      'Pinch off a pea-sized piece and mold it around the hook so the point and barb are completely covered. Small treble hooks (size 12-16) hold dough best.',
      'Trout rig (floats off bottom): slide a small egg sinker on the main line, tie on a swivel, then add an 18-24 inch leader to the hook. The dough floats up above the weeds while the sinker holds bottom.',
      'Cast gently: it can fly off on a hard cast. Set the rod in a holder and watch the tip for taps.',
    ],
    tips: ['Close the lid tightly: it dries out.'],
  },
  senko: {
    name: '5" soft plastic stick worms (green pumpkin)',
    when: 'The easiest bass lure there is. Works for largemouth, smallmouth and spotted bass in spring through fall. Green pumpkin looks like crawfish and baitfish.',
    how: [
      'Texas rig (weedless, for around logs, rocks and grass), using a 3/0 EWG worm hook: 1) Push the hook point into the CENTER of the worm\'s head about 1/4 inch. 2) Bring it out the side and slide the worm up to the hook eye, turning the hook so the eye is buried in the head. 3) Lay the hook alongside the worm to see where it lines up, then push the point straight through the body and back so the tip is just under the skin. The worm must hang perfectly straight.',
      'Weightless (no sinker): cast near cover and let it sink slowly on a slack line. Most bites happen as it falls. Watch the line: if it jumps or moves sideways, reel up slack and set the hook.',
      'Wacky rig: hook the worm through the middle so both ends wiggle, using a size 1 to 1/0 wacky or octopus hook.',
      'Retrieve: lift the rod tip slowly to 11 o\'clock, let it fall back on slack line, reel up slack, repeat. Slow is good.',
    ],
    tips: ['Soft stick worms tear after a fish or two. That\'s normal.', 'A bite can feel like a "tick" or just weight. When in doubt, reel down and set the hook.'],
  },
  spinnerbait: {
    when: 'Bass and white bass when you want to cover lots of water: windy days, cloudy days, stained/muddy water. Great along rocky banks and riprap.',
  },
  'hooks-ewg': {
    name: 'EWG worm hooks (size 2/0-3/0)',
    when: 'Texas-rigging stick worms and other soft plastics for bass.',
    how: ['See the stick worm Texas-rig steps. Tie with a Palomar knot.', 'Keep them dry: rusty hooks are dull.'],
  },
  'hooks-aberdeen': { name: 'Aberdeen hooks (size 6-8)' },
  scale: { name: 'Fish scale with lip gripper' },
  pliers: { name: 'Fishing pliers' },
  plano: {
    name: 'Tackle box with trays',
    how: [
      'Small hooks, sinkers, split shot, swivels and floats in one tray.',
      'Jigs, grubs and spinnerbaits in another.',
      'Soft plastics in their original bags (some melt other plastics), plus pliers and scale.',
      'Bottom: dough bait (lid tight), spare line, bug spray, sunscreen, a small towel and a first-aid kit.',
    ],
  },
  'bug-spray': {
    name: 'Bug spray',
    when: 'Spring through fall at the bank: mosquitoes and ticks are common along rivers and creeks.',
  },
  umbrella: { name: 'Shade umbrella' },
  'rod-holders': { name: 'Bank rod holders', when: 'Bait-and-wait fishing: dough bait for trout, worms or cut bait for catfish.' },
};

export const GENERIC_GEAR = GEAR.map((g) => ({ ...g, ...(GENERIC[g.id] || {}) }));

// Brand-name bait suggestions (in data/species.js) -> generic wording.
const GENERIC_BAITS = {
  '5" Yamamoto Senko (Green Pumpkin)': '5" soft plastic stick worm (green pumpkin)',
  'Leland Trout Magnet': 'Small jig & grub under a float',
  'PowerBait Trout Dough': 'Trout dough bait',
  'Live worm on Aberdeen #8': 'Live worm on a small hook',
};
export const genericBait = (bait) => GENERIC_BAITS[bait] || bait;

export const OWNER_QUICK_BAITS = [
  'Leland Trout Magnet (Neon)',
  'PowerBait Trout Dough (Garlic/Chartreuse)',
  '5" Yamamoto Senko - Texas rig',
  '5" Yamamoto Senko - Weightless/Wacky',
  'Spinnerbait',
  'Live worm on Aberdeen #8',
  'Nightcrawler (bottom rig)',
  'Other',
];
export const GENERIC_QUICK_BAITS = [
  'Live worm under a float',
  'Nightcrawler (bottom rig)',
  'Live minnow',
  'Small jig & grub',
  'Soft plastic worm - Texas rig',
  'Soft plastic worm - Wacky',
  'Spinnerbait',
  'Crankbait',
  'Dough bait',
  'Cut bait',
  'Other',
];

// { personal, gear, bait(name), quickBaits, boxName }
export function tackleFor(personal) {
  return personal
    ? { personal: true, gear: GEAR, bait: (b) => b, quickBaits: OWNER_QUICK_BAITS, boxName: 'My Tackle Box' }
    : { personal: false, gear: GENERIC_GEAR, bait: genericBait, quickBaits: GENERIC_QUICK_BAITS, boxName: 'Starter Tackle Box' };
}
