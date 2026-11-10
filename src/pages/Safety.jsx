import { Link } from 'react-router-dom';
import { Badge, Callout, PageHeader } from '../components/ui.jsx';
import { useLocation } from '../context/LocationContext.jsx';

const LEVEL_TONE = { Precautionary: 'amber', 'Bacterial / no contact': 'rose', General: 'sky' };

export default function Safety() {
  const { location } = useLocation();
  const { advisories, regulations } = location;

  return (
    <div className="space-y-4">
      <Link to="/learn" className="text-sm font-medium text-river-700">← Learn</Link>
      <PageHeader title="Safety, Advisories & Rules" subtitle={location.name} />

      <Callout tone="rose" icon="⚠️" title="Always check before you keep fish to eat">
        Advisories change. This page is a beginner summary, not official guidance: confirm on the {advisories.agency} website.
      </Callout>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">🧪 Water quality & fish consumption advisories</h2>
        <p className="text-sm leading-relaxed">{advisories.summary}</p>
        <ul className="space-y-2">
          {advisories.items.map((a) => (
            <li key={a.title} className="rounded-xl bg-slate-50 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{a.title}</span>
                <Badge tone={LEVEL_TONE[a.level] || 'slate'}>{a.level}</Badge>
              </div>
              <p className="mt-1 leading-relaxed text-slate-600">{a.detail}</p>
            </li>
          ))}
        </ul>
        <LinkList links={advisories.links} />
      </section>

      <section className="card space-y-2 text-sm">
        <h2 className="text-lg font-semibold">🔪 Eating fish more safely</h2>
        <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
          <li><b>Keep smaller, younger fish.</b> Contaminants such as PCBs and mercury build up over a fish&apos;s life, so big old catfish and bass carry more. Follow legal size limits.</li>
          <li><b>Trim the fat.</b> PCBs collect in fat. Remove the skin, belly fat, the fat along the back, and the dark fatty strip along the side of the fillet.</li>
          <li><b>Cook so fat drips away:</b> bake, broil or grill on a rack. Don&apos;t use the drippings, and avoid frying in the fish&apos;s own fat.</li>
          <li><b>Kids, pregnant or nursing women and women who may become pregnant</b> should follow the strictest guidance and avoid fish from advisory waters.</li>
          <li>Don&apos;t eat fish from streams posted for bacteria. Wash hands before eating or smoking at the bank, and clean cuts well.</li>
          <li>Keep fish you plan to eat cold (on ice) and clean them the same day.</li>
        </ul>
      </section>

      <section className="card space-y-3 text-sm">
        <h2 className="text-lg font-semibold">📜 License & regulations</h2>
        <p className="leading-relaxed">{regulations.summary}</p>
        <ul className="list-disc space-y-1 pl-5">{regulations.tips.map((t) => <li key={t}>{t}</li>)}</ul>
        <LinkList links={regulations.links} />
      </section>

      <section className="card space-y-2 text-sm">
        <h2 className="text-lg font-semibold">🦺 Bank safety</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Don&apos;t wade in the Cumberland: currents are strong and the bottom drops off suddenly. Watch for barge wakes.</li>
          <li>Below dams, water can rise fast when generators start. Horns or sirens mean move to high ground.</li>
          <li>Lightning: carbon rods conduct electricity. Leave at the first thunder and wait 30 minutes after the last.</li>
          <li>Heat: bring water, use the chair umbrella, and wear sunscreen and a hat.</li>
          <li>Ticks & mosquitoes: use bug spray (away from your tackle) and check for ticks afterwards.</li>
          <li>Respect private property and posted signs; leave no trash or fishing line behind: it tangles birds and turtles.</li>
        </ul>
      </section>
    </div>
  );
}

function LinkList({ links }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {links.map((l) => (
        <li key={l.url}>
          <a href={l.url} target="_blank" rel="noreferrer" className="btn-secondary px-3 py-1.5 text-xs">{l.label} ↗</a>
        </li>
      ))}
    </ul>
  );
}
