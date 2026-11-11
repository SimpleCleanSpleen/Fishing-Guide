// Pixel-art fish sprites in public/fish/, made by scripts/pixelate-fish.py from
// illustrations on Wikimedia Commons (mostly Duane Raver's paintings for the U.S. Fish
// & Wildlife Service, which are public domain). Each entry keeps the source credit.
const COMMONS = 'https://commons.wikimedia.org/wiki/File:';

export const FISH_ART = {
  "Largemouth Bass": { slug: 'largemouth-bass', w: 66, h: 27, artist: "U.S. Fish & Wildlife Service", license: "Public domain", source: COMMONS + "Largemouth_bass_-_DPLA_-_(white_background).jpg" },
  "Smallmouth Bass": { slug: 'smallmouth-bass', w: 66, h: 28, artist: "Duane Raver, U.S. Fish & Wildlife Service", license: "Public domain", source: COMMONS + "Smallmouth_bass.png" },
  "Spotted Bass": { slug: 'spotted-bass', w: 66, h: 24, artist: "Unattributed (see source page)", license: "Public domain", source: COMMONS + "Micropterus_punctulatus.jpg" },
  "Bluegill": { slug: 'bluegill', w: 66, h: 42, artist: "NOAA", license: "Public domain", source: COMMONS + "Lepomis_macrochirus.jpg" },
  "Redear Sunfish": { slug: 'redear-sunfish', w: 66, h: 38, artist: "Duane Raver, U.S. Fish & Wildlife Service", license: "Public domain", source: COMMONS + "Redearsunfishnctc_(white_background).jpg" },
  "Green Sunfish": { slug: 'green-sunfish', w: 66, h: 33, artist: "Duane Raver, U.S. Fish & Wildlife Service", license: "Public domain", source: COMMONS + "Lepomis_cyanellus_Raver_(white_background).jpg" },
  "Rock Bass": { slug: 'rock-bass', w: 66, h: 36, artist: "Hugh McCormick Smith", license: "Public domain", source: COMMONS + "FMIB_39180_Rock_Bass_(Ambloplites_rupestris).jpeg" },
  "Crappie": { slug: 'crappie', w: 66, h: 31, artist: "Duane Raver, U.S. Fish & Wildlife Service", license: "Public domain", source: COMMONS + "White_crappie_pomoxis_annularis_(white_background).jpg" },
  "Channel Catfish": { slug: 'channel-catfish', w: 66, h: 22, artist: "Duane Raver, U.S. Fish & Wildlife Service", license: "Public domain", source: COMMONS + "Ictalurus_punctatus_(white_background).png" },
  "Blue Catfish": { slug: 'blue-catfish', w: 66, h: 23, artist: "Duane Raver, U.S. Fish & Wildlife Service", license: "Public domain", source: COMMONS + "Blue_catfish_ictalurus_furcatus_fish_(white_background).jpg" },
  "Flathead Catfish": { slug: 'flathead-catfish', w: 66, h: 22, artist: "Duane Raver, U.S. Fish & Wildlife Service", license: "Public domain", source: COMMONS + "Flathead_catfish_(white_background).jpg" },
  "Rainbow Trout": { slug: 'rainbow-trout', w: 66, h: 24, artist: "Duane Raver, U.S. Fish & Wildlife Service", license: "Public domain", source: COMMONS + "Oncorhynchus_mykiss_mid_res_150dpi_whiteBG.jpg" },
  "Sauger": { slug: 'sauger', w: 66, h: 19, artist: "Duane Raver, U.S. Fish & Wildlife Service", license: "Public domain", source: COMMONS + "Saugernctc.jpg" },
  "White Bass": { slug: 'white-bass', w: 66, h: 31, artist: "Duane Raver, U.S. Fish & Wildlife Service", license: "Public domain", source: COMMONS + "Morone_chrysops_white_bass_fish_(white_background).jpg" },
  "Striped Bass": { slug: 'striped-bass', w: 66, h: 23, artist: "Duane Raver, U.S. Fish & Wildlife Service", license: "Public domain", source: COMMONS + "Striped_bass_morone_saxatilis_fish_(white_background).jpg" },
  "Freshwater Drum": { slug: 'freshwater-drum', w: 66, h: 32, artist: "Duane Raver, U.S. Fish & Wildlife Service", license: "Public domain", source: COMMONS + "Freshwaterdrum_(white_background).png" },
  "Common Carp": { slug: 'common-carp', w: 66, h: 28, artist: "U.S. Fish & Wildlife Service", license: "Public domain", source: COMMONS + "Common_carp_(white_background).jpg" },
  "Skipjack Herring": { slug: 'skipjack-herring', w: 66, h: 26, artist: "Duane Raver, U.S. Fish & Wildlife Service", license: "Public domain", source: COMMONS + "Skipjack_herring_fish_alosa_chrysochloris_(white_background).jpg" },
  "Pumpkinseed": { slug: 'pumpkinseed', w: 66, h: 42, artist: "Duane Raver, U.S. Fish & Wildlife Service", license: "Public domain", source: COMMONS + "Lepomis_gibbosus2_(white_background).jpg" },
  "Chain Pickerel": { slug: 'chain-pickerel', w: 66, h: 20, artist: "Duane Raver, U.S. Fish & Wildlife Service", license: "Public domain", source: COMMONS + "Chain_pickerel_(Duane_Raver).png" },
  "Yellow Perch": { slug: 'yellow-perch', w: 66, h: 27, artist: "U.S. Fish & Wildlife Service", license: "Public domain", source: COMMONS + "Yellow_Perch_(Perca_flavescens)_white_background.jpg" },
  "White Perch": { slug: 'white-perch', w: 66, h: 34, artist: "Duane Raver, U.S. Fish & Wildlife Service", license: "Public domain", source: COMMONS + "Whiteperchnctc_(white_background).jpg" },
  "Spot": { slug: 'spot', w: 66, h: 33, artist: "Brandi Noble, NOAA Fisheries Collection", license: "Public domain", source: COMMONS + "Spot_(_Leiostomus_xanthurus_).jpg" },
  "Atlantic Croaker": { slug: 'atlantic-croaker', w: 66, h: 33, artist: "United States Fish Commission", license: "Public domain", source: COMMONS + "Micropogonias_undulatus.jpg" },
  "Northern Snakehead": { slug: 'northern-snakehead', w: 66, h: 19, artist: "Nerea Goikoetxea Zabala", license: "CC BY-SA 4.0", source: COMMONS + "Channa_argus_illustration.jpg" },
};

// Generic "Catfish" (used by some spots) borrows the channel catfish sprite.
FISH_ART.Catfish = FISH_ART['Channel Catfish'];
