import type React from "react";

export type OutputFormat = "png" | "jpg" | "jpeg" | "webp";

type HookArgs = {
  image: string;
  caption: string;
  frameRef: React.RefObject<HTMLDivElement | null>;
  bubbleRef: React.RefObject<HTMLDivElement | null>;
  showBg: boolean;
};

type DownloadOptions = {
  filename?: string;
  format?: OutputFormat;
  quality?: number;
  flattenBgColor?: string;
};

const fileNameFromSrc = (src: string) => {
  try {
    const url = new URL(src, window.location.href);
    const name = url.pathname.split("/").filter(Boolean).pop() || "";
    return name || "image.png";
  } catch {
    return "image.png";
  }
};

const roundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
};

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) => {
  const lines: string[] = [];
  const paragraphs = text.split(/\n/);
  for (const p of paragraphs) {
    const words = p.split(/\s+/);
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width <= maxWidth) {
        line = test;
      } else {
        if (line) lines.push(line);
        if (ctx.measureText(w).width > maxWidth) {
          let cut = "";
          for (const ch of w) {
            const t2 = cut + ch;
            if (ctx.measureText(t2).width <= maxWidth) cut = t2;
            else {
              if (cut) lines.push(cut);
              cut = ch;
            }
          }
          if (cut) {
            line = cut;
          } else {
            line = "";
          }
        } else {
          line = w;
        }
      }
    }
    lines.push(line);
  }
  return lines;
};

const parsePx = (v: string | null) => (v ? Math.max(0, parseFloat(v)) || 0 : 0);

const drawContainImage = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cw: number,
  ch: number
) => {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.min(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
};

function normalizeFormat(fmt?: OutputFormat): OutputFormat {
  if (!fmt) return "png";
  if (fmt === "jpeg") return "jpg";
  return fmt;
}

function mimeForFormat(fmt: OutputFormat) {
  switch (fmt) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
  }
}

function ensureExtension(name: string, fmt: OutputFormat) {
  const ext = fmt === "jpeg" ? "jpg" : fmt;
  const base = name.replace(/\.(png|jpg|jpeg|webp)$/i, "");
  return `${base}.${ext}`;
}

async function composeAndDownload({
  image,
  caption,
  frameRef,
  bubbleRef,
  showBg,
}: HookArgs, opts: DownloadOptions = {}) {
  const frame = frameRef.current;
  const bubble = bubbleRef.current;
  if (!frame) return;

  const format = normalizeFormat(opts.format);
  const fileFromSrc = fileNameFromSrc(image).replace(/\.(jpg|jpeg|webp|gif|png)$/i, "") + "_with_caption";
  const filename = ensureExtension(opts.filename ?? fileFromSrc, format);
  const quality = typeof opts.quality === "number" ? Math.min(1, Math.max(0.1, opts.quality)) : undefined;
  const flattenBgColor = opts.flattenBgColor || "#ffffff";

  const cw = Math.max(1, Math.floor(frame.clientWidth));
  const ch = Math.max(1, Math.floor(frame.clientHeight));

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  if (format === "jpg" || format === "jpeg" || format === "webp") {
    ctx.save();
    ctx.fillStyle = flattenBgColor;
    ctx.fillRect(0, 0, cw, ch);
    ctx.restore();
  } else {
    ctx.clearRect(0, 0, cw, ch);
  }

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.decoding = "async";
  img.src = image;

  const loadImg = () =>
    new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
    });

  try {
    await loadImg();
  } catch {
    window.open(image, "_blank", "noopener,noreferrer");
    return;
  }

  drawContainImage(ctx, img, cw, ch);

  if (bubble && caption) {
    const fb = frame.getBoundingClientRect();
    const bb = bubble.getBoundingClientRect();

    const x = bb.left - fb.left;
    const y = bb.top - fb.top;
    const bw = bb.width;
    const bh = bb.height;

    const cs = window.getComputedStyle(bubble);
    const fontSize = parsePx(cs.fontSize);
    const fontWeight = cs.fontWeight || "400";
    const fontStyle = cs.fontStyle || "normal";
    const fontFamily = cs.fontFamily || "sans-serif";
    const lineHeightRaw = cs.lineHeight;
    const lineHeight =
      lineHeightRaw === "normal" ? Math.round(fontSize * 1.25) : parsePx(lineHeightRaw);
    const paddingTop = parsePx(cs.paddingTop);
    const paddingRight = parsePx(cs.paddingRight);
    const paddingLeft = parsePx(cs.paddingLeft);
    const radius = parsePx(cs.borderRadius);
    const color = cs.color || "#fff";
    const bgColor =
      showBg && cs.backgroundColor ? cs.backgroundColor : "transparent";
    const opacity = showBg ? Math.max(0, Math.min(1, parseFloat(cs.opacity) || 1)) : 1;

    const textX = x + paddingLeft;
    const textYStart = y + paddingTop;
    const textMaxWidth = Math.max(0, bw - paddingLeft - paddingRight);

    if (showBg && bgColor !== "transparent") {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = bgColor;
      roundedRect(ctx, x, y, bw, bh, radius);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textBaseline = "top";

    const align = cs.textAlign as CanvasTextAlign | "";
    if (align === "center" || align === "right" || align === "left") {
      ctx.textAlign = align;
    } else {
      ctx.textAlign = "left";
    }

    const lines = wrapText(ctx, caption, textMaxWidth);
    let yCursor = textYStart;
    for (const line of lines) {
      let drawX = textX;
      if (ctx.textAlign === "center") drawX = textX + textMaxWidth / 2;
      if (ctx.textAlign === "right") drawX = textX + textMaxWidth;
      ctx.fillText(line, drawX, yCursor);
      yCursor += lineHeight || fontSize * 1.25;
    }
    ctx.restore();
  }

  const a = document.createElement("a");
  const mime = mimeForFormat(format);
  const dataUrl = canvas.toDataURL(mime, quality);
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function useDownloadWithCaption(args: HookArgs) {
  const downloadWithCaption = (options?: DownloadOptions) => {
    void composeAndDownload(args, options);
  };

  const suggestFileName = (src: string) => {
    return fileNameFromSrc(src);
  };

  return { downloadWithCaption, suggestFileName };
}