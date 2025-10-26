import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  hasNext: boolean;
  loading?: boolean;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
};

export default function Pagination({
  page,
  hasNext,
  loading = false,
  onPrev,
  onNext,
  className,
}: Props) {
  return (
    <nav aria-label="Pagination" className={["mt-10 flex justify-center", className].filter(Boolean).join(" ")}>
      <div
        className="
          inline-flex items-stretch gap-1
          rounded-full border border-white/10 bg-white/5/50 backdrop-blur
          px-1 py-1 shadow-lg shadow-black/25
        "
      >
        <button
          type="button"
          aria-label="Previous page"
          onClick={onPrev}
          disabled={page === 1 || loading}
          className="
            inline-flex items-center gap-1.5
            h-9 px-3.5 rounded-full
            text-sm
            border border-transparent
            transition-all
            hover:bg-white/10 hover:border-white/10
            active:scale-[0.98]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent
          "
          title="Previous"
        >
          <ChevronLeft size={16} className="opacity-85" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div
          className="
            h-9 min-w-20
            inline-flex items-center justify-center
            px-3 rounded-full
            text-sm font-medium tracking-wide
            border border-white/10 bg-black/40
          "
        >
          Page {page}
        </div>

        <button
          type="button"
          aria-label="Next page"
          onClick={onNext}
          disabled={!hasNext || loading}
          className="
            inline-flex items-center gap-1.5
            h-9 px-3.5 rounded-full
            text-sm
            border border-transparent
            transition-all
            hover:bg-white/10 hover:border-white/10
            active:scale-[0.98]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent
          "
          title="Next"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={16} className="opacity-85" />
        </button>
      </div>
    </nav>
  );
}
