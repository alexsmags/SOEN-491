import { useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { ShareTarget } from "../../data/shareTargets";

type Props = {
  open: boolean;
  onClose: () => void;
  targets: ShareTarget[];
  onShare: (id: ShareTarget["id"]) => void;
}

export function ShareModal({ open, onClose, targets, onShare }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);

  const scrollBy = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.min(420, el.clientWidth * 0.9);
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={[
          "fixed inset-0 z-[90] bg-black/55 backdrop-blur-[2px]",
          "transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={onClose}
        aria-hidden={!open}
      />

      {/* Centered Modal */}
      <div
        className={[
          "fixed inset-0 z-[91] grid place-items-center",
          "transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label="Share options"
      >
        <div
          className={[
            "w-[94vw] max-w-2xl rounded-2xl",
            "bg-[#1e2128] border border-white/10 shadow-2xl shadow-black/40",
            "transition-transform duration-300",
            open ? "scale-100" : "scale-95",
          ].join(" ")}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="font-semibold tracking-tight">Share</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10"
              aria-label="Close share"
            >
              <X size={16} className="opacity-85" />
            </button>
          </div>

          {/* Body */}
          <div className="relative px-8 py-5">
            {/* Carousel container */}
            <div className="relative">
              {/* Left Arrow */}
              <button
                className="absolute -left-3 top-1/2 -translate-y-1/2 z-[2] w-9 h-9 grid place-items-center rounded-full border border-white/10 hover:bg-black/80 shadow-md shadow-black/30"
                onClick={() => scrollBy("left")}
                aria-label="Scroll left"
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
                      "shrink-0 w-28 h-28 rounded-xl grid place-items-center transition transform active:scale-[0.98]",
                      "ring-1 ring-white/10 hover:ring-white/20",
                    ].join(" ")}
                    style={{ backgroundColor: t.bg, color: t.fg }}
                    title={t.label}
                    aria-label={`Share to ${t.label}`}
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="leading-none text-[28px]">{<t.Icon />}</span>
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
                className="absolute -right-3 top-1/2 -translate-y-1/2 z-[2] w-9 h-9 grid place-items-center rounded-full border border-white/10 hover:bg-black/80 shadow-md shadow-black/30"
                onClick={() => scrollBy("right")}
                aria-label="Scroll right"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
