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
  hashtags: string[];
  onHashtagsChange: (v: string[]) => void;
  includeHashtags: boolean;
  onIncludeHashtagsChange: (v: boolean) => void;
  placement: Placement;
  onPlacementChange: (v: Placement) => void;
  KeywordsInput: KeywordsInputComp;
}

export default function HashtagsSection({
  hashtags,
  onHashtagsChange,
  includeHashtags,
  onIncludeHashtagsChange,
  placement,
  onPlacementChange,
  KeywordsInput,
}: Props) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-white/70">Hashtags</h4>

      <KeywordsInput
        label="Hashtags"
        value={hashtags}
        onChange={onHashtagsChange}
        placeholder="Add hashtags (no # needed)…"
        displayPrefix="#"
        normalizeOnAdd={(s) => s.replace(/^#+/, "")}
        max={8}
      />

      <div className="grid md:grid-cols-2 gap-3">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={includeHashtags}
            onChange={(e) => onIncludeHashtagsChange(e.target.checked)}
          />
          <span className="text-sm text-white/80">Append the hashtags above</span>
        </label>

        <PlacementSelect
          label="Hashtags placement"
          value={placement}
          onChange={onPlacementChange}
        />
      </div>

      <p className="text-xs text-white/50">
        Only hashtags listed here will be appended. Style keywords won’t be converted to hashtags.
      </p>
    </section>
  );
}
