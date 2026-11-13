import { useId } from 'react';

// Step-by-step knot diagrams. One small drawing per step, keyed by knot name and
// step index, so they line up with the step text in data/gear.js.
// Teal = main line (goes to the rod), orange = tag end (the loose end you tie with).

const MAIN = '#0f766e';
const TAG = '#ea580c';
const HOOK = '#64748b';
const NOTE = '#475569';

// Hook standing upright, eye at the top (40,30). Lines thread through the eye sideways.
function HookBack() {
  return (
    <g fill="none" stroke={HOOK} strokeLinecap="round">
      <path d="M40 38 V70 Q40 86 55 86 Q68 86 68 72 V62" strokeWidth="3.5" />
      <path d="M68 62 l-5 6" strokeWidth="3" />
      <path d="M40 21 A4.5 9 0 0 0 40 39" strokeWidth="3.5" />
    </g>
  );
}
// Front half of the eye, drawn over the line so it looks threaded.
const EyeFront = () => <path d="M40 21 A4.5 9 0 0 1 40 39" fill="none" stroke={HOOK} strokeWidth="3.5" strokeLinecap="round" />;

const Label = ({ x, y, children, anchor = 'start', color = NOTE }) => (
  <text x={x} y={y} fontSize="9" fill={color} textAnchor={anchor} fontFamily="system-ui, sans-serif">{children}</text>
);
const End = ({ x, y }) => <circle cx={x} cy={y} r="2.6" fill={TAG} />;

// Wraps of the tag end around the line(s): a row of narrow, tilted loops.
function Coils({ from, to, cy, ry, count }) {
  const step = count > 1 ? (to - from) / (count - 1) : 0;
  return (
    <g fill="none" stroke={TAG} strokeWidth="2.4">
      {Array.from({ length: count }, (_, i) => (
        <ellipse key={i} cx={from + i * step} cy={cy} rx="3" ry={ry} transform={`rotate(18 ${from + i * step} ${cy})`} />
      ))}
    </g>
  );
}

const line = (d, color, extra = {}) => <path d={d} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" {...extra} />;

const DIAGRAMS = {
  'Improved Clinch Knot': [
    (a) => (<>
      <HookBack />
      {line('M196 27 H34', MAIN)}
      {line('M34 27 A3 3 0 0 0 34 33 H128', TAG)}
      <End x={128} y={33} />
      <EyeFront />
      <Label x={150} y={20}>main line</Label>
      <Label x={134} y={44}>tag end (6 in)</Label>
    </>),
    (a) => (<>
      <HookBack />
      {line('M196 27 H34', MAIN)}
      {line('M34 27 A3 3 0 0 0 34 33 H56', TAG)}
      <Coils from={62} to={122} cy={30} ry={8} count={6} />
      {line('M126 24 L142 12', TAG)}
      <End x={142} y={12} />
      <EyeFront />
      <Label x={84} y={56}>wrap 5-7 times,</Label>
      <Label x={84} y={66}>leaving a <tspan fill={TAG}>small loop</tspan></Label>
      <Label x={84} y={76}>by the eye</Label>
    </>),
    (a) => (<>
      <HookBack />
      {line('M196 27 H34', MAIN)}
      {line('M34 27 A3 3 0 0 0 34 33 H56', TAG)}
      <Coils from={62} to={122} cy={30} ry={8} count={6} />
      {line('M126 24 C150 -6 62 -6 50 26', TAG, { markerEnd: `url(#${a})` })}
      <EyeFront />
      <Label x={84} y={56}>tag end goes through</Label>
      <Label x={84} y={66}>the small loop by the eye</Label>
      <Label x={150} y={16}>tag end</Label>
    </>),
    (a) => (<>
      <HookBack />
      {line('M196 27 H34', MAIN)}
      {line('M34 27 A3 3 0 0 0 34 33 H56', TAG)}
      <Coils from={62} to={122} cy={30} ry={8} count={6} />
      {line('M126 24 C150 -6 62 -6 50 30', TAG)}
      {line('M50 30 C46 50 82 52 90 16', TAG, { markerEnd: `url(#${a})` })}
      <EyeFront />
      <Label x={120} y={56}>back through</Label>
      <Label x={120} y={66}>the big loop</Label>
    </>),
    (a) => (<>
      <HookBack />
      {line('M196 30 H40', MAIN)}
      <Coils from={50} to={68} cy={30} ry={6} count={5} />
      {line('M70 34 l6 6', TAG)}
      <EyeFront />
      <Label x={86} y={60}>wet it, pull tight,</Label>
      <Label x={86} y={70}>trim the tag</Label>
    </>),
  ],

  'Palomar Knot': [
    (a) => (<>
      <HookBack />
      {line('M196 27 H40', MAIN)}
      {line('M128 33 H40', TAG)}
      <End x={128} y={33} />
      {line('M40 27 H12 A3 3 0 0 0 12 33 H40', MAIN)}
      <EyeFront />
      <Label x={150} y={20}>main line</Label>
      <Label x={6} y={14}>doubled loop</Label>
    </>),
    (a) => (<>
      <HookBack />
      {line('M196 27 H124', MAIN)}
      {line('M180 33 H128', TAG)}
      <End x={180} y={33} />
      {/* doubled strands through the eye */}
      {line('M104 27 H40 M104 33 H40', MAIN)}
      {line('M40 27 H34 A3 3 0 0 0 34 33 H40', MAIN)}
      {/* loose overhand knot */}
      {line('M104 27 C116 6 136 14 124 27 M104 33 C104 46 120 46 128 33', MAIN)}
      {/* the loop end hangs down */}
      {line('M114 40 C104 62 104 88 122 88 C140 88 140 62 124 42', MAIN)}
      <EyeFront />
      <Label x={197} y={52} anchor="end">loose</Label>
      <Label x={197} y={62} anchor="end">overhand knot</Label>
      <Label x={197} y={84} anchor="end">loop end</Label>
    </>),
    (a) => (<>
      <HookBack />
      {line('M196 27 H124', MAIN)}
      {line('M180 33 H128', TAG)}
      <End x={180} y={33} />
      {line('M104 27 H40 M104 33 H40', MAIN)}
      {line('M40 27 H34 A3 3 0 0 0 34 33 H40', MAIN)}
      {line('M104 27 C116 6 136 14 124 27 M104 33 C104 46 120 46 128 33', MAIN)}
      {line('M114 40 C104 62 104 88 122 88 C140 88 140 62 124 42', MAIN)}
      <path d="M112 92 C80 104 18 100 16 56" fill="none" stroke={NOTE} strokeWidth="1.6" strokeDasharray="4 3" markerEnd={`url(#${a})`} />
      <EyeFront />
      <Label x={197} y={62} anchor="end">pass the</Label>
      <Label x={197} y={72} anchor="end">hook through</Label>
      <Label x={197} y={82} anchor="end">the loop</Label>
    </>),
    (a) => (<>
      <HookBack />
      {line('M196 28 H40', MAIN)}
      {line('M40 24 C50 18 58 22 56 30 C54 38 44 40 40 36', MAIN)}
      {line('M56 32 l8 6', TAG)}
      <EyeFront />
      <Label x={86} y={60}>wet it, pull both</Label>
      <Label x={86} y={70}>strands, trim</Label>
    </>),
  ],

  'Uni Knot': [
    (a) => (<>
      <HookBack />
      {line('M196 27 H34', MAIN)}
      {line('M34 27 A3 3 0 0 0 34 33 H138 C162 33 162 4 136 4 C112 4 98 10 90 20', TAG)}
      <End x={90} y={20} />
      <EyeFront />
      <Label x={170} y={20}>main</Label>
      <Label x={84} y={56}>lay the tag back, then</Label>
      <Label x={84} y={66}>loop it over both lines</Label>
    </>),
    (a) => (<>
      <HookBack />
      {line('M196 27 H34', MAIN)}
      {line('M34 27 A3 3 0 0 0 34 33 H138 C162 33 162 4 136 4 C120 4 128 8 128 10', TAG)}
      <Coils from={74} to={124} cy={30} ry={11} count={6} />
      {line('M72 22 L60 10', TAG)}
      <End x={60} y={10} />
      <EyeFront />
      <Label x={84} y={60}>wrap both lines 5-6</Label>
      <Label x={84} y={70}>times, through the loop</Label>
    </>),
    (a) => (<>
      <HookBack />
      {line('M196 27 H34', MAIN)}
      {line('M34 27 A3 3 0 0 0 34 33 H96', TAG)}
      <Coils from={98} to={114} cy={30} ry={9} count={5} />
      {line('M96 22 L74 8', TAG, { markerEnd: `url(#${a})` })}
      <EyeFront />
      <Label x={84} y={60}>wet it, pull the tag</Label>
      <Label x={84} y={70}>to snug the coils</Label>
    </>),
    (a) => (<>
      <HookBack />
      {line('M196 30 H40', MAIN)}
      <Coils from={48} to={62} cy={30} ry={8} count={5} />
      {line('M64 34 l6 6', TAG)}
      <path d="M150 42 H96" fill="none" stroke={NOTE} strokeWidth="1.6" strokeDasharray="4 3" markerEnd={`url(#${a})`} />
      <EyeFront />
      <Label x={96} y={58}>pull the main line:</Label>
      <Label x={96} y={68}>knot slides to the eye</Label>
    </>),
  ],
};

export const hasKnotDiagrams = (name) => !!DIAGRAMS[name];

function Diagram({ knot, index, label }) {
  const arrow = useId().replace(/:/g, '');
  const draw = DIAGRAMS[knot]?.[index];
  if (!draw) return null;
  return (
    <svg viewBox="0 0 200 100" role="img" aria-label={label} className="h-auto w-full max-w-[300px] rounded-lg bg-white ring-1 ring-slate-200">
      <defs>
        <marker id={arrow} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill={NOTE} />
        </marker>
      </defs>
      {draw(arrow)}
    </svg>
  );
}

export function KnotLegend() {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
      <span className="inline-flex items-center gap-1"><span className="inline-block h-1 w-4 rounded" style={{ background: MAIN }} /> main line (to the rod)</span>
      <span className="inline-flex items-center gap-1"><span className="inline-block h-1 w-4 rounded" style={{ background: TAG }} /> tag end (the end you tie with)</span>
    </p>
  );
}

// The full knot: name, what it's for, and each step with its drawing.
export default function KnotSteps({ knot }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="font-semibold text-slate-900">🪢 {knot.name}</p>
      <p className="text-slate-600">{knot.use}</p>
      <ol className="mt-3 grid gap-3 sm:grid-cols-2" style={{ listStyle: 'none', paddingLeft: 0 }}>
        {knot.steps.map((s, i) => (
          <li key={s} className="flex flex-col gap-2">
            <Diagram knot={knot.name} index={i} label={`${knot.name}, step ${i + 1}: ${s}`} />
            <span className="flex gap-2 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-river-700 text-[11px] font-bold text-white">{i + 1}</span>
              <span className="leading-snug">{s}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
