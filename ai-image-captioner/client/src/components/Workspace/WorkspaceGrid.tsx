import MediaCard from "./MediaCard";
import type { MediaItem } from "../../types/media";
import type { ShareTarget } from "../../data/shareTargets";

type Props = {
  items: MediaItem[];
  shareTargets: ShareTarget[];

  onShareTarget?: (targetId: string, item: MediaItem) => void;
  onEdit?: (item: MediaItem) => void;
  onDelete?: (item: MediaItem) => void;

  selectionMode?: boolean;
  onSelect?: (item: MediaItem) => void;
};

function normalizeAlign(a: unknown): "left" | "center" | "right" {
  return a === "left" || a === "center" || a === "right" ? a : "center";
}

export default function WorkspaceGrid({
  items,
  shareTargets,
  onShareTarget,
  onEdit,
  onDelete,
  selectionMode = false,
  onSelect,
}: Props) {
  return (
    <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((m) => {
        const align = normalizeAlign(m.align);

        return (
          <div key={m.id} className="relative group">
            <div className={selectionMode ? "pointer-events-none" : ""} aria-hidden={selectionMode}>
              <MediaCard
                item={{
                  id: m.id,
                  src: m.imageUrl,
                  caption: m.caption ?? "Untitled",
                  createdAt: m.createdAt ?? null,
                  fontFamily: m.fontFamily ?? "Arial",
                  fontSize: m.fontSize ?? 24,
                  textColor: m.textColor ?? "#FFFFFF",
                  align,
                  showBg: m.showBg ?? true,
                  bgColor: m.bgColor ?? "#3B3F4A",
                  bgOpacity: m.bgOpacity ?? 0.8,
                  posX: typeof m.posX === "number" ? m.posX : 120,
                  posY: typeof m.posY === "number" ? m.posY : 120,
                }}
                shareTargets={shareTargets}
                onShareTarget={(targetId) => onShareTarget?.(targetId, m)}
                onEdit={() => onEdit?.(m)}
                onMore={() => onDelete?.(m)}
                disabled={selectionMode}
                imageClickable={false}
              />
            </div>

            {selectionMode && (
              <button
                type="button"
                aria-label="Select image"
                onClick={() => onSelect?.(m)}
                className="
                  absolute inset-0
                  rounded-xl
                  bg-transparent
                  pointer-events-auto
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60
                "
              >
                <div
                  className="
                    absolute inset-0 rounded-xl
                    bg-black/60 opacity-0
                    group-hover:opacity-100
                    transition-opacity
                    grid place-items-center
                  "
                >
                  <span className="text-lg font-medium uppercase tracking-wide px-2.5 py-1.5 rounded bg-white/10">
                    Select
                  </span>
                </div>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}