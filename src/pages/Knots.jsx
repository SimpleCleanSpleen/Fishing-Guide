import { Link } from 'react-router-dom';
import KnotSteps, { KnotLegend } from '../components/KnotSteps.jsx';
import { PageHeader } from '../components/ui.jsx';
import { useTackle } from '../utils/useTackle.js';

export default function Knots() {
  const tackle = useTackle();
  const knots = tackle.gear.find((g) => g.knots)?.knots || [];
  return (
    <div className="space-y-4">
      <Link to="/learn" className="text-sm font-medium text-river-700">← Learn</Link>
      <PageHeader title="How to Tie Knots" subtitle="The 3 knots a beginner needs, step by step with pictures." />
      <section className="card space-y-3">
        <KnotLegend />
        <p className="text-sm text-slate-600">Practice at home with thick string and a key ring before your trip. Always wet a knot before pulling it tight: friction heat weakens fishing line.</p>
        {knots.map((k) => <KnotSteps key={k.name} knot={k} />)}
      </section>
    </div>
  );
}
