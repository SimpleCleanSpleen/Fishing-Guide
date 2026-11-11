// Beginner-level "prior knowledge" about each fish. The Insights engine blends these
// general patterns with YOUR logged catches: with few catches the guide knowledge
// dominates; as your log grows your own data takes over.
// timeWeights: dawn, morning, midday, afternoon, dusk, night (relative 0-1)
// monthWeights: Jan..Dec (relative 0-1)

export const TIME_BUCKETS = ['dawn', 'morning', 'midday', 'afternoon', 'dusk', 'night'];
export const TIME_LABELS = {
  dawn: 'Dawn', morning: 'Morning', midday: 'Midday', afternoon: 'Afternoon', dusk: 'Dusk', night: 'Night',
};
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const SPECIES = {
  'Largemouth Bass': {
    emoji: '🐟', group: 'Black bass',
    timeWeights: [1, 0.7, 0.3, 0.5, 1, 0.4],
    monthWeights: [0.2, 0.3, 0.6, 1, 1, 0.8, 0.6, 0.6, 0.8, 0.9, 0.5, 0.25],
    baits: ['5" Yamamoto Senko (Green Pumpkin)', 'Spinnerbait'],
    tip: 'Fish near cover (weeds, logs, docks). A slow-sinking Senko is the #1 beginner bass bait.',
  },
  'Smallmouth Bass': {
    emoji: '🐟', group: 'Black bass',
    timeWeights: [0.9, 0.8, 0.4, 0.6, 1, 0.3],
    monthWeights: [0.2, 0.3, 0.6, 0.9, 1, 0.8, 0.7, 0.7, 0.9, 1, 0.6, 0.3],
    baits: ['5" Yamamoto Senko (Green Pumpkin)', 'Leland Trout Magnet', 'Spinnerbait'],
    tip: 'Loves rocks and current. Green pumpkin matches crawfish, their favorite food.',
  },
  'Spotted Bass': {
    emoji: '🐟', group: 'Black bass',
    timeWeights: [0.9, 0.8, 0.5, 0.6, 1, 0.3],
    monthWeights: [0.3, 0.4, 0.7, 0.9, 1, 0.8, 0.7, 0.7, 0.8, 1, 0.7, 0.4],
    baits: ['5" Yamamoto Senko (Green Pumpkin)', 'Spinnerbait'],
    tip: 'Very common in the Cumberland. Fish rocky banks and current breaks.',
  },
  Bluegill: {
    emoji: '🐠', group: 'Sunfish',
    timeWeights: [0.6, 1, 0.8, 0.9, 0.7, 0.1],
    monthWeights: [0.1, 0.2, 0.4, 0.8, 1, 1, 0.9, 0.8, 0.7, 0.5, 0.2, 0.1],
    baits: ['Leland Trout Magnet', 'Live worm on Aberdeen #8', 'PowerBait Trout Dough'],
    tip: 'The best fish for beginners! Small hook, small bait, shallow water near cover.',
  },
  'Redear Sunfish': {
    emoji: '🐠', group: 'Sunfish',
    timeWeights: [0.6, 1, 0.7, 0.8, 0.7, 0.1],
    monthWeights: [0.1, 0.2, 0.5, 0.9, 1, 0.9, 0.7, 0.6, 0.5, 0.4, 0.2, 0.1],
    baits: ['Live worm on Aberdeen #8', 'Leland Trout Magnet'],
    tip: 'Also called shellcracker. Fish on the bottom with a worm.',
  },
  Crappie: {
    emoji: '🐟', group: 'Panfish',
    timeWeights: [0.9, 0.8, 0.4, 0.5, 1, 0.7],
    monthWeights: [0.3, 0.5, 1, 1, 0.7, 0.5, 0.4, 0.4, 0.6, 0.8, 0.7, 0.4],
    baits: ['Leland Trout Magnet', 'Live minnow'],
    tip: 'Spring (March-April) is prime. Fish slowly around brush piles and docks.',
  },
  'Channel Catfish': {
    emoji: '🐡', group: 'Catfish',
    timeWeights: [0.6, 0.4, 0.3, 0.5, 0.9, 1],
    monthWeights: [0.2, 0.2, 0.4, 0.7, 0.9, 1, 1, 0.9, 0.7, 0.5, 0.3, 0.2],
    baits: ['PowerBait Trout Dough', 'Nightcrawler', 'Chicken liver'],
    tip: 'Fish on the bottom at dusk or night. Use the bank rod holder and watch the rod tip.',
  },
  'Blue Catfish': {
    emoji: '🐡', group: 'Catfish',
    timeWeights: [0.6, 0.5, 0.4, 0.5, 0.8, 1],
    monthWeights: [0.6, 0.6, 0.6, 0.7, 0.8, 0.8, 0.7, 0.7, 0.7, 0.8, 0.8, 0.7],
    baits: ['Cut bait (shad/skipjack)', 'Nightcrawler'],
    tip: 'Biggest fish in the Cumberland. Bigger ones need heavier gear than 8 lb line: loosen the drag and be patient.',
  },
  'Flathead Catfish': {
    emoji: '🐡', group: 'Catfish',
    timeWeights: [0.4, 0.2, 0.1, 0.2, 0.8, 1],
    monthWeights: [0.1, 0.1, 0.3, 0.5, 0.8, 1, 1, 0.9, 0.6, 0.4, 0.2, 0.1],
    baits: ['Live bait (bluegill where legal)'],
    tip: 'Night feeders around logjams. Usually a target for heavier gear.',
  },
  'Rainbow Trout': {
    emoji: '🐟', group: 'Trout',
    timeWeights: [0.9, 1, 0.6, 0.6, 0.8, 0.1],
    monthWeights: [1, 1, 0.8, 0.4, 0.1, 0, 0, 0, 0, 0.1, 0.6, 1],
    baits: ['PowerBait Trout Dough', 'Leland Trout Magnet'],
    tip: 'TWRA stocks trout in some waters in winter. Check the stocking schedule. PowerBait floats your hook just off the bottom.',
  },
  Sauger: {
    emoji: '🐟', group: 'Perch family',
    timeWeights: [0.9, 0.7, 0.4, 0.5, 1, 0.6],
    monthWeights: [1, 1, 0.8, 0.4, 0.2, 0.1, 0.1, 0.1, 0.2, 0.4, 0.8, 1],
    baits: ['Jig + minnow', 'Leland Trout Magnet'],
    tip: 'A winter fish below dams on the Cumberland. Fish slowly near the bottom.',
  },
  'White Bass': {
    emoji: '🐟', group: 'Temperate bass',
    timeWeights: [0.8, 0.9, 0.5, 0.7, 1, 0.3],
    monthWeights: [0.2, 0.4, 0.9, 1, 0.8, 0.6, 0.6, 0.6, 0.6, 0.6, 0.4, 0.2],
    baits: ['Spinnerbait', 'Leland Trout Magnet'],
    tip: 'Travel in schools chasing baitfish. Watch for splashing on the surface.',
  },
  'Striped Bass': {
    emoji: '🐟', group: 'Temperate bass',
    timeWeights: [1, 0.7, 0.4, 0.5, 0.9, 0.5],
    monthWeights: [0.5, 0.5, 0.7, 0.9, 0.9, 0.7, 0.6, 0.6, 0.6, 0.8, 0.7, 0.5],
    baits: ['Spinnerbait', 'Live shad'],
    tip: 'Powerful fighters. Set your drag lighter and let it run.',
  },
  'Freshwater Drum': {
    emoji: '🐟', group: 'Drum',
    timeWeights: [0.6, 0.7, 0.6, 0.7, 0.8, 0.5],
    monthWeights: [0.2, 0.2, 0.4, 0.7, 0.9, 1, 1, 0.9, 0.7, 0.5, 0.3, 0.2],
    baits: ['Nightcrawler', 'Live worm on Aberdeen #8'],
    tip: 'Common bottom feeder. Makes a grunting sound!',
  },
  'Common Carp': {
    emoji: '🐟', group: 'Carp',
    timeWeights: [0.7, 0.8, 0.6, 0.7, 0.8, 0.5],
    monthWeights: [0.2, 0.3, 0.5, 0.8, 1, 1, 0.9, 0.8, 0.7, 0.5, 0.3, 0.2],
    baits: ['PowerBait Trout Dough', 'Corn'],
    tip: 'Strong and wary. Use a gentle drag and be patient.',
  },
  Pumpkinseed: {
    emoji: '🐠', group: 'Sunfish',
    timeWeights: [0.6, 1, 0.8, 0.9, 0.7, 0.1],
    monthWeights: [0.1, 0.2, 0.4, 0.8, 1, 1, 0.9, 0.8, 0.7, 0.5, 0.2, 0.1],
    baits: ['Live worm on Aberdeen #8', 'Leland Trout Magnet'],
    tip: 'The colorful cousin of the bluegill. Same tactics: small hook, small bait, near weeds.',
  },
  'Chain Pickerel': {
    emoji: '🐊', group: 'Pike family',
    timeWeights: [0.8, 1, 0.7, 0.7, 0.9, 0.1],
    monthWeights: [0.7, 0.8, 1, 0.9, 0.7, 0.5, 0.4, 0.4, 0.6, 0.8, 0.9, 0.8],
    baits: ['Spinnerbait', '5" Yamamoto Senko (Green Pumpkin)'],
    tip: 'Ambush hunter in weedy, tea-colored water. Bites even in cold months. Sharp teeth: unhook with pliers.',
  },
  'Yellow Perch': {
    emoji: '🐟', group: 'Perch family',
    timeWeights: [0.8, 1, 0.7, 0.7, 0.8, 0.2],
    monthWeights: [0.6, 1, 1, 0.7, 0.5, 0.4, 0.3, 0.3, 0.4, 0.6, 0.7, 0.6],
    baits: ['Live minnow', 'Live worm on Aberdeen #8', 'Leland Trout Magnet'],
    tip: 'In Maryland they run up tidal creeks to spawn in late February and March: the first fishing of the year.',
  },
  'White Perch': {
    emoji: '🐟', group: 'Temperate bass',
    timeWeights: [0.9, 0.8, 0.5, 0.7, 1, 0.6],
    monthWeights: [0.2, 0.3, 0.8, 1, 0.8, 0.8, 0.9, 0.9, 0.9, 0.8, 0.5, 0.3],
    baits: ['Bloodworm', 'Shrimp', 'Leland Trout Magnet'],
    tip: 'The classic Chesapeake pier fish. Schools around pilings and rocks. Catch one and stay put: more are nearby.',
  },
  Spot: {
    emoji: '🐟', group: 'Drum',
    timeWeights: [0.7, 0.9, 0.7, 0.8, 0.9, 0.4],
    monthWeights: [0, 0, 0, 0.1, 0.5, 0.9, 1, 1, 0.9, 0.4, 0.1, 0],
    baits: ['Bloodworm', 'Shrimp'],
    tip: 'Summer Bay fish that feeds on the bottom. Small hooks and bloodworm on a two-hook rig.',
  },
  'Atlantic Croaker': {
    emoji: '🐟', group: 'Drum',
    timeWeights: [0.6, 0.6, 0.5, 0.7, 1, 0.9],
    monthWeights: [0, 0, 0, 0.1, 0.5, 0.9, 1, 1, 0.8, 0.4, 0.1, 0],
    baits: ['Shrimp', 'Bloodworm', 'Nightcrawler'],
    tip: 'Named for the croaking sound it makes. Bites best in the evening on the bottom.',
  },
  'Northern Snakehead': {
    emoji: '🐍', group: 'Invasive',
    timeWeights: [0.5, 0.9, 1, 1, 0.8, 0.2],
    monthWeights: [0, 0, 0.1, 0.3, 0.8, 1, 1, 1, 0.8, 0.4, 0.1, 0],
    baits: ['5" Yamamoto Senko (Green Pumpkin)', 'Spinnerbait'],
    tip: 'Invasive: Maryland asks you to keep and kill every one you catch. Hits lures fished slowly over shallow weeds on hot days.',
  },
  Other: {
    emoji: '🎣', group: 'Other',
    timeWeights: [0.8, 0.8, 0.5, 0.6, 0.9, 0.4],
    monthWeights: [0.3, 0.3, 0.6, 0.9, 1, 0.9, 0.8, 0.8, 0.8, 0.8, 0.5, 0.3],
    baits: [],
    tip: '',
  },
};

export const SPECIES_NAMES = Object.keys(SPECIES);

// Baits from your tackle box (used for the log form's quick picks).
export const MY_BAITS = [
  'Leland Trout Magnet (Neon)',
  'PowerBait Trout Dough (Garlic/Chartreuse)',
  '5" Yamamoto Senko - Texas rig',
  '5" Yamamoto Senko - Weightless/Wacky',
  'Spinnerbait',
  'Live worm on Aberdeen #8',
  'Nightcrawler (bottom rig)',
  'Other',
];
