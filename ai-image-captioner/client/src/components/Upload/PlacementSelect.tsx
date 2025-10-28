import type { Placement } from "./types";

type Props = {
  label: string;
  value: Placement;
  onChange: (v: Placement) => void;
};

export default function PlacementSelect({ label, value, onChange }: Props) {
  return (
    <div className="grid gap-1">
      <label className="text-sm text-white/60">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Placement)}
        className="w-full rounded-md bg-black/40 border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/30"
      >
        <option value="beginning">Beginning</option>
        <option value="middle">Middle</option>
        <option value="end">End</option>
      </select>
    </div>
  );
}
