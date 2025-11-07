import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { useEffect } from "react";
import { vi } from "vitest";
import { useCanvasFrame } from "../useCanvasFrame";

let roInstance: any = null;

class MockResizeObserver {
  cb: (entries: any[]) => void;
  constructor(cb: any) {
    this.cb = cb;
    roInstance = this;
  }
  observe() {}
  disconnect() {}
}

Object.defineProperty(global, "ResizeObserver", { value: MockResizeObserver });

if (!(Element.prototype as any).setPointerCapture) {
  (Element.prototype as any).setPointerCapture = vi.fn();
}
if (!(Element.prototype as any).releasePointerCapture) {
  (Element.prototype as any).releasePointerCapture = vi.fn();
}

function setRect(
  el: Element,
  rect: { left?: number; top?: number; width: number; height: number }
) {
  const left = rect.left ?? 0;
  const top = rect.top ?? 0;
  const width = rect.width;
  const height = rect.height;
  const r = {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => "",
  } as DOMRect;
  const key = "__gbrSpy__";
  const existing = (el as any)[key] as ReturnType<typeof vi.spyOn> | undefined;
  if (existing) {
    existing.mockReturnValue(r);
  } else {
    (el as any)[key] = vi
      .spyOn(el as any, "getBoundingClientRect")
      .mockReturnValue(r);
  }
}

function Host() {
  const h = useCanvasFrame();
  useEffect(() => {
    setRect(document.body, { left: 0, top: 0, width: 1024, height: 768 });
  }, []);
  return (
    <div>
      <button onClick={() => h.setNat({ w: 1000, h: 500 })}>setNatA</button>
      <button onClick={() => h.setNat({ w: 200, h: 100 })}>setNatB</button>
      <div
        data-testid="frame"
        ref={h.frameRef}
        style={{ position: "relative", width: 300, height: 200 }}
      >
        <div
          data-testid="bubble"
          ref={h.bubbleRef}
          onPointerDown={h.onBubblePointerDown}
          onPointerMove={h.onBubblePointerMove}
          onPointerUp={h.onBubblePointerUp}
          data-x={h.posFrame.x}
          data-y={h.posFrame.y}
          data-scale={h.scale}
          style={{
            position: "absolute",
            left: h.posFrame.x,
            top: h.posFrame.y,
            width: 100,
            height: 80,
          }}
        />
      </div>
    </div>
  );
}

describe("useCanvasFrame", () => {
  it("computes scale from nat and box via ResizeObserver", async () => {
    render(<Host />);
    const frame = screen.getByTestId("frame");
    const bubble = screen.getByTestId("bubble");
    setRect(frame, { width: 200, height: 100 });
    setRect(bubble, { width: 100, height: 80, left: 120, top: 120 });
    roInstance.cb([{ contentRect: { width: 200, height: 100 } }]);
    fireEvent.click(screen.getByText("setNatA"));
    await waitFor(() =>
      expect(
        Number((bubble as HTMLElement).getAttribute("data-scale"))
      ).toBeCloseTo(0.2, 5)
    );
  });

  it("drags bubble with threshold and clamps within frame", async () => {
    render(<Host />);
    const frame = screen.getByTestId("frame");
    const bubble = screen.getByTestId("bubble");
    setRect(frame, { width: 300, height: 200, left: 0, top: 0 });
    setRect(bubble, { width: 100, height: 80, left: 120, top: 120 });
    roInstance.cb([{ contentRect: { width: 300, height: 200 } }]);

    fireEvent.pointerDown(bubble, {
      pointerType: "mouse",
      button: 0,
      clientX: 170,
      clientY: 160,
      pointerId: 1,
    });

    fireEvent.pointerMove(bubble, {
      pointerType: "mouse",
      clientX: 176,
      clientY: 166,
      pointerId: 1,
    });

    await act(async () => {});

    fireEvent.pointerMove(bubble, {
      pointerType: "mouse",
      clientX: 1000,
      clientY: 1000,
      pointerId: 1,
    });

    await waitFor(() => {
      const x = Number((bubble as HTMLElement).getAttribute("data-x"));
      const y = Number((bubble as HTMLElement).getAttribute("data-y"));
      expect(x).toBeGreaterThanOrEqual(120);
      expect(x).toBeLessThanOrEqual(200);
      expect(y).toBe(120);
    });

    fireEvent.pointerUp(bubble, {
      pointerType: "mouse",
      button: 0,
      clientX: 1000,
      clientY: 1000,
      pointerId: 1,
    });
  });

  it("rescales position when scale changes", async () => {
    render(<Host />);
    const frame = screen.getByTestId("frame");
    const bubble = screen.getByTestId("bubble");
    setRect(frame, { width: 100, height: 100, left: 0, top: 0 });
    setRect(bubble, { width: 20, height: 20, left: 60, top: 60 });
    roInstance.cb([{ contentRect: { width: 100, height: 100 } }]);

    fireEvent.click(screen.getByText("setNatB"));

    await waitFor(() =>
      expect(
        Number((bubble as HTMLElement).getAttribute("data-scale"))
      ).toBeCloseTo(0.5, 5)
    );

    fireEvent.pointerDown(bubble, {
      pointerType: "mouse",
      button: 0,
      clientX: 130,
      clientY: 130,
      pointerId: 2,
    });

    fireEvent.pointerMove(bubble, {
      pointerType: "mouse",
      clientX: 135,
      clientY: 135,
      pointerId: 2,
    });

    await act(async () => {});

    fireEvent.pointerMove(bubble, {
      pointerType: "mouse",
      clientX: 200,
      clientY: 200,
      pointerId: 2,
    });

    await waitFor(() => {
      const x = Number((bubble as HTMLElement).getAttribute("data-x"));
      const y = Number((bubble as HTMLElement).getAttribute("data-y"));
      expect(x).toBe(80);
      expect(y).toBe(80);
    });

    fireEvent.pointerUp(bubble, {
      pointerType: "mouse",
      button: 0,
      clientX: 200,
      clientY: 200,
      pointerId: 2,
    });

    fireEvent.click(screen.getByText("setNatA"));
    roInstance.cb([{ contentRect: { width: 100, height: 100 } }]);

    await waitFor(() =>
      expect(
        Number((bubble as HTMLElement).getAttribute("data-scale"))
      ).toBeCloseTo(0.1, 5)
    );

    await waitFor(() => {
      const x = Number((bubble as HTMLElement).getAttribute("data-x"));
      const y = Number((bubble as HTMLElement).getAttribute("data-y"));
      expect(x).toBeCloseTo(16, 5);
      expect(y).toBeCloseTo(16, 5);
    });
  });
});
