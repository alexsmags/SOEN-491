import PlacementSelect from "./PlacementSelect";
import type { Placement } from "./types";

interface Props {
  includeEmojis: boolean;
  onIncludeEmojisChange: (v: boolean) => void;
  emojiCount: number;
  onEmojiCountChange: (v: number) => void;
  placement: Placement;
  onPlacementChange: (v: Placement) => void;
}

export default function EmojisSection({
  includeEmojis,
  onIncludeEmojisChange,
  emojiCount,
  onEmojiCountChange,
  placement,
  onPlacementChange,
}: Props) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-white/70">Emojis</h4>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={includeEmojis}
          onChange={(e) => onIncludeEmojisChange(e.target.checked)}
        />
        <span className="text-sm text-white/80">Let AI add relevant emojis</span>
      </label>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-sm text-white/60">How many</label>
          <input
            type="number"
            min={1}
            max={8}
            value={emojiCount}
            onChange={(e) => {
              const n = Number(e.target.value) || 1;
              onEmojiCountChange(Math.max(1, Math.min(8, n)));
            }}
            className="w-full rounded-md bg-black/40 border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/30"
          />
        </div>

        <PlacementSelect
          label="Emojis placement"
          value={placement}
          onChange={onPlacementChange}
        />
      </div>

      <p className="text-xs text-white/50">Emojis are chosen by the AI based on your image and style.</p>
    </section>
  );
}
