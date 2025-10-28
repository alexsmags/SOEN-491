import type { ComponentType } from "react";
import type { LengthPref, Voice } from "./types";

type ToneSelectComp<T = unknown> = ComponentType<{
  value: T;
  onChange: (v: T) => void;
}>;

type KeywordsInputComp = ComponentType<{
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  max?: number;
}>;

interface Props<T = unknown> {
  tone: T;
  onToneChange: (t: T) => void;
  voice: Voice;
  onVoiceChange: (v: Voice) => void;
  lengthPref: LengthPref;
  onLengthPrefChange: (l: LengthPref) => void;
  keywords: string[];
  onKeywordsChange: (v: string[]) => void;
  ToneSelect: ToneSelectComp<T>;
  KeywordsInput: KeywordsInputComp;
}

export default function StyleSection<T = unknown>({
  tone,
  onToneChange,
  voice,
  onVoiceChange,
  lengthPref,
  onLengthPrefChange,
  keywords,
  onKeywordsChange,
  ToneSelect,
  KeywordsInput,
}: Props<T>) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-white/70">Style</h4>

      <ToneSelect value={tone} onChange={onToneChange} />

      <div className="grid gap-1">
        <label className="text-sm text-white/60">Voice</label>
        <select
          value={voice}
          onChange={(e) => onVoiceChange(e.target.value as Voice)}
          className="w-full rounded-md bg-black/40 border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/30"
        >
          <option value="neutral">Neutral</option>
          <option value="i">I</option>
          <option value="we">We</option>
        </select>
      </div>

      <div className="grid gap-1">
        <label className="text-sm text-white/60">Length</label>
        <select
          value={lengthPref}
          onChange={(e) => onLengthPrefChange(e.target.value as LengthPref)}
          className="w-full rounded-md bg-black/40 border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/30"
        >
          <option value="short">Short</option>
          <option value="medium">Medium</option>
          <option value="long">Long</option>
        </select>
      </div>

      <KeywordsInput
        label="Keywords"
        value={keywords}
        onChange={onKeywordsChange}
        placeholder="Add keywords and press Enter…"
        max={8}
      />
      <p className="text-xs text-white/50">
        Keywords shape the caption’s wording. They are <b>not</b> turned into hashtags.
      </p>
    </section>
  );
}
