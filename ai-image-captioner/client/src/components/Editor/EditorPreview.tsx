import type React from "react";
import clsx from "clsx";
import { Download } from "lucide-react";
import { useState, useMemo } from "react";
import { useDownloadWithCaption, type OutputFormat } from "../../hooks/useDownloadWithCaption";
import { DownloadModal } from "./Modals/DownloadModal";

export default function EditorPreview({
  image,
  caption,
  bubbleStyle,
  frameRef,
  bubbleRef,
  bubbleProps,
  showBg,
  aspectFromNat,
}: {
  image: string;
  caption: string;
  bubbleStyle: React.CSSProperties;
  frameRef: React.RefObject<HTMLDivElement | null>;
  bubbleRef: React.RefObject<HTMLDivElement | null>;
  bubbleProps?: React.HTMLAttributes<HTMLDivElement>;
  showBg: boolean;
  aspectFromNat?: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const {
    downloadWithCaption,
    suggestFileName,
  } = useDownloadWithCaption({
    image,
    caption,
    frameRef,
    bubbleRef,
    showBg,
  });

  const defaultBaseName = useMemo(() => {
    const raw = suggestFileName(image);
    return raw.replace(/\.(png|jpg|jpeg|webp|gif)$/i, "");
  }, [image, suggestFileName]);

  const handleConfirmDownload = (opts: {
    fileName: string;
    format: OutputFormat;
    quality?: number; 
    flattenBgColor?: string;
  }) => {
    downloadWithCaption({
      filename: opts.fileName,
      format: opts.format,
      quality: opts.quality,
      flattenBgColor: opts.flattenBgColor,
    });
    setModalOpen(false);
  };

  return (
    <div className="p-4 md:p-6">
      <div
        ref={frameRef}
        className="relative mx-auto w-full max-w-[820px] rounded-xl bg-black/60 border-8 border-[#2a2f3a] overflow-hidden"
        style={{
          aspectRatio: aspectFromNat ?? "4 / 3",
        }}
      >
        <img
          src={image}
          alt="Preview"
          className="absolute inset-0 w-full h-full object-contain"
          draggable={false}
        />

        <div
          ref={bubbleRef}
          className={clsx(
            "absolute w-max max-w-[90%] md:max-w-[80%] cursor-default",
            showBg ? "border border-white/10" : "border-none shadow-none"
          )}
          style={bubbleStyle}
          {...bubbleProps}
        >
          {caption}
        </div>

        {/* Download button */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-lg bg-black/70 backdrop-blur border border-white/15 px-2.5 py-1.5 text-xs text-white/90 hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white/30"
          title="Download image"
        >
          <Download size={14} />
          Download
        </button>
      </div>

      <DownloadModal
        open={modalOpen}
        defaultName={defaultBaseName + "_with_caption"}
        defaultFormat="png"
        onCancel={() => setModalOpen(false)}
        onConfirm={handleConfirmDownload}
      />
    </div>
  );
}