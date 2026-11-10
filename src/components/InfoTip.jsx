import { useEffect, useId, useRef, useState } from 'react';

// Small "?" button that explains a term. Works with tap (mobile) and hover/focus (desktop).
export default function InfoTip({ children, label = 'What does this mean?' }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={(e) => { e.preventDefault(); setOpen((o) => !o); }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-river-100 text-[11px] font-bold text-river-800 hover:bg-river-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-river-500"
      >
        ?
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-2 text-left text-xs font-normal leading-relaxed text-white shadow-lg"
        >
          {children}
        </span>
      )}
    </span>
  );
}
