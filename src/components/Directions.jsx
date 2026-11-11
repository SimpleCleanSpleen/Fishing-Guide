import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Navigation apps for a destination. On phones the Google Maps, Apple Maps and Waze links
// open the installed app; otherwise they open in the browser.
export function directionsApps(lat, lng, label = '') {
  const ll = `${lat},${lng}`;
  return [
    { id: 'google', name: 'Google Maps', icon: '🗺️', href: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ll)}` },
    { id: 'apple', name: 'Apple Maps', icon: '🍎', href: `https://maps.apple.com/?daddr=${encodeURIComponent(ll)}${label ? `&q=${encodeURIComponent(label)}` : ''}` },
    { id: 'waze', name: 'Waze', icon: '🚙', href: `https://waze.com/ul?ll=${encodeURIComponent(ll)}&navigate=yes` },
    { id: 'osm', name: 'OpenStreetMap', icon: '🧭', href: `https://www.openstreetmap.org/directions?to=${encodeURIComponent(ll)}` },
  ];
}

// "Directions" button that opens a small menu of map apps. The menu is rendered on
// document.body (fixed position) so cards with overflow-hidden can't clip it.
export default function DirectionsMenu({ lat, lng, label, className = 'btn-secondary px-3 py-2' }) {
  const [pos, setPos] = useState(null); // { left, top } or { left, bottom } when open
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const open = !!pos;

  function toggle() {
    if (open) { setPos(null); return; }
    const r = btnRef.current.getBoundingClientRect();
    const menuH = 230;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - 216));
    // Open upward when there isn't room below (e.g. above the bottom nav).
    setPos(window.innerHeight - r.bottom < menuH + 72 ? { left, bottom: window.innerHeight - r.top + 4 } : { left, top: r.bottom + 4 });
  }

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) setPos(null); };
    const esc = (e) => { if (e.key === 'Escape') setPos(null); };
    const away = () => setPos(null);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', away, true);
    window.addEventListener('resize', away);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', esc);
      window.removeEventListener('scroll', away, true);
      window.removeEventListener('resize', away);
    };
  }, [open]);

  return (
    <>
      <button ref={btnRef} type="button" onClick={toggle} aria-expanded={open} aria-haspopup="menu" className={className}>
        🧭 Directions <span aria-hidden className={`text-xs transition ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && createPortal(
        <div ref={menuRef} role="menu" style={{ position: 'fixed', ...pos }} className="z-[1000] w-52 overflow-hidden rounded-xl bg-white py-1 text-sm shadow-lg ring-1 ring-slate-200">
          <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Open in…</p>
          {directionsApps(lat, lng, label).map((a) => (
            <a key={a.id} role="menuitem" href={a.href} target="_blank" rel="noreferrer" onClick={() => setPos(null)} className="flex items-center gap-2 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50">
              <span aria-hidden>{a.icon}</span>{a.name}<span className="ml-auto text-slate-300" aria-hidden>↗</span>
            </a>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}

// Compact inline version for small spaces like map popups: "Google · Apple · Waze".
export function DirectionsInline({ lat, lng, label }) {
  const apps = directionsApps(lat, lng, label).filter((a) => a.id !== 'osm');
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2">
      <span className="text-slate-500">🧭</span>
      {apps.map((a) => <a key={a.id} href={a.href} target="_blank" rel="noreferrer">{a.name.replace(' Maps', '')} ↗</a>)}
    </span>
  );
}
