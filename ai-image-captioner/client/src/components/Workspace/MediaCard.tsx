import { MoreVertical, Pencil, Trash2, Share2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ConfirmModal } from "./Modals/ConfirmModal";
import { ShareModal } from "../Share/Modals/ShareModal";
import type { ShareTarget } from "../../data/shareTargets";

type Align = "left" | "center" | "right";

type CardItem = {
  id: string;
  src: string;
  caption?: string | null;
  createdAt?: string | null;

  fontFamily: string;
  fontSize: number;
  textColor: string;
  align: Align;
  showBg: boolean;
  bgColor: string;
  bgOpacity: number;
  posX: number;
  posY: number;
};

// cache is optional; kept here in case you expand logic later
const missingCache = new Map<string, boolean>();

export default function MediaCard({
  item,
  shareTargets,
  onShareTarget,
  onEdit,
  onMore,
  disabled = false,
  imageClickable = true,
}: {
  item: CardItem;
  shareTargets: ShareTarget[];
  onShareTarget?: (id: ShareTarget["id"], item: CardItem) => void;
  onEdit?: () => void;
  onMore?: () => void;
  disabled?: boolean;
  imageClickable?: boolean;
}) {
  const caption = (item.caption ?? "Untitled").trim();
  const created = item.createdAt ? new Date(item.createdAt).toLocaleString() : undefined;

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Prevent duplicate delete calls (HEAD + onError) for the same card
  const autoDeletedRef = useRef(false);

  // Single existence check via HEAD. If missing → delete once.
  useEffect(() => {
    // reset the guard when the item changes
    autoDeletedRef.current = false;

    const controller = new AbortController();
    fetch(item.src, { method: "HEAD", cache: "no-cache", signal: controller.signal })
      .then((res) => {
        const isMissing = !res.ok;
        missingCache.set(item.id, isMissing);
        if (isMissing && !autoDeletedRef.current) {
          autoDeletedRef.current = true;
          onMore?.();
        }
      })
      .catch(() => {
        // ignore network errors to avoid false deletes
      });

    return () => controller.abort();
  }, [item.id, item.src, onMore]);

  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const handleDeleteClick = () => {
    if (disabled) return;
    setMenuOpen(false);
    setConfirmOpen(true);
  };
  const handleConfirmDelete = () => {
    setConfirmOpen(false);
    onMore?.();
  };

  const openShare = () => {
    if (disabled) return;
    setMenuOpen(false);
    setShareOpen(true);
  };
  const handleShareChoice = (id: ShareTarget["id"]) => {
    setShareOpen(false);
    onShareTarget?.(id, item);
  };

  const imgButtonClickable = !disabled && imageClickable && !!onEdit;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
      aria-disabled={disabled || undefined}
    >
      <button
        type="button"
        onClick={imgButtonClickable ? onEdit : undefined}
        className="block w-full text-left relative"
        title={imgButtonClickable ? "Edit" : undefined}
        tabIndex={imgButtonClickable ? 0 : -1}
      >
        <div className="relative w-full aspect-[4/5] bg-black/40">
          <img
            src={item.src}
            alt={caption || "media"}
            className="absolute inset-0 w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.01]"
            loading="lazy"
            decoding="async"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            onError={() => {
              // Guard against a second delete after the HEAD-based delete
              if (!autoDeletedRef.current) {
                autoDeletedRef.current = true;
                onMore?.();
              }
            }}
          />
        </div>
      </button>

      <div className="p-3 border-t border-white/10">
        <p className="text-sm leading-snug text-white/90 line-clamp-2">{caption}</p>
        {created && <p className="mt-1 text-[11px] text-white/50">{created}</p>}
      </div>

      {!disabled && (
        <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {onEdit && (
            <button
              onClick={onEdit}
              title="Edit"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
            >
              <Pencil size={16} className="text-white" />
            </button>
          )}

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              title="More"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
            >
              <MoreVertical size={16} className="text-white" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-44 rounded-lg border border-white/10 bg-[#0b0f16] text-white shadow-xl z-10"
                role="menu"
              >
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 transition-colors"
                  onClick={openShare}
                  role="menuitem"
                >
                  <Share2 size={14} className="text-blue-400" />
                  <span>Share</span>
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 transition-colors"
                  onClick={handleDeleteClick}
                  role="menuitem"
                >
                  <Trash2 size={14} className="text-red-400" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={!disabled && confirmOpen}
        title="Delete this item?"
        message={
          <span>
            This will permanently remove{" "}
            <span className="font-semibold">“{caption || "Untitled"}”</span>.
          </span>
        }
        confirmText="Delete permanently"
        cancelText="Cancel"
        tone="danger"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      <ShareModal
        open={!disabled && shareOpen}
        onClose={() => setShareOpen(false)}
        targets={shareTargets}
        onShare={handleShareChoice}
      />
    </div>
  );
}
