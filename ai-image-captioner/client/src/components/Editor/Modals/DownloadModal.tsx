import { useEffect, useRef, useState, useCallback } from "react";
import type { OutputFormat } from "../../../hooks/useDownloadWithCaption";

type Props = {
  open: boolean;
  defaultName: string;
  defaultFormat?: OutputFormat;
  onCancel: () => void;
  onConfirm: (args: {
    fileName: string;
    format: OutputFormat;
    quality?: number;
    flattenBgColor?: string;
  }) => void;
};

export function DownloadModal({
  open,
  defaultName,
  defaultFormat = "png",
  onCancel,
  onConfirm,
}: Props) {
  const [fileName, setFileName] = useState(defaultName);
  const [format, setFormat] = useState<OutputFormat>(defaultFormat);
  const [quality, setQuality] = useState(0.92);
  const [flattenBgColor, setFlattenBgColor] = useState("#ffffff");

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setFileName(defaultName);
      setFormat(defaultFormat);
      setQuality(0.92);
      const id = setTimeout(() => nameInputRef.current?.focus(), 10);
      return () => clearTimeout(id);
    }
  }, [open, defaultName, defaultFormat]);

  const isLossy = format === "jpg" || format === "jpeg" || format === "webp";
  const ext = format === "jpeg" ? "jpg" : format;

  const handleConfirm = useCallback(() => {
    const safeName = fileName.trim() || "image_with_caption";
    const finalName = safeName.replace(/\.(png|jpg|jpeg|webp)$/i, "") + "." + ext;
    onConfirm({
      fileName: finalName,
      format,
      quality: isLossy ? quality : undefined,
      flattenBgColor: isLossy ? flattenBgColor : undefined,
    });
  }, [fileName, ext, onConfirm, format, isLossy, quality, flattenBgColor]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter" && dialogRef.current?.contains(document.activeElement)) {
        handleConfirm();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, handleConfirm]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Download options"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl bg-[#0b0f16] text-white border border-white/10 shadow-xl"
      >
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-semibold">Download</h2>
          <p className="text-xs text-white/60 mt-1">Choose file name and format.</p>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* File name */}
          <div>
            <label className="block text-xs text-white/70 mb-1">File name</label>
            <input
              ref={nameInputRef}
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
              placeholder="image_with_caption"
              spellCheck={false}
            />
            <p className="text-[11px] text-white/40 mt-1">Extension will be appended automatically.</p>
          </div>

          {/* Format + Quality */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/70 mb-1">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as OutputFormat)}
                className="w-full rounded-lg border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20 bg-[#1a1f29] text-white"
                style={{ appearance: "none", backgroundColor: "#1a1f29", color: "white" }}
              >
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
                <option value="webp">WEBP</option>
              </select>
            </div>

            {isLossy ? (
              <div>
                <label className="block text-xs text-white/70 mb-1">Quality</label>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.01}
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-[11px] text-white/50 mt-1">{Math.round(quality * 100)}%</div>
              </div>
            ) : (
              <div className="opacity-50">
                <label className="block text-xs text-white/70 mb-1">Quality</label>
                <div className="text-[11px] text-white/50 py-2">N/A for PNG (lossless)</div>
              </div>
            )}
          </div>

          {/* Background color */}
          {isLossy && (
            <div>
              <label className="block text-xs text-white/70 mb-1">
                Background color (no transparency in JPG/WEBP)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={flattenBgColor}
                  onChange={(e) => setFlattenBgColor(e.target.value)}
                  aria-label="Background color"
                />
                <input
                  type="text"
                  value={flattenBgColor}
                  onChange={(e) => setFlattenBgColor(e.target.value)}
                  className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
              <p className="text-[11px] text-white/40 mt-1">
                Used to replace transparent pixels when exporting without alpha.
              </p>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="px-5 py-4 border-t border-white/10 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-3 py-1.5 text-xs rounded-lg bg-white/90 text-black hover:bg-white"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}