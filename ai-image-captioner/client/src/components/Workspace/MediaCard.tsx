import { MoreVertical, Pencil, Trash2, Share2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ConfirmModal } from "./Modals/ConfirmModal";
import { ShareModal } from "../Share/Modals/ShareModal";
import type { ShareTarget } from "../../data/shareTargets";
import { fetchMediaFileAsFile, fetchMediaMeta } from "../../services/media";
import { composeCaptionedPNG } from "../../lib/captionCompose";

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

const missingCache = new Map<string, boolean>();

type NavigatorWithShare = Navigator & {
  canShare?: (data?: ShareData) => boolean;
  share?: (data?: ShareData) => Promise<void>;
};

export default function MediaCard({
  item,
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
  const autoDeletedRef = useRef(false);

  useEffect(() => {
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
      .catch(() => {});
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

  const onShareSystem = async () => {
    if (disabled) return;
    try {
      const meta = await fetchMediaMeta(item.id).catch(() => null);
      const captionText = (meta?.caption as string | undefined) ?? item.caption ?? "";
      const hashtags =
        (Array.isArray(meta?.keywords) ? (meta.keywords as string[]) : []) as string[];
      const style = {
        caption: captionText,
        fontFamily: (meta?.fontFamily as string | undefined) ?? item.fontFamily,
        fontSize: (meta?.fontSize as number | undefined) ?? item.fontSize,
        textColor: (meta?.textColor as string | undefined) ?? item.textColor,
        align: (meta?.align as Align | undefined) ?? item.align,
        showBg: (meta?.showBg as boolean | undefined) ?? item.showBg,
        bgColor: (meta?.bgColor as string | undefined) ?? item.bgColor,
        bgOpacity: (meta?.bgOpacity as number | undefined) ?? item.bgOpacity,
        posX: (meta?.posX as number | undefined) ?? item.posX,
        posY: (meta?.posY as number | undefined) ?? item.posY,
      };
      const mime = (meta?.mime as string | undefined) ?? undefined;
      const originalFile = await fetchMediaFileAsFile(item.id, mime, "workspace-image");
      const captionBlob = await composeCaptionedPNG(originalFile, style);
      const outFile = new File([captionBlob], "workspace-image.png", { type: "image/png" });
      const shareText = buildShareText(captionText, hashtags);
      const nav = navigator as NavigatorWithShare;
      const canShareFiles = typeof nav.canShare === "function" ? nav.canShare({ files: [outFile] }) : true;
      if (canShareFiles && nav.share) {
        await nav.share({
          files: [outFile],
          text: shareText,
          title: "AI Image Captioner",
        });
      } else {
        alert("This browser doesn't support sharing files via the system panel.");
      }
      onShareTarget?.("system", item);
    } catch {
      alert("Unable to prepare the captioned image for sharing.");
    } finally {
      setShareOpen(false);
    }
  };

  const imgButtonClickable = !disabled && imageClickable && !!onEdit;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
      aria-disabled={disabled || undefined}
      data-testid="workspace-card-inner"
      data-media-id={item.id}
    >
      <button
        type="button"
        onClick={imgButtonClickable ? onEdit : undefined}
        className="block w-full text-left relative"
        title={imgButtonClickable ? "Edit" : undefined}
        tabIndex={imgButtonClickable ? 0 : -1}
        data-testid="workspace-card-image-button"
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
              if (!autoDeletedRef.current) {
                autoDeletedRef.current = true;
                onMore?.();
              }
            }}
            data-testid="workspace-card-image"
          />
        </div>
      </button>

      <div className="p-3 border-t border-white/10">
        <p
          className="text-sm leading-snug text-white/90 line-clamp-2"
          data-testid="workspace-caption-visible"
        >
          {caption}
        </p>
        <span className="sr-only" data-testid="workspace-caption">
          {caption}
        </span>
        {created && (
          <p className="mt-1 text-[11px] text-white/50" data-testid="workspace-created-at">
            {created}
          </p>
        )}
      </div>

      {!disabled && (
        <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {onEdit && (
            <button
              onClick={onEdit}
              title="Edit"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
              data-testid="workspace-card-edit"
            >
              <Pencil size={16} className="text-white" />
            </button>
          )}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              title="More"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
              data-testid="workspace-card-more"
              aria-expanded={menuOpen}
            >
              <MoreVertical size={16} className="text-white" />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-44 rounded-lg border border-white/10 bg-[#0b0f16] text-white shadow-xl z-10"
                role="menu"
                data-testid="workspace-card-menu"
              >
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 transition-colors"
                  onClick={openShare}
                  role="menuitem"
                  data-testid="workspace-card-share"
                >
                  <Share2 size={14} className="text-blue-400" />
                  <span>Share</span>
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 transition-colors"
                  onClick={handleDeleteClick}
                  role="menuitem"
                  data-testid="workspace-card-delete"
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
        onShareSystem={onShareSystem}
      />
    </div>
  );
}

function buildShareText(caption?: string, hashtags?: string[]) {
  const tags = (hashtags ?? [])
    .map((h) => `#${String(h).replace(/^#/, "")}`)
    .join(" ")
    .trim();
  return [caption ?? "", tags].filter(Boolean).join(" ").trim();
}
