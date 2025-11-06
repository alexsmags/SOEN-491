import { useEffect, useRef, useState } from "react";
import { fetchMediaFileAsFile, fetchMediaMeta } from "../services/media";
import { composeCaptionedPNG } from "../lib/captionCompose";

type Align = "left" | "center" | "right";

export type SelectedForPreview =
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

function normalizeAlign(v: unknown): Align | undefined {
  return v === "left" || v === "center" || v === "right" ? v : undefined;
}

export function useComposedPreview(selected: SelectedForPreview) {
  const [url, setUrl] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const lastUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!selected) {
        if (lastUrlRef.current) {
          URL.revokeObjectURL(lastUrlRef.current);
          lastUrlRef.current = null;
        }
        setUrl(null);
        setComposing(false);
        return;
      }

      setComposing(true);
      try {
        let meta = selected;
        try {
          const serverMeta = await fetchMediaMeta(selected.id);
          meta = {
            ...selected,
            caption: serverMeta?.caption ?? selected.caption ?? "",
            hashtags:
              (Array.isArray(serverMeta?.keywords)
                ? serverMeta.keywords
                : selected.hashtags) ?? [],
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
        const blob = await composeCaptionedPNG(originalFile, {
          caption: meta?.caption ?? "",
          fontFamily: meta?.fontFamily ?? undefined,
          fontSize: meta?.fontSize ?? undefined,
          textColor: meta?.textColor ?? undefined,
          align: normalizeAlign(meta?.align),
          showBg: meta?.showBg ?? undefined,
          bgColor: meta?.bgColor ?? undefined,
          bgOpacity: meta?.bgOpacity ?? undefined,
          posX: meta?.posX ?? undefined,
          posY: meta?.posY ?? undefined,
        });

        if (cancelled) return;

        const nextUrl = URL.createObjectURL(blob);
        if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
        lastUrlRef.current = nextUrl;
        setUrl(nextUrl);
      } catch {
        if (!cancelled) setUrl(null);
      } finally {
        if (!cancelled) setComposing(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  useEffect(() => {
    return () => {
      if (lastUrlRef.current) {
        URL.revokeObjectURL(lastUrlRef.current);
        lastUrlRef.current = null;
      }
    };
  }, []);

  return { url, composing };
}
