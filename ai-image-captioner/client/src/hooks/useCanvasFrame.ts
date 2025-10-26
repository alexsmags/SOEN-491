import { useEffect, useMemo, useRef, useState } from "react";

export function useCanvasFrame() {
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);

  const frameRef = useRef<HTMLDivElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setBox({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = useMemo(() => {
    if (!nat || !box.w || !box.h) return 1;
    return Math.min(box.w / nat.w, box.h / nat.h);
  }, [nat, box.w, box.h]);

  const [posFrame, setPosFrame] = useState<{ x: number; y: number }>({
    x: 120,
    y: 120,
  });

  const lastScaleRef = useRef<number>(1);
  useEffect(() => {
    const prev = lastScaleRef.current;
    if (prev === scale || !isFinite(scale) || !isFinite(prev)) return;
    setPosFrame((p) => ({ x: (p.x / prev) * scale, y: (p.y / prev) * scale }));
    lastScaleRef.current = scale;
  }, [scale]);

  const clampPosition = (nx: number, ny: number) => {
    const frame = frameRef.current;
    const bubble = bubbleRef.current;
    if (!frame || !bubble) return { x: nx, y: ny };
    const frameRect = frame.getBoundingClientRect();
    const bubbleRect = bubble.getBoundingClientRect();
    const pad = 0;
    const minX = pad,
      minY = pad;
    const maxX = Math.max(0, frameRect.width - bubbleRect.width - pad);
    const maxY = Math.max(0, frameRect.height - bubbleRect.height - pad);
    return {
      x: Math.min(Math.max(nx, minX), maxX),
      y: Math.min(Math.max(ny, minY), maxY),
    };
  };

  const [dragging, setDragging] = useState(false);
  const [maybeDragging, setMaybeDragging] = useState(false);
  const startPt = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const DRAG_THRESHOLD = 6;

  const onBubblePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const bubble = bubbleRef.current;
    if (!bubble) return;
    setMaybeDragging(true);
    startPt.current = { x: e.clientX, y: e.clientY };
    const bb = bubble.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - bb.left, y: e.clientY - bb.top };
  };

  const onBubblePointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const frame = frameRef.current;
    if (!frame) return;

    if (!dragging && maybeDragging) {
      const dx = e.clientX - startPt.current.x;
      const dy = e.clientY - startPt.current.y;
      if (Math.hypot(dx, dy) >= DRAG_THRESHOLD) {
        (e.target as Element)?.setPointerCapture?.(e.pointerId);
        setDragging(true);
      } else {
        return;
      }
    }

    if (!dragging) return;
    const frameRect = frame.getBoundingClientRect();
    const nx = e.clientX - frameRect.left - dragOffset.current.x;
    const ny = e.clientY - frameRect.top - dragOffset.current.y;
    setPosFrame(clampPosition(nx, ny));
    e.preventDefault();
  };

  const onBubblePointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (dragging) {
      (e.target as Element)?.releasePointerCapture?.(e.pointerId);
    }
    setDragging(false);
    setMaybeDragging(false);
  };

  return {
    nat,
    setNat,
    box,
    scale,

    frameRef,
    bubbleRef,

    posFrame,
    setPosFrame,
    clampPosition,

    dragging,
    onBubblePointerDown,
    onBubblePointerMove,
    onBubblePointerUp,
  };
}