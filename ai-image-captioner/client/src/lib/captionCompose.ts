export type CaptionStyle = {
  caption?: string | null;

  fontFamily?: string | null;
  fontSize?: number | null;
  textColor?: string | null;
  align?: "left" | "center" | "right" | null;

  showBg?: boolean | null;
  bgColor?: string | null;
  bgOpacity?: number | null;

  posX?: number | null;
  posY?: number | null;
};

export async function composeCaptionedPNG(
  srcBlob: Blob,
  style: CaptionStyle
): Promise<Blob> {
  const bmp = await loadBitmap(srcBlob);
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  (ctx as any).imageSmoothingQuality = "high";

  ctx.drawImage(bmp as any, 0, 0, bmp.width, bmp.height);

  const caption = (style.caption ?? "").trim();
  if (caption.length > 0) {
    const fontSize = clampInt(style.fontSize ?? 24, 8, 256);
    const fontFamily = style.fontFamily || "Inter, system-ui, sans-serif";
    const color = style.textColor || "#ffffff";
    const align = style.align || "left";
    const showBg = !!style.showBg;
    const bgColor = style.bgColor || "#000000";
    const bgOpacity = clamp(style.bgOpacity ?? 0.55, 0, 1);

    const pad = Math.round(Math.max(12, fontSize * 0.5));
    const rawPosX = clampInt(style.posX ?? Math.round(canvas.width * 0.03), 0, canvas.width - pad);
    const rawPosY = clampInt(style.posY ?? Math.round(canvas.height * 0.75), 0, canvas.height - pad);

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = color;

    const maxAvail = Math.max(80, canvas.width - rawPosX - pad);
    const lines = wrapText(ctx, caption, maxAvail);
    const lineHeight = Math.round(fontSize * 1.25);
    const boxHeight = lines.length * lineHeight;

    const panelWidth = pad + Math.min(maxAvail, maxLineWidth(ctx, lines)) + pad;
    const panelHeight = pad + boxHeight + pad;
    const panelX = clampInt(rawPosX, 0, Math.max(0, canvas.width - panelWidth));
    const panelY = clampInt(rawPosY, 0, Math.max(0, canvas.height - panelHeight));

    let textX = panelX + pad;
    if (align === "center") {
      ctx.textAlign = "center";
      textX = panelX + Math.round(panelWidth / 2);
    } else if (align === "right") {
      ctx.textAlign = "right";
      textX = panelX + panelWidth - pad;
    } else {
      ctx.textAlign = "left";
      textX = panelX + pad;
    }
    const firstBaselineY = panelY + pad + Math.round(lineHeight * 0.85);

    if (showBg) {
      ctx.save();
      ctx.globalAlpha = bgOpacity;
      ctx.fillStyle = bgColor;
      roundRect(
        ctx,
        panelX,
        panelY,
        panelWidth,
        panelHeight,
        Math.max(8, Math.round(fontSize * 0.35))
      );
      ctx.fill();
      ctx.restore();
    }

    for (let i = 0; i < lines.length; i++) {
      const y = firstBaselineY + i * lineHeight;
      ctx.fillText(lines[i], textX, y);
    }
  }

  const png = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png", 0.92)
  );
  return png;
}

async function loadBitmap(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(blob);
    } catch {
      console.error("error")
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode error"));
      el.src = url;
      (el as any).decoding = "async";
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function maxLineWidth(ctx: CanvasRenderingContext2D, lines: string[]): number {
  let max = 0;
  for (const l of lines) {
    const w = ctx.measureText(l).width;
    if (w > max) max = w;
  }
  return max;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, Math.min(w, h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
function clampInt(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, Math.round(n)));
}
