import CopyButton from "./CopyButton";

type Props = {
  imageUrl: string;
  tone: string;
  caption: string | null;
  loading?: boolean;
  onCopy?: () => void;
};

export default function CaptionCard({ imageUrl, tone, caption, loading, onCopy }: Props) {
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3">
      <div className="relative">
        <img
          src={imageUrl}
          alt="Uploaded preview"
          className="w-full aspect-square object-cover rounded-lg"
        />
        <span className="absolute top-2 left-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-yellow-400/90 text-black">
          {tone.charAt(0).toUpperCase() + tone.slice(1)}
        </span>
      </div>

      <div className="mt-3">
        <p className="text-sm font-semibold mb-1">Generated Caption</p>

        <div className="rounded-lg bg-white/[0.03] border border-white/10 p-3 min-h-[72px]">
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-3 rounded bg-white/10" />
              <div className="h-3 w-3/4 rounded bg-white/10" />
            </div>
          ) : caption ? (
            <p className="text-sm text-white/85">{caption}</p>
          ) : (
            <p className="text-sm text-white/60">No caption yet.</p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <CopyButton
            text={caption || ""}
            disabled={!caption}
            onCopied={onCopy}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
