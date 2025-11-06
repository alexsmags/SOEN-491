import { useEffect, useRef, useState } from "react";
import Sidebar from "../components/Layout/Sidebar";
import Topbar from "../components/Layout/Topbar";
import Footer from "../components/Layout/Footer";
import PreviewWithShare from "../components/Share/PreviewWithShare";
import { ShareModal } from "../components/Share/Modals/ShareModal";
import WorkspaceImagePicker from "../components/Share/WorkspaceImagePicker";
import { useWorkspaceImages } from "../hooks/useWorkspaceImages";
import { fetchMediaFileAsFile, fetchMediaMeta } from "../services/media";
import { useView } from "../hooks/useView";
import { composeCaptionedPNG } from "../lib/captionCompose";
import { type SelectedForPreview, useComposedPreview } from "../hooks/useComposedPreview";

type Align = "left" | "center" | "right";

type Selected =
  | {
      id: string;
      imageUrl?: string | null;
      mime?: string | null;
      caption?: string | null;
      hashtags?: string[] | null;
      fontFamily?: string | null;
      fontSize?: number | null;
      textColor?: string | null;
      align?: Align | null;
      showBg?: boolean | null;
      bgColor?: string | null;
      bgOpacity?: number | null;
      posX?: number | null;
      posY?: number | null;
    }
  | null;

type NavigatorWithShare = Navigator & {
  canShare?: (data?: ShareData) => boolean;
  share?: (data?: ShareData) => Promise<void>;
};

const PANEL_HEIGHT = 720;

export default function SharePage() {
  const view = useView();
  const isOverlay = view === "mobile";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const {
    images,
    loading,
    error,
    page,
    hasNext,
    prevPage,
    nextPage,
    reload,
  } = useWorkspaceImages();

  const [selected, setSelected] = useState<Selected>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const lastUrlRef = useRef<string | null>(null);

  const { url: composedUrl, composing } = useComposedPreview(selected as SelectedForPreview);

  useEffect(() => {
    return () => {
      if (lastUrlRef.current) {
        URL.revokeObjectURL(lastUrlRef.current);
        lastUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (selected && !images.some((i) => i.id === selected.id)) {
      setSelected(null);
      if (lastUrlRef.current) {
        URL.revokeObjectURL(lastUrlRef.current);
        lastUrlRef.current = null;
      }
    }
  }, [images, selected]);

  const sidebarWidth = collapsed ? "76px" : "296px";

  const previewSrc = composedUrl;
  const caption = selected?.caption ?? "";
  const hashtags = (selected?.hashtags as string[] | undefined) ?? [];

  const onShareSystem = async () => {
    if (!selected) return;

    try {
      let meta = selected;
      try {
        const serverMeta = await fetchMediaMeta(selected.id);
        meta = {
          ...selected,
          caption: serverMeta?.caption ?? selected.caption ?? "",
          hashtags:
            (Array.isArray(serverMeta?.keywords) ? serverMeta.keywords : selected.hashtags) ?? [],
          mime: serverMeta?.mime ?? selected.mime ?? null,
          imageUrl: serverMeta?.imageUrl ?? selected.imageUrl ?? null,
          fontFamily: serverMeta?.fontFamily ?? selected.fontFamily ?? null,
          fontSize: serverMeta?.fontSize ?? selected.fontSize ?? null,
          textColor: serverMeta?.textColor ?? selected.textColor ?? null,
          align: serverMeta?.align ?? selected.align ?? null,
          showBg: serverMeta?.showBg ?? selected.showBg ?? null,
          bgColor: serverMeta?.bgColor ?? selected.bgColor ?? null,
          bgOpacity: serverMeta?.bgOpacity ?? selected.bgOpacity ?? null,
          posX: serverMeta?.posX ?? selected.posX ?? null,
          posY: serverMeta?.posY ?? selected.posY ?? null,
        };
      } catch {
        void 0;
      }

      const originalFile = await fetchMediaFileAsFile(
        selected.id,
        meta?.mime ?? selected.mime,
        "workspace-image"
      );
      const captionBlob = await composeCaptionedPNG(originalFile, {
        caption: meta?.caption ?? "",
        fontFamily: meta?.fontFamily ?? undefined,
        fontSize: meta?.fontSize ?? undefined,
        textColor: meta?.textColor ?? undefined,
        align: (meta?.align === "left" || meta?.align === "center" || meta?.align === "right")
          ? meta.align
          : undefined,
        showBg: meta?.showBg ?? undefined,
        bgColor: meta?.bgColor ?? undefined,
        bgOpacity: meta?.bgOpacity ?? undefined,
        posX: meta?.posX ?? undefined,
        posY: meta?.posY ?? undefined,
      });
      const outFile = new File([captionBlob], "workspace-image.png", {
        type: "image/png",
      });

      const nav = navigator as NavigatorWithShare;
      const canShareFiles =
        typeof nav.canShare === "function" ? nav.canShare({ files: [outFile] }) : true;

      if (canShareFiles && nav.share) {
        await nav.share({
          files: [outFile],
          text: shareText(meta?.caption, meta?.hashtags),
          title: "AI Image Captioner",
        });
      } else {
        alert("This browser doesn't support sharing files via the system panel.");
      }
    } catch (e) {
      console.error(e);
      alert("Unable to prepare the captioned image for sharing.");
    } finally {
      setShareOpen(false);
    }
  };

  return (
    <div
      className="bg-black text-white overflow-x-hidden"
      style={{ "--sidebar-w": sidebarWidth } as React.CSSProperties}
    >
      <Sidebar
        mode={isOverlay ? "overlay" : "docked"}
        open={isOverlay ? mobileOpen : true}
        collapsed={isOverlay ? false : collapsed}
        onToggle={() =>
          isOverlay ? setMobileOpen((o) => !o) : setCollapsed((v) => !v)
        }
        onClose={() => setMobileOpen(false)}
      />

      <div
        className={`min-h-screen transition-[margin] duration-200 ${
          isOverlay ? "" : "md:ml-[var(--sidebar-w)]"
        }`}
      >
        <Topbar
          isOverlay={isOverlay}
          mobileOpen={mobileOpen}
          onMobileToggle={() => setMobileOpen((o) => !o)}
        />

        <main className="mx-auto max-w-7xl px- sm:px-6 lg:px-8 py-12 md:py-18">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 items-start">
            <div className="md:col-span-8">
              <PreviewWithShare
                imageSrc={previewSrc}
                caption={caption}
                hashtags={hashtags}
                onShare={() => setShareOpen(true)}
                fixedHeight={PANEL_HEIGHT}
                isLoading={!!selected && (composing || !composedUrl)}
              />
            </div>

            <div className="md:col-span-4">
              <WorkspaceImagePicker
                value={selected?.id ?? null}
                onChange={(id) => {
                  if (lastUrlRef.current) {
                    URL.revokeObjectURL(lastUrlRef.current);
                    lastUrlRef.current = null;
                  }

                  if (!id) {
                    setSelected(null);
                    return;
                  }
                  const img = images.find((m) => m.id === id);
                  setSelected(
                    img
                      ? {
                          id: img.id,
                          imageUrl: img.imageUrl ?? null,
                          mime: img.mime ?? null,
                          caption: img.caption ?? "",
                          hashtags: (img.keywords as string[] | undefined) ?? [],
                          fontFamily: img.fontFamily ?? null,
                          fontSize: img.fontSize ?? null,
                          textColor: img.textColor ?? null,
                          align: img.align ?? null,
                          showBg: img.showBg ?? null,
                          bgColor: img.bgColor ?? null,
                          bgOpacity: img.bgOpacity ?? null,
                          posX: img.posX ?? null,
                          posY: img.posY ?? null,
                        }
                      : { id }
                  );
                }}
                images={images}
                loading={loading}
                error={error}
                onReload={reload}
                page={page}
                hasNext={hasNext}
                onPrev={prevPage}
                onNext={nextPage}
                panelHeight={PANEL_HEIGHT}
              />
            </div>
          </div>
        </main>

        <Footer />
      </div>

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        onShareSystem={onShareSystem}
      />
    </div>
  );
}

function shareText(caption?: string | null, hashtags?: string[] | null) {
  const tags =
    (hashtags ?? [])
      .map((h) => `#${String(h).replace(/^#/, "")}`)
      .join(" ")
      .trim() || "";
  return [caption ?? "", tags].filter(Boolean).join(" ").trim();
}
