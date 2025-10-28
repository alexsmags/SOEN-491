import type { ComponentType } from "react";
import PlacementSelect from "./PlacementSelect";
import type { Placement } from "./types";

type KeywordsInputComp = ComponentType<{
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  displayPrefix?: string;
  normalizeOnAdd?: (s: string) => string;
  max?: number;
}>;

interface Props {
  includeMentions: boolean;
  onIncludeMentionsChange: (v: boolean) => void;
  handles: string[];
  onHandlesChange: (v: string[]) => void;
  location: string;
  onLocationChange: (v: string) => void;
  placement: Placement;
  onPlacementChange: (v: Placement) => void;
  KeywordsInput: KeywordsInputComp;
}

export default function MentionsLocationSection({
  includeMentions,
  onIncludeMentionsChange,
  handles,
  onHandlesChange,
  location,
  onLocationChange,
  placement,
  onPlacementChange,
  KeywordsInput,
}: Props) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-white/70">Mentions &amp; Location</h4>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={includeMentions}
          onChange={(e) => onIncludeMentionsChange(e.target.checked)}
        />
        <span className="text-sm text-white/80">Use @mentions</span>
      </label>

      {includeMentions && (
        <KeywordsInput
          label="@ Mentions"
          value={handles}
          onChange={onHandlesChange}
          placeholder="Add usernames (no @ needed)…"
          displayPrefix="@"
          normalizeOnAdd={(s) => s.replace(/^@+/, "")}
          max={8}
        />
      )}

      <div className="grid gap-1">
        <label className="text-sm text-white/60">Location (optional)</label>
        <input
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          placeholder="e.g., Toronto, ON"
          className="w-full rounded-md bg-black/40 border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/30"
        />
      </div>

      <PlacementSelect
        label="Mentions/Location placement"
        value={placement}
        onChange={onPlacementChange}
      />
    </section>
  );
}
