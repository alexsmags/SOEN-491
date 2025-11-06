import { ArrowUpRight, Loader2 } from "lucide-react";

type Props = {
  imageSrc: string | null;
  caption: string;
  hashtags: string[];
  onShare: () => void;
  fixedHeight?: number;
  isLoading?: boolean;
};

export default function PreviewWithShare({
  imageSrc,
  caption,
  hashtags,
  onShare,
  fixedHeight = 720,
  isLoading = false,
}: Props) {
  const showSpinner = isLoading === true;
  const showPlaceholder = !isLoading && !imageSrc;

  return (
    <div className="relative">
      <div className="mx-auto w-full max-w-[940px]">
        <div
          className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden relative shadow-2xl shadow-black/30"
          style={{ height: fixedHeight }}
          aria-busy={showSpinner}
        >
          <div className="w-full h-full">
            {showSpinner ? (
              <div className="w-full h-full grid place-items-center text-white/70 text-sm">
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin" />
                  <span>Preparing captioned preview…</span>
                </div>
              </div>
            ) : showPlaceholder ? (
              <div className="w-full h-full grid place-items-center text-white/60 text-sm">
                Select an image to enable sharing.
              </div>
            ) : (
              <img
                src={imageSrc!}
                alt="Captioned preview"
                className="w-full h-full object-contain bg-black"
                decoding="async"
              />
            )}
          </div>

          {!showSpinner && !showPlaceholder && (caption || hashtags?.length) ? (
            <div className="absolute bottom-0 left-0 right-0 bg-black/55 px-4 py-3 text-sm backdrop-blur-sm">
              {caption && <div className="truncate">{caption}</div>}
              {hashtags?.length > 0 && (
                <div className="opacity-80 truncate">{hashtags.join(" ")}</div>
              )}
            </div>
          ) : null}

          {!showSpinner && !showPlaceholder && (
            <button
              onClick={onShare}
              className={[
                "absolute bottom-3 right-3",
                "rounded-full shadow-lg shadow-black/40 border border-white/10",
                "bg-[#364881] hover:bg-[#3b477e] active:scale-[0.98]",
                "w-12 h-12 grid place-items-center",
                "transition-all duration-200 ease-out",
              ].join(" ")}
              aria-label="Share"
              title="Share"
              style={{ animation: "capto-bounce-in 420ms cubic-bezier(.2,.8,.2,1)" }}
            >
              <ArrowUpRight size={20} className="opacity-95" />
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes capto-bounce-in {
          0% { transform: translateY(8px) scale(.9); opacity: 0; }
          60% { transform: translateY(-4px) scale(1.03); opacity: 1; }
          100% { transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
