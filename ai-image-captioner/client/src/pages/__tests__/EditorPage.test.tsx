import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { composeCaptionedPNG, type CaptionStyle } from "../../lib/captionCompose";

type Ctx = CanvasRenderingContext2D & {
  _calls: Record<string, number>;
  _fillTexts: Array<{ text: string; x: number; y: number }>;
  _drawImages: Array<any[]>;
  _beginPaths: number;
  _arcTos: number;
  _fills: number;
  _saves: number;
  _restores: number;
};

function makeMockCtx(measureTextWidthPerChar = 10): Ctx {
  type TrackedState = {
    font: string;
    fillStyle: string | CanvasGradient | CanvasPattern;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    globalAlpha: number;
    imageSmoothingEnabled: boolean;
    imageSmoothingQuality?: ImageSmoothingQuality;
  };

  const stateStack: TrackedState[] = [];

  const ctx: any = {
    font: "",
    fillStyle: "",
    textAlign: "left",
    textBaseline: "alphabetic",
    globalAlpha: 1,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high",
    _calls: {},
    _fillTexts: [] as Array<{ text: string; x: number; y: number }>,
    _drawImages: [] as any[],
    _beginPaths: 0,
    _arcTos: 0,
    _fills: 0,
    _saves: 0,
    _restores: 0,
    drawImage: vi.fn(function (...args: any[]) {
      (ctx._drawImages as any[]).push(args);
      ctx._calls.drawImage = (ctx._calls.drawImage || 0) + 1;
    }),
    fillText: vi.fn(function (text: string, x: number, y: number) {
      ctx._fillTexts.push({ text, x, y });
      ctx._calls.fillText = (ctx._calls.fillText || 0) + 1;
    }),
    measureText: vi.fn(function (text: string) {
      const w = text.length * measureTextWidthPerChar;
      return { width: w } as TextMetrics;
    }),
    beginPath: vi.fn(function () {
      ctx._beginPaths++;
    }),
    arcTo: vi.fn(function () {
      ctx._arcTos++;
    }),
    moveTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(function () {
      ctx._fills++;
    }),
    save: vi.fn(function () {
      ctx._saves++;
      stateStack.push({
        font: ctx.font,
        fillStyle: ctx.fillStyle,
        textAlign: ctx.textAlign,
        textBaseline: ctx.textBaseline,
        globalAlpha: ctx.globalAlpha,
        imageSmoothingEnabled: ctx.imageSmoothingEnabled,
        imageSmoothingQuality: ctx.imageSmoothingQuality,
      });
    }),
    restore: vi.fn(function () {
      ctx._restores++;
      const prev = stateStack.pop();
      if (prev) {
        ctx.font = prev.font;
        ctx.fillStyle = prev.fillStyle;
        ctx.textAlign = prev.textAlign;
        ctx.textBaseline = prev.textBaseline;
        ctx.globalAlpha = prev.globalAlpha;
        ctx.imageSmoothingEnabled = prev.imageSmoothingEnabled;
        ctx.imageSmoothingQuality = prev.imageSmoothingQuality;
      }
    }),
  };
  return ctx as Ctx;
}

function makeMockCanvas(ctx: Ctx) {
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => ctx),
    toBlob: vi.fn((cb: (b: Blob | null) => void) => {
      cb(new Blob(["png-bytes"], { type: "image/png" }));
    }),
  } as unknown as HTMLCanvasElement;
  return canvas;
}

function installCanvasMocks(canvas: HTMLCanvasElement) {
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag.toLowerCase() === "canvas") {
      return canvas as any;
    }
    return (document as any).__proto__.createElement.call(document, tag);
  });
}

function installCreateImageBitmapMock(w = 200, h = 100) {
  (globalThis as any).createImageBitmap = vi.fn(async (_blob: Blob) => {
    return { width: w, height: h } as unknown as ImageBitmap;
  });
}
function uninstallCreateImageBitmapMock() {
  if ((globalThis as any).createImageBitmap) {
    delete (globalThis as any).createImageBitmap;
  }
}

function installImageElementMock(w = 160, h = 90) {
  class MockImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    decoding?: "async" | "sync" | "auto";
    _src = "";
    naturalWidth = w;
    naturalHeight = h;
    get width() {
      return this.naturalWidth;
    }
    get height() {
      return this.naturalHeight;
    }
    set src(val: string) {
      this._src = val;
      queueMicrotask(() => this.onload && this.onload());
    }
    get src() {
      return this._src;
    }
  }

  vi.stubGlobal("Image", MockImage as any);

  if (!(URL as any).createObjectURL) {
    (URL as any).createObjectURL = () => "blob://mock";
  }
  if (!(URL as any).revokeObjectURL) {
    (URL as any).revokeObjectURL = () => {};
  }

  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob://mock");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
}

function makeBlob() {
  return new Blob(["abc"], { type: "image/png" });
}

let originalConsoleError: any;

beforeEach(() => {
  vi.restoreAllMocks();
  originalConsoleError = console.error;
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  vi.restoreAllMocks();
});

describe("composeCaptionedPNG (createImageBitmap branch) - empty caption", () => {
  it("draws source, sizes canvas from bitmap, returns PNG, and skips text/bg when caption is empty", async () => {
    installCreateImageBitmapMock(300, 150);
    const ctx = makeMockCtx(10);
    const canvas = makeMockCanvas(ctx);
    installCanvasMocks(canvas);
    const src = makeBlob();
    const style: CaptionStyle = { caption: "   " };
    const out = await composeCaptionedPNG(src, style);
    expect(out).toBeInstanceOf(Blob);
    expect((out as Blob).type).toBe("image/png");
    expect(canvas.width).toBe(300);
    expect(canvas.height).toBe(150);
    expect((ctx as any).drawImage).toHaveBeenCalledTimes(1);
    const args = (ctx as any).drawImage.mock.calls[0];
    expect(args[1]).toBe(0);
    expect(args[2]).toBe(0);
    expect(args[3]).toBe(300);
    expect(args[4]).toBe(150);
    expect((ctx as any).fillText).not.toHaveBeenCalled();
    expect(ctx._fills).toBe(0);
  });
});

describe("composeCaptionedPNG - left alignment + background panel", () => {
  it("lays out a single line with background and proper alignment", async () => {
    installCreateImageBitmapMock(240, 120);
    const ctx = makeMockCtx(10);
    const canvas = makeMockCanvas(ctx);
    installCanvasMocks(canvas);
    const src = makeBlob();
    const style: CaptionStyle = {
      caption: "hello world",
      fontSize: 20,
      fontFamily: "Inter",
      textColor: "#ffffff",
      align: "left",
      showBg: true,
      bgColor: "#123456",
      bgOpacity: 0.5,
      posX: 10,
      posY: 10,
    };
    const out = await composeCaptionedPNG(src, style);
    expect(out).toBeInstanceOf(Blob);
    expect(canvas.width).toBe(240);
    expect(canvas.height).toBe(120);
    expect(ctx.font).toContain("20px");
    expect(ctx.font).toContain("Inter");
    expect(ctx.fillStyle).toBe("#ffffff");
    expect(ctx.textAlign).toBe("left");
    expect(ctx.textBaseline).toBe("alphabetic");
    expect(ctx._saves).toBeGreaterThanOrEqual(1);
    expect(ctx._beginPaths).toBeGreaterThanOrEqual(1);
    expect(ctx._arcTos).toBeGreaterThan(0);
    expect(ctx._fills).toBeGreaterThanOrEqual(1);
    expect(ctx._restores).toBeGreaterThanOrEqual(1);
    expect((ctx as any).fillText).toHaveBeenCalledTimes(1);
    const [{ text, x, y }] = ctx._fillTexts;
    expect(text).toBe("hello world");
    expect(Number.isFinite(x)).toBe(true);
    expect(Number.isFinite(y)).toBe(true);
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThanOrEqual(canvas.width);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(y).toBeLessThanOrEqual(canvas.height);
  });
});

describe("composeCaptionedPNG - wrapping + center alignment", () => {
  it("wraps text based on measureText and centers each line", async () => {
    installCreateImageBitmapMock(120, 100);
    const ctx = makeMockCtx(5);
    const canvas = makeMockCanvas(ctx);
    installCanvasMocks(canvas);
    const src = makeBlob();
    const style: CaptionStyle = {
      caption:
        "This is a long caption that should wrap into several lines for testing",
      fontSize: 24,
      align: "center",
      showBg: false,
    };
    const out = await composeCaptionedPNG(src, style);
    expect(out).toBeInstanceOf(Blob);
    expect(ctx.textAlign).toBe("center");
    const textCalls = ctx._fillTexts.length;
    expect(textCalls).toBeGreaterThanOrEqual(2);
    const ys = ctx._fillTexts.map((t) => t.y);
    for (let i = 1; i < ys.length; i++) {
      expect(ys[i]).toBeGreaterThan(ys[i - 1]);
    }
  });
});

describe("composeCaptionedPNG - right alignment", () => {
  it("positions text using right alignment anchor", async () => {
    installCreateImageBitmapMock(200, 120);
    const ctx = makeMockCtx(8);
    const canvas = makeMockCanvas(ctx);
    installCanvasMocks(canvas);
    const src = makeBlob();
    const style: CaptionStyle = {
      caption: "right aligned",
      fontSize: 18,
      align: "right",
      showBg: true,
      posX: 0,
      posY: 0,
    };
    await composeCaptionedPNG(src, style);
    expect(ctx.textAlign).toBe("right");
    expect(ctx._fillTexts.length).toBeGreaterThan(0);
  });
});

describe("composeCaptionedPNG - <img> fallback branch", () => {
  it("loads via Image element when createImageBitmap is unavailable", async () => {
    uninstallCreateImageBitmapMock();
    installImageElementMock(180, 90);
    const ctx = makeMockCtx(9);
    const canvas = makeMockCanvas(ctx);
    installCanvasMocks(canvas);
    const src = makeBlob();
    const style: CaptionStyle = { caption: "" };
    const out = await composeCaptionedPNG(src, style);
    expect(out).toBeInstanceOf(Blob);
    expect(canvas.width).toBe(180);
    expect(canvas.height).toBe(90);
    expect((ctx as any).drawImage).toHaveBeenCalledTimes(1);
  });
});
