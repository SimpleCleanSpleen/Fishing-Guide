import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui.jsx';
import { BASICS } from '../data/basics.js';

export default function Basics() {
  return (
    <div className="space-y-4">
      <Link to="/learn" className="text-sm font-medium text-river-700">← Learn</Link>
      <PageHeader title="Fishing Basics" subtitle="Step-by-step skills for your first trips." />
      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="Sections">
        {BASICS.map((b) => (
          <a key={b.id} href={`#/learn/basics`} onClick={(e) => { e.preventDefault(); document.getElementById(b.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200">
            {b.icon} {b.title}
          </a>
        ))}
      </nav>
      {BASICS.map((b) => (
        <section key={b.id} id={b.id} className="card scroll-mt-20">
          <h2 className="text-lg font-semibold">{b.icon} {b.title}</h2>
          <ol className="mt-3 space-y-2">
            {b.steps.map((s, i) => (
              <li key={s} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-river-700 text-xs font-bold text-white">{i + 1}</span>
                <span className="pt-0.5 leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
          {b.tips?.length > 0 && (
            <ul className="mt-3 space-y-1 rounded-xl bg-river-50 p-3 text-sm text-river-900">
              {b.tips.map((t) => <li key={t}>💡 {t}</li>)}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
