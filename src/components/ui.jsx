import { Link } from 'react-router-dom';

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, icon }) {
  return (
    <div className="card flex flex-col gap-1 p-3">
      <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
        {icon && <span aria-hidden>{icon}</span>}{label}
      </span>
      <span className="text-xl font-bold text-slate-900">{value}</span>
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </div>
  );
}

const TONES = {
  amber: 'bg-amber-50 text-amber-900 ring-amber-200',
  rose: 'bg-rose-50 text-rose-900 ring-rose-200',
  sky: 'bg-sky-50 text-sky-900 ring-sky-200',
  emerald: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  river: 'bg-river-50 text-river-900 ring-river-200',
};

export function Callout({ tone = 'river', icon = '💡', title, children, className = '' }) {
  return (
    <div className={`flex gap-3 rounded-2xl p-3 text-sm ring-1 ${TONES[tone]} ${className}`}>
      <span className="text-lg leading-none" aria-hidden>{icon}</span>
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export function Badge({ tone = 'slate', children }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${TONES[tone]}`}>{children}</span>;
}

// Horizontal bar chart. rows: [{ key, label?, value, sub? }]
export function Bars({ rows, max, highlightTop = true, format = (v) => v }) {
  const m = max ?? Math.max(...rows.map((r) => r.value), 0.0001);
  const topVal = Math.max(...rows.map((r) => r.value));
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => (
        <li key={r.key} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-2 text-sm">
          <span className="truncate text-slate-600" title={r.label || r.key}>{r.label || r.key}</span>
          <span className="h-3 overflow-hidden rounded-full bg-slate-100">
            <span
              className={`block h-full rounded-full ${highlightTop && r.value === topVal && topVal > 0 ? 'bg-river-600' : 'bg-river-200'}`}
              style={{ width: `${Math.max(2, (r.value / m) * 100)}%` }}
            />
          </span>
          <span className="w-12 text-right text-xs tabular-nums text-slate-500">{r.sub ?? format(r.value)}</span>
        </li>
      ))}
    </ul>
  );
}

export function EmptyState({ icon = '🎣', title, children, action }) {
  return (
    <div className="card flex flex-col items-center gap-2 py-10 text-center">
      <span className="text-4xl" aria-hidden>{icon}</span>
      <p className="font-semibold text-slate-900">{title}</p>
      <div className="max-w-sm text-sm text-slate-500">{children}</div>
      {action}
    </div>
  );
}

export function LinkCard({ to, icon, title, children }) {
  return (
    <Link to={to} className="card flex items-start gap-3 transition hover:ring-river-300">
      <span className="text-2xl" aria-hidden>{icon}</span>
      <span>
        <span className="block font-semibold text-slate-900">{title}</span>
        <span className="block text-sm text-slate-500">{children}</span>
      </span>
    </Link>
  );
}
