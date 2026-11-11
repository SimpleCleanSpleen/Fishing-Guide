// <option> groups for a spot <select>: suggested spots, spots other anglers shared, and yours.
export default function SpotOptions({ spots }) {
  const groups = [
    ['Suggested spots (by Claude)', spots.filter((s) => !s.custom && !s.shared)],
    ['Shared by anglers', spots.filter((s) => s.shared && !s.custom)],
    ['My spots', spots.filter((s) => s.custom)],
  ];
  return groups.filter(([, list]) => list.length).map(([label, list]) => (
    <optgroup key={label} label={label}>
      {list.map((s) => (
        <option key={s.id} value={s.id}>{s.name}{s.shared && !s.custom ? ` (@${s.ownerName})` : ''}</option>
      ))}
    </optgroup>
  ));
}
