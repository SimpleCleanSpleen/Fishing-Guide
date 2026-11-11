import { LinkCard, PageHeader } from '../components/ui.jsx';
import { GLOSSARY } from '../data/basics.js';
import { useTackle } from '../utils/useTackle.js';

export default function Learn() {
  const tackle = useTackle();
  return (
    <div className="space-y-4">
      <PageHeader title="Learn to Fish" subtitle="Everything a beginner needs, in plain language." />
      <div className="grid gap-3 sm:grid-cols-2">
        <LinkCard to="/learn/basics" icon="🎯" title="Fishing Basics">First-trip checklist, casting, detecting bites, hook sets, landing, handling and catch-and-release.</LinkCard>
        <LinkCard to="/learn/gear" icon="🧰" title={tackle.boxName}>{tackle.personal ? 'Every item you own' : 'A beginner kit'}: when to use it, how to rig it, and the 3 knots you need.</LinkCard>
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
