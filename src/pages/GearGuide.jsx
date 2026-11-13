import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import InfoTip from '../components/InfoTip.jsx';
import KnotSteps, { KnotLegend } from '../components/KnotSteps.jsx';
import { Callout, PageHeader } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { GEAR_CATEGORIES } from '../data/gear.js';
import { saveGear } from '../services/repository.js';
import { useTackle } from '../utils/useTackle.js';

export default function GearGuide() {
  const tackle = useTackle();
  const { user, profile } = useAuth();
  const [cat, setCat] = useState('All');
  const [open, setOpen] = useState(() => new Set(['rod-reel']));
  const canEdit = !!user && !tackle.personal;
  const items = tackle.gear.filter((g) => (cat === 'All' || g.category === cat || (cat === 'Mine' && g.owned)));
  const toggle = (id) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Ticked items live in your profile as { gearId: 'brand/model or empty' }.
  const owned = profile?.gear || {};
  const setOwned = (id, has, label = '') => {
    const next = { ...owned };
    if (has) next[id] = label; else delete next[id];
    return saveGear(user.uid, next);
  };

  return (
    <div className="space-y-4">
      <Link to="/learn" className="text-sm font-medium text-river-700">← Learn</Link>
      <PageHeader
        title={tackle.boxName}
        subtitle={tackle.personal
          ? 'When and how to use every piece of gear you own.'
          : tackle.setUp
            ? `You have ${tackle.ownedCount} of ${tackle.gear.length} items in the beginner kit. Trip packing lists mark what you still need.`
            : 'A simple beginner kit: what each piece is for, when to use it and how to rig it.'}
      />

      {canEdit && !tackle.setUp && (
        <Callout tone="sky" icon="✅" title="Tick what you own">
          Mark the gear you already have (and its brand, if you like). Trip packing lists will then show exactly what you still need to buy or borrow.
        </Callout>
      )}
      {!user && (
        <Callout tone="sky" icon="👋">Sign in to tick the gear you own and get packing lists that know what's in your box.</Callout>
      )}

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
        {['All', ...(tackle.setUp && !tackle.personal ? ['Mine'] : []), ...GEAR_CATEGORIES].map((c) => (
          <button key={c} type="button" onClick={() => setCat(c)} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${cat === c ? 'bg-river-700 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>
            {c === 'Mine' ? `✅ Mine (${tackle.ownedCount})` : c}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {items.map((g) => {
          const isOpen = open.has(g.id);
          return (
            <article key={g.id} className={`card p-0 ${canEdit && g.owned ? 'ring-emerald-300' : ''}`}>
              <div className="flex items-center gap-3 p-4">
                <button type="button" onClick={() => toggle(g.id)} aria-expanded={isOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span className="text-2xl" aria-hidden>{g.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium uppercase tracking-wide text-river-700">{g.category}</span>
                    <span className="block font-semibold text-slate-900">{g.name}</span>
                    {g.kind && g.kind !== g.name && <span className="block text-xs text-slate-500">{g.kind}</span>}
                  </span>
                  <span className={`text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`} aria-hidden>▾</span>
                </button>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setOwned(g.id, !g.owned, owned[g.id] || '')}
                    aria-pressed={g.owned}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${g.owned ? 'bg-emerald-600 text-white ring-emerald-600' : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50'}`}
                  >
                    {g.owned ? '✓ I have it' : 'I have this'}
                  </button>
                )}
              </div>
              {canEdit && g.owned && <BrandField key={g.id} value={owned[g.id] || ''} placeholder={g.kind} onSave={(label) => setOwned(g.id, true, label)} />}
              {isOpen && (
                <div className="prose-tight space-y-3 border-t border-slate-100 p-4 text-sm">
                  <p><b>When to use it:</b> {g.when} {g.tooltip && <InfoTip>{g.tooltip}</InfoTip>}</p>
                  <div>
                    <p className="font-semibold">How to use it</p>
                    <ol>{g.how.map((h) => <li key={h}>{h}</li>)}</ol>
                  </div>
                  {g.knots && (
                    <div className="space-y-2">
                      <p className="font-semibold">Knots you need</p>
                      <KnotLegend />
                      {g.knots.map((k) => <KnotSteps key={k.name} knot={k} />)}
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
        {items.length === 0 && <p className="py-6 text-center text-sm text-slate-400">Nothing here yet.</p>}
      </div>
    </div>
  );
}

// "Your brand / model" for an owned item, saved when you stop typing.
function BrandField({ value, placeholder, onSave }) {
  const [v, setV] = useState(value);
  const timer = useRef(null);
  const save = useRef(onSave);
  save.current = onSave; // always save against the latest gear map
  useEffect(() => () => clearTimeout(timer.current), []);
  const change = (e) => {
    const next = e.target.value.slice(0, 80);
    setV(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => save.current(next.trim()), 800);
  };
  return (
    <div className="-mt-2 px-4 pb-3">
      <input
        className="input py-1.5 text-sm"
        value={v}
        onChange={change}
        onBlur={() => { clearTimeout(timer.current); if (v.trim() !== value) save.current(v.trim()); }}
        placeholder={`Your brand / model (optional), e.g. ${placeholder}`}
        aria-label="Your brand or model"
      />
    </div>
  );
}
