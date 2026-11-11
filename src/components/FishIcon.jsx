import { FISH_ART } from '../data/fishArt.js';
import { SPECIES } from '../data/species.js';

// Pixel-art sprite for a species (falls back to its emoji). `size` is the display
// width in px; sprites are scaled with nearest-neighbour so the pixels stay crisp.
export default function FishIcon({ name, size = 48, className = '', dim = false }) {
  const art = FISH_ART[name];
  if (!art) {
    return <span className={`inline-block text-center ${dim ? 'opacity-40 grayscale' : ''} ${className}`} style={{ fontSize: size * 0.6, width: size }} aria-hidden>{(SPECIES[name] || SPECIES.Other).emoji}</span>;
  }
  return (
    <img
      src={`${import.meta.env.BASE_URL}fish/${art.slug}.png`}
      alt=""
      width={size}
      height={Math.round((size * art.h) / art.w)}
      className={`pixelated inline-block ${dim ? 'opacity-35 brightness-0' : ''} ${className}`}
      loading="lazy"
    />
  );
}

export function FishArtCredit({ name }) {
  const art = FISH_ART[name];
  if (!art) return null;
  return (
    <p className="text-[11px] text-slate-400">
      Pixel art adapted from an illustration by {art.artist} ({art.license}),{' '}
      <a href={art.source} target="_blank" rel="noreferrer" className="underline">Wikimedia Commons</a>.
    </p>
  );
}
