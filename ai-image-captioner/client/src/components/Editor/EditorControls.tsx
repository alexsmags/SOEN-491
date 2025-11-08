import {
  Save,
  AlignLeft, AlignCenter, AlignRight,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight,
  Square, Check, ImageDown, ChevronDown
} from "lucide-react";
import { useState } from "react";
import IconButton from "./IconButton";
import IconToggle from "./IconToggle";
import ColorPickerField from "./HexColorPicker";

type Align = "left" | "center" | "right";

function Section({
  title,
  subtitle,
  children,
  defaultOpen = true,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="mb-4 rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-sm">
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div>
          <h4 className="text-sm font-semibold text-white">{title}</h4>
          {subtitle ? <p className="mt-0.5 text-xs text-white/60">{subtitle}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80 hover:bg-white/10"
        >
          {open ? "Hide" : "Show"}
          <ChevronDown size={14} className={`transition-transform ${open ? "" : "-rotate-90"}`} />
        </button>
      </div>
      {open && <div className="border-t border-white/10 px-4 py-4">{children}</div>}
    </section>
  );
}

export default function EditorControls({
  caption,
  setCaption,
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  textColor,
  setTextColor,
  align,
  applyAlign,
  showBg,
  setShowBg,
  bgColor,
  setBgColor,
  bgOpacity,
  setBgOpacity,
  nudge,
  centerPosition,
  NUDGE,
  onSave,
  saving = false,
  saveSuccess = false,
  showSaveImage = false,
  onSaveImage,
  savingImage = false,
  saveImageSuccess = false,
}: {
  caption: string;
  setCaption: (v: string) => void;
  fontFamily: string;
  setFontFamily: (v: string) => void;
  fontSize: number;
  setFontSize: (v: number) => void;
  textColor: string;
  setTextColor: (v: string) => void;
  align: Align;
  applyAlign: (a: Align) => void;
  showBg: boolean;
  setShowBg: (v: boolean) => void;
  bgColor: string;
  setBgColor: (v: string) => void;
  bgOpacity: number;
  setBgOpacity: (v: number) => void;
  nudge: (dx: number, dy: number) => void;
  centerPosition: () => void;
  NUDGE: number;
  onSave: () => void;
  saving?: boolean;
  saveSuccess?: boolean;
  showSaveImage?: boolean;
  onSaveImage?: () => void;
  savingImage?: boolean;
  saveImageSuccess?: boolean; 
}) {
  const showActionRow = !showSaveImage || saveImageSuccess;

  return (
    <aside
      className="p-5 md:p-6 bg-black overflow-y-auto pb-[var(--footer-h)] space-y-4"
      data-testid="editor-controls"
    >
      <div className="sticky top-0 z-10 -mx-5 md:-mx-6 mb-1 bg-gradient-to-b from-black to-black/0 px-5 md:px-6 pt-1 pb-2">
        <h3 className="text-lg font-bold">Caption & Style Editor</h3>
      </div>

      <Section title="Caption" subtitle="Write and refine your text">
        <label className="block text-sm text-white/70 mb-1">Caption Text</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full h-28 resize-none rounded-xl bg-white/5 border border-white/10 p-3 text-sm outline-none focus:border-white/20"
          data-testid="editor-caption-input"
        />
      </Section>

      <Section title="Typography" subtitle="Choose font and size">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Font Family</label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full appearance-none rounded-xl bg-[#111] text-white border border-white/10 p-2.5 text-sm outline-none focus:border-white/20"
              data-testid="editor-font-select"
            >
              <option>Arial</option>
              <option>Inter</option>
              <option>Roboto</option>
              <option>Georgia</option>
              <option>Times New Roman</option>
              <option>Courier New</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm text-white/70 mb-1">
              <span>Font Size</span>
              <span className="tabular-nums font-mono" data-testid="editor-fontsize-value">{fontSize}</span>
            </div>
            <input
              type="range"
              min={12}
              max={64}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full"
              data-testid="editor-fontsize-range"
            />
          </div>
        </div>
      </Section>

      <Section title="Colors" subtitle="Text and optional background">
        <ColorPickerField
          label="Text Color"
          color={textColor}
          onChange={setTextColor}
          inputTestId="editor-color-input"
        />

        <div className="mt-5 flex items-center gap-2">
          <input
            id="show-bg"
            type="checkbox"
            checked={showBg}
            onChange={(e) => setShowBg(e.target.checked)}
            className="accent-[#364881]"
            data-testid="editor-toggle-bg"
          />
          <label htmlFor="show-bg" className="text-sm text-white/80">Show Caption Background</label>
        </div>

        {showBg && (
          <div className="mt-3 space-y-4">
            <ColorPickerField
              label="Background Color"
              color={bgColor}
              onChange={setBgColor}
              inputTestId="editor-bg-input"
            />
            <div>
              <div className="flex items-center justify-between text-sm text-white/70 mb-1">
                <span>Background Opacity</span>
                <span className="tabular-nums font-mono">{Math.round(bgOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={bgOpacity}
                onChange={(e) => setBgOpacity(Number(e.target.value))}
                className="w-full"
                data-testid="editor-bg-opacity"
              />
            </div>
          </div>
        )}
      </Section>

      <Section title="Alignment & Position" subtitle="Arrange the caption on the image">
        <div className="grid gap-5">
          <div>
            <div className="text-sm text-white/70 mb-2">Text Alignment</div>
            <div className="grid grid-cols-3 gap-2">
              <IconToggle active={align === "left"} onClick={() => applyAlign("left")} Icon={AlignLeft} title="Align left" />
              <IconToggle active={align === "center"} onClick={() => applyAlign("center")} Icon={AlignCenter} title="Align center" />
              <IconToggle active={align === "right"} onClick={() => applyAlign("right")} Icon={AlignRight} title="Align right" />
            </div>
            <div className="sr-only" data-testid="editor-align-value">{align}</div>
            <div className="grid grid-cols-3 gap-2 mt-2" aria-hidden>
              <button data-testid="editor-align-left" className="hidden" onClick={() => applyAlign("left")} />
              <button data-testid="editor-align-center" className="hidden" onClick={() => applyAlign("center")} />
              <button data-testid="editor-align-right" className="hidden" onClick={() => applyAlign("right")} />
            </div>
          </div>

          <div data-testid="editor-position-controls">
            <div className="text-sm text-white/70 mb-2">Caption Position</div>
            <div className="grid grid-cols-3 gap-2">
              <IconButton onClick={() => nudge(-NUDGE, -NUDGE)} Icon={ArrowUpLeft} title="Up-Left" />
              <IconButton onClick={() => nudge(0, -NUDGE)} Icon={ArrowUp} title="Up" />
              <IconButton onClick={() => nudge(NUDGE, -NUDGE)} Icon={ArrowUpRight} title="Up-Right" />
              <IconButton onClick={() => nudge(-NUDGE, 0)} Icon={ArrowLeft} title="Left" />
              <IconToggle active onClick={centerPosition} Icon={Square} title="Center" />
              <IconButton onClick={() => nudge(NUDGE, 0)} Icon={ArrowRight} title="Right" />
              <IconButton onClick={() => nudge(-NUDGE, NUDGE)} Icon={ArrowDownLeft} title="Down-Left" />
              <IconButton onClick={() => nudge(0, NUDGE)} Icon={ArrowDown} title="Down" />
              <IconButton onClick={() => nudge(NUDGE, NUDGE)} Icon={ArrowDownRight} title="Down-Right" />
            </div>
          </div>
        </div>
      </Section>

      {showSaveImage && (
        <Section title="Image" subtitle="Export the rendered image to your workspace">
          <div className="flex justify-center">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 transition disabled:opacity-50"
              onClick={onSaveImage}
              disabled={savingImage}
              data-testid="editor-save-image-btn"
            >
              {saveImageSuccess ? <Check size={16} /> : <ImageDown size={16} />}
              {saveImageSuccess ? "Success" : (savingImage ? "Saving image…" : "Save Image to Workspace")}
            </button>
          </div>
        </Section>
      )}

      {showActionRow && (
        <div className="sticky bottom-0 -mx-5 md:-mx-6 bg-black/90 backdrop-blur px-5 md:px-6 pt-3 pb-4 border-t border-white/10" data-testid="editor-actions">
          <button
            className={`w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold shadow-sm transition disabled:opacity-50
              ${saveSuccess
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-[#364881] hover:brightness-110 text-white"}`}
            onClick={onSave}
            disabled={saving}
            title="Save caption/style/position"
            data-testid="editor-save-btn"
          >
            {saveSuccess ? <Check size={16} /> : <Save size={16} />}
            {saveSuccess ? "Success" : (saving ? "Saving…" : "Save")}
          </button>
        </div>
      )}
    </aside>
  );
}
