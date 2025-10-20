export type ToneOption =
  | "casual"
  | "formal"
  | "humorous"
  | "professional"
  | "inspirational";

type Props = {
  value: ToneOption;
  onChange: (val: ToneOption) => void;
};

const options: { label: string; value: ToneOption }[] = [
  { label: "Casual", value: "casual" },
  { label: "Formal", value: "formal" },
  { label: "Humorous", value: "humorous" },
  { label: "Professional", value: "professional" },
  { label: "Inspirational", value: "inspirational" },
];

export default function ToneSelect({ value, onChange }: Props) {
  return (
    <div>
      <label className="text-sm text-white/70 block mb-2">Tone</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as any)}
          className="w-full appearance-none rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/20"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-[#0C0F14]">
              {o.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/60">
          ▾
        </span>
      </div>
    </div>
  );
}
