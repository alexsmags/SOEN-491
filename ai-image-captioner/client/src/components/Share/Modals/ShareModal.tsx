import { useEffect, useRef } from "react";
import { X, Share2 } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onShareSystem: () => void; // <-- call this to invoke Web Share API
};

export function ShareModal({ open, onClose, onShareSystem }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Share"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-lg rounded-2xl bg-[#0b0f16] text-white border border-white/10 shadow-2xl"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Share</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
            aria-label="Close share"
            type="button"
          >
            <X size={16} className="opacity-85" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 text-sm text-white/85 space-y-5">
          <p className="opacity-85">
            This will open your system’s share panel (Windows/macOS/iOS/Android)
            so you can share the actual image file to any installed app.
          </p>

          <button
            onClick={onShareSystem}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3
                       bg-white/10 hover:bg-white/15 border border-white/15 transition"
            type="button"
          >
            <Share2 size={18} />
            <span className="font-medium">Share via System</span>
          </button>

          <p className="text-xs opacity-70">
            If your browser or OS doesn’t support native sharing, we’ll let you know.
          </p>
        </div>
      </div>
    </div>
  );
}
