import { HexColorPicker } from "react-colorful";

export default function ColorPickerField({
  label,
  color,
  onChange,
  inputTestId,
}: {
  label: string;
  color: string;
  onChange: (hex: string) => void;
  inputTestId?: string;
}) {
  return (
    <div className="mt-4">
      <div className="text-sm text-white/70 mb-2">{label}</div>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-3">
        <div className="flex justify-center">
          <HexColorPicker color={color} onChange={onChange} />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div
            className="w-6 h-6 rounded border border-white/10"
            style={{ backgroundColor: color }}
          />
          <input
            type="text"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/20"
            data-testid={inputTestId}
          />
        </div>
      </div>
    </div>
  );
}
