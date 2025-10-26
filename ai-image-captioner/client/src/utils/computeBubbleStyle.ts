export type CaptionStyleInput = {
  scale: number;
  posFrame: { x: number; y: number };
  textColor: string;
  fontFamily: string;
  fontSize: number;
  align: "left" | "center" | "right";
  showBg: boolean;
  bgColor: string;
  bgOpacity: number;
  frameWidth: number;
};

export function computeBubbleStyle(i: CaptionStyleInput): React.CSSProperties {
  const padX = 10 * i.scale;
  const padY = 8 * i.scale;
  const radius = 10 * i.scale;
  const maxWidthPx = Math.floor(i.frameWidth * 0.9); 

  return {
    transform: `translate(${i.posFrame.x}px, ${i.posFrame.y}px)`,
    left: 0,
    top: 0,
    color: i.textColor,
    fontFamily: i.fontFamily,
    fontSize: Math.max(10, i.fontSize * i.scale),
    textAlign: i.align,
    backgroundColor: i.showBg ? i.bgColor : "transparent",
    opacity: i.showBg ? i.bgOpacity : 1,
    padding: i.showBg ? `${padY}px ${padX}px` : 0,
    borderRadius: i.showBg ? radius : 0,
    cursor: "grab",
    userSelect: "none",
    lineHeight: 1.25,
    maxWidth: maxWidthPx > 0 ? `${maxWidthPx}px` : undefined,
    whiteSpace: "pre-wrap",
    textShadow: "0 1px 2px rgba(0,0,0,0.4)",
    transformOrigin: "top left",
    touchAction: "none",
    willChange: "transform",
  } as React.CSSProperties;
}
