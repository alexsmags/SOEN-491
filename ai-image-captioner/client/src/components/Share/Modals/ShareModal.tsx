import { useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { ShareTarget } from "../../../data/shareTargets";

type Props = {
  open: boolean;
  onClose: () => void;
  targets: ShareTarget[];
  onShare: (id: ShareTarget["id"]) => void;
};

export function ShareModal({ open, onClose, targets, onShare }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const scrollBy = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.min(420, el.clientWidth * 0.9);
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Share options"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-2xl rounded-2xl bg-[#0b0f16] text-white border border-white/10 shadow-2xl"
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
        <div className="px-5 py-4 text-sm text-white/80">
          <div className="relative">
            {/* Left Arrow */}
            <button
              className="absolute -left-3 top-1/2 -translate-y-1/2 z-[2] w-9 h-9 grid place-items-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 shadow-md shadow-black/30"
              onClick={() => scrollBy("left")}
              aria-label="Scroll left"
              type="button"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Scroll area */}
            <div
              ref={scrollerRef}
              className="flex gap-4 overflow-x-auto no-scrollbar mx-8 py-2 scroll-smooth"
            >
              {targets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onShare(t.id)}
                  className={[
                    "shrink-0 w-28 h-28 rounded-xl grid place-items-center transition active:scale-[0.98]",
                    "bg-white/5 ring-1 ring-white/10 hover:bg-white/10 hover:ring-white/20",
                  ].join(" ")}
                  style={{ color: t.fg }}
                  title={t.label}
                  aria-label={`Share to ${t.label}`}
                  type="button"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="leading-none text-[28px]" style={{ color: t.fg }}>
                      {<t.Icon />}
                    </span>
                    <span
                      className="text-[11px] leading-none font-medium text-center opacity-95"
                      style={{ color: t.fg }}
                    >
                      {t.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Right Arrow */}
            <button
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-[2] w-9 h-9 grid place-items-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 shadow-md shadow-black/30"
              onClick={() => scrollBy("right")}
              aria-label="Scroll right"
              type="button"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
