import { LinkCard, PageHeader } from '../components/ui.jsx';
import { GLOSSARY } from '../data/basics.js';

export default function Learn() {
  return (
    <div className="space-y-4">
      <PageHeader title="Learn to Fish" subtitle="Everything a beginner needs, in plain language." />
      <div className="grid gap-3 sm:grid-cols-2">
        <LinkCard to="/learn/basics" icon="🎯" title="Fishing Basics">First-trip checklist, casting, detecting bites, hook sets, landing, handling and catch-and-release.</LinkCard>
        <LinkCard to="/learn/gear" icon="🧰" title="My Tackle Box">Every item you own: when to use it, how to rig it, and the 3 knots you need for 8 lb mono.</LinkCard>
        <LinkCard to="/fish" icon="📖" title="Fish Guide">How to identify each local fish, when they bite and what to use.</LinkCard>
        <LinkCard to="/learn/safety" icon="⚠️" title="Safety, Advisories & Rules">Fish consumption advisories, cleaning fish safely, licenses and regulations.</LinkCard>
      </div>
      <section className="card">
        <h2 className="mb-2 font-semibold">📚 Fishing words, explained</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          {Object.entries(GLOSSARY).map(([term, def]) => (
            <div key={term} className="rounded-xl bg-slate-50 p-3">
              <dt className="font-semibold text-slate-900">{term}</dt>
              <dd className="text-sm text-slate-600">{def}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
