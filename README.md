# 🎣 Fishing Guide

**A real-life version of the in-game fishing guides from video games, for real places.**
Live conditions, a "what's biting now" list, a fish encyclopedia you fill in as you
catch fish, a map of spots, and a personal journal that learns your best times and baits.

**Clarksville, Tennessee is the first location.** The app is built so new cities can be
added with one JSON file (see [Adding a location](#adding-a-new-location)).

Live site (after setup): `https://simplecleanspleen.github.io/Fishing-Guide/`

---

## Features

| | |
|---|---|
| 🏠 **Home** | Current weather, barometric pressure & trend, wind, sunrise/sunset, moon phase, a 1-5 **fishing outlook** with plain-English reasons, live **USGS river gauges** (Cumberland River flow/stage), and **What's biting now** for this month and time of day. |
| 📖 **Fish Guide** | A game-style fish encyclopedia: how to identify each local species, season and time-of-day charts, best baits *from your own tackle box*, where to find it locally, and a **collection tracker** (X / 15 species caught, personal bests). |
| ➕ **Catch logger** | Species, weight (lb + oz, straight off the scale), length, bait, spot, date, time, photo, notes, released. Weather, pressure trend, moon and river level are **recorded automatically** for each catch. |
| 📓 **Journal & Insights** | Catch history with filters and search. Insights show your best **time of day**, **time of year** and **most successful bait** per species, plus the weather patterns behind your catches. All analysis runs in the browser. |
| 🗺️ **Map** | Leaflet + OpenStreetMap, 10 suggested Clarksville spots, and **your own pins**: tap the map, use GPS, or type coordinates. |
| 🎓 **Learn** | *My Tackle Box* (every item you own: when and how to use it, Senko rigging, Trout Magnet setup, 3 knots for 8 lb mono), *Fishing Basics* (casting, bites, hook sets, handling, catch-and-release, safety), glossary, and *Safety, Advisories & Rules*. |
| 📶 **Offline (PWA)** | Installable on your phone. The app shell, viewed map tiles and the last weather/river data are cached. Catches logged with no signal sync automatically later. |
| ❔ **Beginner tooltips** | Tap any **?** for an explanation of the term. |

---

## Tech & free-only services

- React 19 + Vite 7 + Tailwind CSS 4, a static site with **HashRouter** (`#/map`, `#/log`…) so it works on GitHub Pages.
- **Firebase (free Spark plan):** Authentication (Google) and Cloud Firestore only. No Cloud Functions, no Storage, nothing that needs billing.
- **Open-Meteo** (no key): weather, pressure, sunrise/sunset, and historical weather for older catches.
- **USGS Water Services** (no key): live river gauges, found automatically within the location's bounding box.
- **Moon phase** is calculated locally (pure astronomy, no API).
- **Leaflet + OpenStreetMap** tiles (no key).
- Responses are cached in `localStorage` (weather 30 min, river 1 h, past weather forever) and by the service worker to stay well inside rate limits.
- **Demo mode:** until you paste your Firebase config, the app runs fully with data saved in the browser, so you can try it immediately.

---

## Setup, step by step

### Current setup: shared with Zombie Evac's Firebase project

This app currently uses the **Zombie Evac** Firebase project (`zombie-evac-vl6cz`). Google sign-in, Firestore,
and the `simplecleanspleen.github.io` authorized domain were already set up there, and the config is already in
[`src/firebase/config.js`](src/firebase/config.js). Fishing data is stored in its own `anglers/` collection,
separate from the game's `users/`, `screenNames/` and `leaderboard/`.

**One-time steps remaining:**

1. **Publish the combined Firestore rules.** Firebase console → project *zombie-evac-vl6cz* → **Firestore Database → Rules**.
   Replace everything with the contents of [`firestore.rules`](firestore.rules) and click **Publish**.
   The file covers **both** apps. The same file is in the Zombie-Evac repo, so whichever copy you publish, keep the two identical.
   *(Or with the Firebase CLI from this folder: `npm i -g firebase-tools`, `firebase login`, `firebase deploy --only firestore:rules`.)*
2. **Enable GitHub Pages:** repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
   Then re-run the failed "Deploy to GitHub Pages" workflow in the **Actions** tab, or push any commit.

Until step 1 is done, signing in works but saving catches and pins fails with *"Missing or insufficient permissions"*.

### Moving to a separate Firebase project later (optional)

When the app outgrows the shared project, follow steps 1-7 below with a new project, paste its config into
`src/firebase/config.js`, keep only the `anglers` section in `firestore.rules`, and update `.firebaserc`.
Existing catches can be exported from the old project with the Firebase CLI or a small script.

#### 1. Create the Firebase project
1. Go to <https://console.firebase.google.com> and click **Create a project**.
2. Name it (e.g. `fishing-guide`). Google Analytics is optional; you can turn it off.
3. Stay on the free **Spark** plan. Don't upgrade.

#### 2. Turn on Google Sign-In
1. In the left menu: **Build → Authentication → Get started**.
2. **Sign-in method** tab → **Google** → **Enable**, pick a support email → **Save**.

#### 3. Create the Firestore database
1. **Build → Firestore Database → Create database**.
2. Choose a location close to you (e.g. `nam5 (United States)`). This can't be changed later.
3. Start in **production mode**.
4. Open the **Rules** tab, paste the rules from [`firestore.rules`](firestore.rules), and click **Publish**.
   They let each signed-in user read and write **only** `anglers/{their uid}/...` (`request.auth.uid == userId`).

#### 4. Paste your web config
1. Firebase console → ⚙️ **Project settings → General → Your apps → Web (`</>`)**. Register an app (any nickname, **no** Hosting needed).
2. Copy the `firebaseConfig` values into [`src/firebase/config.js`](src/firebase/config.js).

> The web config is **not secret**. It only identifies your project, and the security rules protect the data, so it's fine to commit.
> **Never commit a service-account key** (`*-firebase-adminsdk-*.json`). `.gitignore` blocks the usual filenames, and this app never needs one.

#### 5. Push to GitHub
```bash
git add src/firebase/config.js
git commit -m "Add Firebase config"
git push origin main
```

#### 6. Enable GitHub Pages
1. On GitHub: repo **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Every push to `main` now runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which builds and publishes the site. Watch progress in the **Actions** tab. The URL appears there and in Settings → Pages.

The workflow sets Vite's `base` to `/<repo-name>/` automatically. If you rename the repo, nothing else needs to change.
(If you ever deploy from a repo named `username.github.io`, set `VITE_BASE: /` in the workflow.)

#### 7. Authorize your GitHub Pages domain for sign-in
Google Sign-In only works on domains you approve:
1. Firebase console → **Authentication → Settings → Authorized domains**.
2. Click **Add domain** and enter **`simplecleanspleen.github.io`**: just the domain, no `https://` and no `/Fishing-Guide` path.
3. Save. `localhost` is already on the list for local testing.

If you see *"This website isn't on your Firebase Authorized domains list"* when signing in, this step is missing.
(Already done for the shared Zombie Evac project.)

### Install it on your phone (optional)
Open the site on your phone → browser menu → **Add to Home Screen / Install app**. It now opens like an app and works with weak or no signal.

### Before you fish
- 🪪 **Buy a Tennessee fishing license** (required for ages 13+): <https://www.gooutdoorstennessee.com/>
- 📜 **Read the current TWRA regulations** (size and creel limits vary by water body): <https://www.tn.gov/twra/fishing.html>
- 📍 **All suggested spot coordinates are approximate.** Verify access, parking, hours and posted rules before visiting.
- 🧪 Check **TDEC fish consumption advisories** before eating fish (see the app's *Safety, Advisories & Rules* page).

---

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173/Fishing-Guide/
npm run build      # production build into dist/
npm run preview    # serve the production build (PWA enabled)
```

---

## Project structure

```
.github/workflows/deploy.yml   Build + deploy to GitHub Pages on push to main
firestore.rules                Per-user security rules (shared with Zombie Evac, see header)
firebase.json, .firebaserc     Let `firebase deploy --only firestore:rules` target the project
vite.config.js                 Base path, Tailwind, PWA (offline caching rules)
public/                        Icons (favicon, PWA icons)
src/
  main.jsx, App.jsx            Entry point, HashRouter, routes (lazy-loaded pages)
  firebase/config.js           ← paste your Firebase web config here
  firebase/init.js             Firebase app, Auth, Firestore with offline cache
  context/                     AuthContext (Google sign-in / demo), LocationContext, DataContext (live catches & pins)
  services/
    repository.js              All reads/writes (Firestore, or localStorage in demo mode)
    weather.js                 Open-Meteo forecast + conditions at a past date/hour
    usgs.js                    USGS gauge discovery and parsing
    moon.js                    Moon phase calculation
    enrich.js                  Attaches conditions to a catch
    analytics.js               Insights engine + fishing outlook (client-side)
    bitingNow.js               "What's biting now" ranking
    image.js                   In-browser photo resize/compress (and how to move to Storage)
    cache.js                   localStorage cache with expiry
  data/
    locations/                 One JSON file per location (spots, advisories, regulations)
    species.js                 Seasonal/daily patterns + baits per species
    identify.js                How to recognize each fish
    gear.js                    "My Tackle Box": your gear and how to use it
    basics.js                  Fishing Basics lessons + glossary
  components/                  Layout, InfoTip, cards, charts, sign-in, conditions & river cards
  pages/                       Home, FishGuide, FishDetail, LogCatch, Journal, Insights, MapPage, Learn, GearGuide, Basics, Safety
```

### Data model (Firestore)
```
anglers/{uid}/catches/{catchId}
  species, weightLb, lengthIn, bait, spotId, spotName, lat, lng, locationId,
  date "YYYY-MM-DD", time "HH:MM", timeOfDay, notes, released, photo (base64 JPEG),
  conditions { tempF, pressureHpa, pressureInHg, pressureTrend, cloudCover, windMph,
               precipIn, weatherCode, sunrise, sunset, moon, moonIllumination,
               riverSite, riverFlowCfs, riverStageFt, riverTrend, waterTempF },
  conditionsPending, createdAt, updatedAt
anglers/{uid}/spots/{spotId}
  name, type, notes, lat, lng, locationId, createdAt
```

---

## How Insights work

For every species the app starts with general guide knowledge (from `src/data/species.js`) and adds your catches on top:

```
score(option) = 3 × guide weight + number of your catches with that option
```

With a couple of catches, the guide leads. Once you've logged roughly 10+ of a species, your own results dominate.
Each recommendation shows a confidence label (*Guide knowledge only → Early → Growing → Strong pattern*).
Baits are ranked purely from your catches (count, then average weight). Conditions (pressure trend, sky, air
temperature, moon, river flow) are tallied from what was recorded with each catch.

---

## Photos: base64 in Firestore (and switching to Storage later)

Firebase Storage may require a billing plan on new projects, so photos are resized in the browser to **max 800 px**,
JPEG-compressed to about **350 KB or less**, and saved as a base64 string inside the catch document (Firestore's limit is 1 MiB per
document).

To switch to Firebase Storage later:
1. Upgrade if required, enable **Storage**, and add rules allowing `anglers/{uid}/**` only when `request.auth.uid == uid`.
2. In `src/services/image.js`, produce a Blob (`canvas.toBlob`) and upload it with `uploadBytes(ref(storage, \`users/${uid}/catches/${id}.jpg\`), blob)`, then `getDownloadURL()`.
3. Save `photoUrl` instead of `photo` on the catch, and render `photoUrl` in `CatchCard`/`LogCatch`.
4. Optionally run a one-time migration that uploads existing base64 photos and clears the `photo` field.

---

## Adding a new location

1. Copy `src/data/locations/clarksville-tn.json` to e.g. `src/data/locations/knoxville-tn.json`.
2. Edit: `id`, `name`, `region`, `center`, `zoom`, `timezone`, `usgs.bbox` (`west,south,east,north`) and `usgs.preferName`
   (main river name), `commonSpecies`, `regulations`, `advisories`, and the `spots` (mark them `"approximate": true`).
3. Register it in `src/data/locations/index.js`.

The location picker in the header appears automatically. Weather, gauges, the map, the Fish Guide, and Insights all
follow the selected location. Catches and pins are tagged with their `locationId`.
New species can be added to `src/data/species.js` (patterns) and `src/data/identify.js` (identification).

---

## Disclaimers

- Spot coordinates are **approximate**. Always verify public access and posted rules.
- Advisory and regulation text is a beginner summary, **not official guidance**. Check TWRA and TDEC directly.
- Weather © Open-Meteo (CC BY 4.0). River data: USGS (provisional). Map data © OpenStreetMap contributors (ODbL).
