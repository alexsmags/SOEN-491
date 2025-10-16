import type React from "react";
import clsx from "clsx";

export default function EditorPreview({
  image,
  caption,
  bubbleStyle,
  frameRef,
  bubbleRef,
  bubbleProps,
  showBg,
}: {
  image: string;
  caption: string;
  bubbleStyle: React.CSSProperties;
  frameRef: React.RefObject<HTMLDivElement | null>;
  bubbleRef: React.RefObject<HTMLDivElement | null>;
  bubbleProps?: React.HTMLAttributes<HTMLDivElement>;
  showBg: boolean;
}) {
  return (
    <div className="p-4 md:p-6">
      <div
        ref={frameRef}
        className="relative mx-auto w-full max-w-[820px] aspect-[16/10] rounded-xl bg-black/60 border-8 border-[#2a2f3a] overflow-hidden"
      >
        <img
          src={image}
          alt="Preview"
          className="w-full h-full object-cover"
          draggable={false}
        />

        <div
          ref={bubbleRef}
          className={clsx(
            "absolute px-4 py-3 rounded-lg shadow-lg w-max max-w-[90%] md:max-w-[80%] cursor-default",
            showBg ? "border border-white/10" : "border-none shadow-none"
          )}
          style={bubbleStyle}
          {...bubbleProps}
        >
          {caption}
        </div>
      </div>
    </div>
  );
}
