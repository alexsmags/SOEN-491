import { ArrowUpRight } from "lucide-react";

type Props = {
  imageSrc: string | null;
  caption: string;
  hashtags: string[];
  onShare: () => void;
};

export function PreviewWithShare({ imageSrc, caption, hashtags, onShare }: Props) {
  return (
    <div className="mt-4 relative">
      <div className="aspect-[4/3] rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden relative">
        {imageSrc ? (
          <>
            <img
              src={imageSrc}
              alt="Selected to share"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/55 px-4 py-3 text-sm">
              <div>{caption}</div>
              <div className="opacity-80">{hashtags.join(" ")}</div>
            </div>

            {/* In-preview Share button */}
            <button
              onClick={onShare}
              className={[
                "absolute bottom-3 right-3",
                "rounded-full shadow-lg shadow-black/30 border border-white/10",
                "bg-[#364881] hover:bg-[#3b477e] active:scale-[0.98]",
                "w-12 h-12 grid place-items-center",
                "transition-all duration-200 ease-out",
              ].join(" ")}
              aria-label="Share"
              title="Share"
              style={{
                animation: "capto-bounce-in 420ms cubic-bezier(.2,.8,.2,1)",
              }}
            >
              <ArrowUpRight size={20} className="opacity-95" />
            </button>
          </>
        ) : (
          <div className="w-full h-full grid place-items-center text-white/60 text-sm">
            Select an image to enable sharing.
          </div>
        )}
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
