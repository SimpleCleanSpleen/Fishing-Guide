// Spot photos, all free and keyless:
//  - Wikimedia Commons: each suggested spot lists exact Commons file names in its
//    location JSON (`photos: [{ file, caption }]`). Special:FilePath redirects to a
//    resized thumbnail, so no API call is needed.
//  - Esri World Imagery: an aerial snapshot centred on any coordinate, so every spot
//    (including your own pins) has at least one picture.
const COMMONS = 'https://commons.wikimedia.org/wiki/';

// Commons serves standard thumbnail widths (330, 500, 960...); other sizes round up.
export const commonsThumb = (file, width = 500) => `${COMMONS}Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
export const commonsPage = (file) => `${COMMONS}File:${encodeURIComponent(file.replace(/ /g, '_'))}`;

export function aerialUrl(lat, lng, { width = 640, height = 360, spanDeg = 0.006 } = {}) {
  // spanDeg is half the width in degrees of longitude (~1 km wide at these latitudes).
  const dLat = spanDeg * Math.cos((lat * Math.PI) / 180) * (height / width);
  const bbox = [lng - spanDeg, lat - dLat, lng + spanDeg, lat + dLat].map((n) => n.toFixed(5)).join(',');
  return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export'
    + `?bbox=${bbox}&bboxSR=4326&imageSR=3857&size=${width},${height}&format=jpg&f=image`;
}

// Every picture for a spot: curated Commons photos first, then the aerial view.
export function spotPhotos(spot) {
  const list = (spot.photos || []).map((p) => ({
    src: commonsThumb(p.file, 960),
    thumb: commonsThumb(p.file, 330),
    caption: p.caption,
    credit: 'Wikimedia Commons',
    href: commonsPage(p.file),
  }));
  list.push({
    src: aerialUrl(spot.lat, spot.lng),
    thumb: aerialUrl(spot.lat, spot.lng, { width: 330, height: 220 }),
    caption: 'Aerial view',
    credit: 'Esri World Imagery',
    href: `https://www.google.com/maps/search/?api=1&query=${spot.lat}%2C${spot.lng}`,
    aerial: true,
  });
  return list;
}
