import { useState } from 'react';
import { Link } from 'react-router-dom';
import InfoTip from '../components/InfoTip.jsx';
import { Callout, PageHeader } from '../components/ui.jsx';
import { GEAR_CATEGORIES } from '../data/gear.js';
import { useTackle } from '../utils/useTackle.js';

export default function GearGuide() {
  const tackle = useTackle();
  const [cat, setCat] = useState('All');
  const [open, setOpen] = useState(() => new Set(['rod-reel']));
  const items = tackle.gear.filter((g) => cat === 'All' || g.category === cat);
  const toggle = (id) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="space-y-4">
      <Link to="/learn" className="text-sm font-medium text-river-700">← Learn</Link>
      <PageHeader title={tackle.boxName} subtitle={tackle.personal ? 'When and how to use every piece of gear you own.' : 'A simple beginner kit: what each piece is for, when to use it and how to rig it.'} />

      <Callout icon="🧭" title="Two setups to start with">
        {tackle.personal ? (
          <><b>Panfish & trout:</b> Trout Magnet under a bobber (or worm on the Aberdeen #8). <b>Bass:</b> Texas-rigged or weightless
          Senko on the EWG 3/0.</>
        ) : (
          <><b>Panfish & trout:</b> a small jig or a piece of worm on a size 8 hook under a float. <b>Bass:</b> a Texas-rigged or
          weightless soft plastic stick worm on a 3/0 worm hook.</>
        )}{' '}Rig one, and if nothing bites in 20-30 minutes, switch or move.
      </Callout>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {['All', ...GEAR_CATEGORIES].map((c) => (
          <button key={c} type="button" onClick={() => setCat(c)} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${cat === c ? 'bg-river-700 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>{c}</button>
        ))}
      </div>

      <div className="space-y-3">
        {items.map((g) => {
          const isOpen = open.has(g.id);
          return (
            <article key={g.id} className="card p-0">
              <button type="button" onClick={() => toggle(g.id)} aria-expanded={isOpen} className="flex w-full items-center gap-3 p-4 text-left">
                <span className="text-2xl" aria-hidden>{g.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium uppercase tracking-wide text-river-700">{g.category}</span>
                  <span className="block font-semibold text-slate-900">{g.name}</span>
                </span>
                <span className={`text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`} aria-hidden>▾</span>
              </button>
              {isOpen && (
                <div className="prose-tight space-y-3 border-t border-slate-100 p-4 text-sm">
                  <p><b>When to use it:</b> {g.when} {g.tooltip && <InfoTip>{g.tooltip}</InfoTip>}</p>
                  <div>
                    <p className="font-semibold">How to use it</p>
                    <ol>{g.how.map((h) => <li key={h}>{h}</li>)}</ol>
                  </div>
                  {g.knots && (
                    <div className="space-y-2">
                      <p className="font-semibold">Knots for 8 lb mono</p>
                      {g.knots.map((k) => (
                        <div key={k.name} className="rounded-xl bg-slate-50 p-3">
                          <p className="font-semibold text-slate-900">🪢 {k.name}</p>
                          <p className="text-slate-600">{k.use}</p>
                          <ol className="mt-1">{k.steps.map((s) => <li key={s}>{s}</li>)}</ol>
                        </div>
                      ))}
                    </div>
                  )}
                  {g.tips?.length > 0 && (
                    <div className="rounded-xl bg-river-50 p-3 text-river-900">
                      <p className="font-semibold">Tips</p>
                      <ul>{g.tips.map((t) => <li key={t}>{t}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
