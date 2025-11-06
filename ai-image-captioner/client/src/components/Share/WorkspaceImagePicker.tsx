import { ImageIcon, Loader2, RefreshCcw } from "lucide-react";
import Pagination from "../UI/Pagination";
import type { WorkspaceImage } from "../../hooks/useWorkspaceImages";

type Props = {
  value: string | null;
  onChange: (id: string | null) => void;
  images: WorkspaceImage[];
  loading: boolean;
  error: string | null;
  onReload: () => void;

  page: number;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;

  panelHeight?: number;
};

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "";

function captionSizeClass(caption: string) {
  const len = caption.length;
  if (len > 80) return "text-[10px]";
  if (len > 56) return "text-xs";
  if (len > 36) return "text-[13px]";
  return "text-sm";
}

export default function WorkspaceImagePicker({
  value,
  onChange,
  images,
  loading,
  error,
  onReload,
  page,
  hasNext,
  onPrev,
  onNext,
  panelHeight = 720,
}: Props) {
  const empty = !loading && !images.length;

  return (
    <section
      className="
        w-full rounded-2xl border border-white/10 bg-black
        shadow-2xl shadow-black/30 overflow-hidden flex flex-col
      "
      style={{ height: panelHeight }}
      aria-label="Workspace images picker"
      data-testid="workspace-image-picker"
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02] backdrop-blur-sm shrink-0">
        <h3 className="text-sm font-medium opacity-90">Workspace Images</h3>

        <button
          onClick={onReload}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 hover:border-white/20 hover:bg-white/[0.03] transition"
          type="button"
        >
          <RefreshCcw size={16} />
          <span className="text-sm">Reload</span>
        </button>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 min-h-0 overflow-auto">
        {loading && (
          <div className="flex items-center justify-center py-16 opacity-80">
            <Loader2 className="animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="m-4 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && empty && (
          <div className="m-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-white/10 p-10">
            <ImageIcon />
            <p className="text-sm opacity-80">No images in your workspace yet.</p>
            <p className="text-xs opacity-70">
              Create or upload an image in Workspace, then come back to share it.
            </p>
          </div>
        )}

        {!!images.length && !error && (
          <div
            className="
              p-4 grid gap-4
              grid-cols-2 xl:grid-cols-3
              [grid-auto-rows:150px]
            "
          >
            {images.map((m) => {
              const active = value === m.id;
              const src = m.imageUrl || `${SERVER_URL}/api/media/${m.id}/file`;
              const caption = (m.caption ?? "").trim();
              const hasCaption = caption.length > 0;
              const fontClass = hasCaption ? captionSizeClass(caption) : "text-xs";

              return (
                <button
                  key={m.id}
                  onClick={() => onChange(active ? null : m.id)}
                  className={[
                    "group relative overflow-hidden rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-white/30",
                    "h-[150px] w-full",
                    active
                      ? "ring-2 ring-blue-500 border-blue-500"
                      : "border-white/10 hover:border-white/20 hover:scale-[1.01]",
                  ].join(" ")}
                  title={caption || "Workspace image"}
                  type="button"
                  aria-label={caption || "Workspace image"}
                  aria-pressed={active}
                >
                  <img
                    src={src}
                    alt={caption || "Workspace image"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />

                  {active && (
                    <div className="pointer-events-none absolute inset-0 bg-blue-500/20 z-10" />
                  )}

                  {hasCaption && (
                    <div
                      className={[
                        "pointer-events-none absolute bottom-0 left-0 right-0 z-20",
                        "px-2.5 py-1.5",
                        "bg-gradient-to-t from-black/70 via-black/40 to-transparent",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "block leading-tight text-white/95 drop-shadow-sm",
                          "max-w-full whitespace-nowrap overflow-hidden text-ellipsis",
                          fontClass,
                        ].join(" ")}
                      >
                        {caption}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination footer */}
      <footer className="border-t border-white/10 px-2 py-3 bg-white/[0.02] shrink-0 sticky bottom-0 z-10">
        <Pagination
          page={page}
          hasNext={hasNext}
          loading={loading}
          onPrev={onPrev}
          onNext={onNext}
          className="mt-0"
        />
      </footer>
    </section>
  );
}
