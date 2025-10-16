import {
  Save, Share2, Copy,
  AlignLeft, AlignCenter, AlignRight,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight,
  Square
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
  COLORS,
  nudge,
  centerPosition,
  NUDGE,
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
}) {
  return (
    <aside
      className="
        flex-1 overflow-y-auto p-5 md:p-6 bg-black
        max-h-[calc(100svh-56px)] lg:max-h-[calc(100vh-56px)]
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

      {/* Position (move controls) */}
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

      {/* Actions */}
      <div className="mt-6 flex justify-center gap-3 flex-wrap">
        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#364881] px-4 py-2 text-sm font-semibold shadow-sm hover:brightness-110 transition"
          onClick={() => console.log("Save to Workspace")}
        >
          <Save size={16} /> Save
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
          onClick={() => console.log("Share")}
        >
          <Share2 size={16} /> Share
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
          onClick={() => {
            navigator.clipboard.writeText(caption).catch(() => undefined);
            console.log("Copied caption");
          }}
        >
          <Copy size={16} /> Copy
        </button>
      </div>
    </aside>
  );
}
