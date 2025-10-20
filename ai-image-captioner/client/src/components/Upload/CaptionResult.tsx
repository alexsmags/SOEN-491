import CopyButton from "./CopyButton";

type Props = {
  caption: string;
  tone: string;
  onRegenerate: () => void;
  onUse: () => void;
};

export default function CaptionResult({ caption, tone, onRegenerate, onUse }: Props) {
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-6 md:p-8">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-lg md:text-xl font-semibold">
          Generated Caption
          <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-400/90 text-black align-middle">
            {tone.charAt(0).toUpperCase() + tone.slice(1)}
          </span>
        </h4>
      </div>

      <div className="mt-4 rounded-lg bg-white/[0.03] border border-white/10 p-4">
        <p className="text-base md:text-lg leading-relaxed text-white/90">{caption}</p>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <CopyButton text={caption} className="w-full" />
        <button
          onClick={onRegenerate}
          className="rounded-lg px-3 py-2 text-sm border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] transition"
        >
          Regenerate
        </button>
        <button
          onClick={onUse}
          className="rounded-lg px-3 py-2 text-sm border border-white/15 bg-[#364881] hover:bg-[#4d5ca1] transition"
        >
          Use → Editor
        </button>
      </div>
    </div>
  );
}
