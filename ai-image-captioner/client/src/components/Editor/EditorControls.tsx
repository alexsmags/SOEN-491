import {
  Save, Share2, Copy,
  AlignLeft, AlignCenter, AlignRight,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight,
  Square, Check, ImageDown
} from "lucide-react";
import IconButton from "./IconButton";
import IconToggle from "./IconToggle";

type Align = "left" | "center" | "right";

export default function EditorControls({
  caption,
  setCaption,
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  setTextColor,
  align,
  applyAlign,
  showBg,
  setShowBg,
  setBgColor,
  bgOpacity,
  setBgOpacity,
  COLORS,
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
  COLORS: string[];
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
      className="
        p-5 md:p-6 bg-black
        overflow-y-auto
        pb-[var(--footer-h)]
      "
    >
      <h3 className="text-lg font-bold mb-2">Caption & Style Editor</h3>

      {/* Text */}
      <label className="block mt-3 text-sm text-white/70 mb-1">Caption Text</label>
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className="w-full h-24 resize-none rounded-lg bg-white/5 border border-white/10 p-3 text-sm outline-none focus:border-white/20"
      />

      {/* Font */}
      <label className="block mt-4 text-sm text-white/70 mb-1">Font Family</label>
      <select
        value={fontFamily}
        onChange={(e) => setFontFamily(e.target.value)}
        className="w-full appearance-none rounded-lg bg-[#111] text-white border border-white/10 p-2.5 text-sm outline-none focus:border-white/20"
      >
        <option>Arial</option>
        <option>Inter</option>
        <option>Roboto</option>
        <option>Georgia</option>
        <option>Times New Roman</option>
        <option>Courier New</option>
      </select>

      {/* Font size */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm text-white/70 mb-1">
          <span>Font Size</span>
          <span>{fontSize}</span>
        </div>
        <input
          type="range"
          min={12}
          max={64}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Colors */}
      <div className="mt-4">
        <div className="text-sm text-white/70 mb-2">Text Color</div>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setTextColor(c)}
              className="w-6 h-6 rounded-full border border-white/10"
              style={{ backgroundColor: c }}
              aria-label={`Set color ${c}`}
            />
          ))}
        </div>
      </div>

      {/* Alignment */}
      <div className="mt-5">
        <div className="text-sm text-white/70 mb-2">Text Alignment</div>
        <div className="grid grid-cols-3 gap-2">
          <IconToggle active={align === "left"} onClick={() => applyAlign("left")} Icon={AlignLeft} />
          <IconToggle active={align === "center"} onClick={() => applyAlign("center")} Icon={AlignCenter} />
          <IconToggle active={align === "right"} onClick={() => applyAlign("right")} Icon={AlignRight} />
        </div>
      </div>

      {/* Position */}
      <div className="mt-5">
        <div className="text-sm text-white/70 mb-2">Caption Position</div>
        <div className="grid grid-cols-3 gap-2">
          <IconButton onClick={() => nudge(-NUDGE, -NUDGE)} Icon={ArrowUpLeft}  title="Up-Left" />
          <IconButton onClick={() => nudge(0, -NUDGE)}      Icon={ArrowUp}      title="Up" />
          <IconButton onClick={() => nudge(NUDGE, -NUDGE)}  Icon={ArrowUpRight} title="Up-Right" />
          <IconButton onClick={() => nudge(-NUDGE, 0)}      Icon={ArrowLeft}    title="Left" />
          <IconToggle active onClick={centerPosition}       Icon={Square}       title="Center" />
          <IconButton onClick={() => nudge(NUDGE, 0)}       Icon={ArrowRight}   title="Right" />
          <IconButton onClick={() => nudge(-NUDGE, NUDGE)}  Icon={ArrowDownLeft} title="Down-Left" />
          <IconButton onClick={() => nudge(0, NUDGE)}       Icon={ArrowDown}     title="Down" />
          <IconButton onClick={() => nudge(NUDGE, NUDGE)}   Icon={ArrowDownRight} title="Down-Right" />
        </div>
      </div>

      {/* Background */}
      <div className="mt-5 flex items-center gap-2">
        <input
          id="show-bg"
          type="checkbox"
          checked={showBg}
          onChange={(e) => setShowBg(e.target.checked)}
          className="accent-[#364881]"
        />
        <label htmlFor="show-bg" className="text-sm text-white/80">Show Caption Background</label>
      </div>

      {showBg && (
        <>
          <div className="mt-3">
            <div className="text-sm text-white/70 mb-2">Background Color</div>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setBgColor(c)}
                  className="w-6 h-6 rounded-full border border-white/10"
                  style={{ backgroundColor: c }}
                  aria-label={`Set background ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-white/70 mb-1">
              <span>Opacity ({Math.round(bgOpacity * 100)}%)</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={bgOpacity}
              onChange={(e) => setBgOpacity(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </>
      )}

      {/* First-time Save Image button */}
      {showSaveImage && (
        <div className="mt-6 flex justify-center">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 transition disabled:opacity-50"
            onClick={onSaveImage}
            disabled={savingImage}
          >
            {saveImageSuccess ? <Check size={16} /> : <ImageDown size={16} />}
            {saveImageSuccess ? "Success" : (savingImage ? "Saving image…" : "Save Image to Workspace")}
          </button>
        </div>
      )}

      {/* Actions */}
      {showActionRow && (
        <div className="mt-4 flex justify-center gap-3 flex-wrap pb-4">
          <button
            className={`inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold shadow-sm transition disabled:opacity-50
              ${saveSuccess
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-[#364881] hover:brightness-110 text-white"}`}
            onClick={onSave}
            disabled={saving}
            title="Save caption/style/position"
          >
            {saveSuccess ? <Check size={16} /> : <Save size={16} />}
            {saveSuccess ? "Success" : (saving ? "Saving…" : "Save")}
          </button>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
            onClick={() => console.log("Share")}
            title="Share"
          >
            <Share2 size={16} /> Share
          </button>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
            onClick={() => {
              navigator.clipboard.writeText(caption).catch(() => undefined);
            }}
            title="Copy caption"
          >
            <Copy size={16} /> Copy
          </button>
        </div>
      )}
    </aside>
  );
}