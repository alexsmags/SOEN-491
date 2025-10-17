import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ShareTarget } from "../../data/shareTargets";

type ShareDockProps = {
  open: boolean;
  onClose: () => void;
  targets: ShareTarget[];
  onShare: (id: string) => void;
};

export function ShareDock({ open, onClose, targets, onShare }: ShareDockProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);

  const scrollBy = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.min(360, el.clientWidth * 0.9);
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={[
          "fixed inset-0 z-[72] bg-black/50 backdrop-blur-[2px]",
          "transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={onClose}
        aria-hidden={!open}
      />

      {/* Dock */}
      <div
        className={[
          "fixed left-0 right-0 z-[73]",
          "transition-transform duration-400 ease-[cubic-bezier(0.25,0.8,0.25,1)]",
          open ? "translate-y-0" : "translate-y-full",
        ].join(" ")}
        style={{ bottom: "4.5rem" }}
        role="dialog"
        aria-label="Share options"
      >
        <div className="mx-auto max-w-4xl px-4">
          <div className="rounded-2xl border border-white/10 bg-[#1e2128] shadow-xl shadow-black/30">
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

            <div className="relative p-3">
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-full bg-black/50 border border-white/10 hover:bg-black/60"
                onClick={() => scrollBy("left")}
                aria-label="Scroll left"
              >
                <ChevronLeft size={18} />
              </button>

              <div
                ref={scrollerRef}
                className="flex gap-3 overflow-x-auto no-scrollbar px-8 py-1"
              >
                {targets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onShare(t.id)}
                    className={[
                      "shrink-0 w-20 h-20 rounded-xl",
                      "bg-white/[0.06] border border-white/10",
                      "hover:bg-white/[0.10] active:scale-[0.98]",
                      "grid place-items-center transition group",
                    ].join(" ")}
                    title={t.label}
                    aria-label={`Share to ${t.label}`}
                  >
                    <span className="text-2xl opacity-95">{<t.Icon />}</span>
                    <span className="text-[11px] mt-1 block text-white/80">
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>

              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-full bg-black/50 border border-white/10 hover:bg-black/60"
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
