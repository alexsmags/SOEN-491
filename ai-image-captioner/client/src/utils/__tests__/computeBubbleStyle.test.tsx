import { computeBubbleStyle, type CaptionStyleInput } from "../computeBubbleStyle";

describe("computeBubbleStyle", () => {
  it("should compute styles correctly with default values", () => {
    const input: CaptionStyleInput = {
      scale: 1,
      posFrame: { x: 50, y: 100 },
      textColor: "#ff0000",
      fontFamily: "Arial",
      fontSize: 16,
      align: "center",
      showBg: true,
      bgColor: "#000000",
      bgOpacity: 0.5,
      frameWidth: 400,
    };

    const result = computeBubbleStyle(input);

    expect(result).toEqual({
      transform: "translate(50px, 100px)",
      left: 0,
      top: 0,
      color: "#ff0000",
      fontFamily: "Arial",
      fontSize: 16,
      textAlign: "center",
      backgroundColor: "#000000",
      opacity: 0.5,
      padding: "8px 10px",
      borderRadius: 10,
      cursor: "grab",
      userSelect: "none",
      lineHeight: 1.25,
      maxWidth: "360px",
      whiteSpace: "pre-wrap",
      textShadow: "0 1px 2px rgba(0,0,0,0.4)",
      transformOrigin: "top left",
      touchAction: "none",
      willChange: "transform",
    });
  });

  it("should compute styles correctly with a different scale", () => {
    const input: CaptionStyleInput = {
      scale: 2,
      posFrame: { x: 30, y: 50 },
      textColor: "#00ff00",
      fontFamily: "Verdana",
      fontSize: 14,
      align: "right",
      showBg: false,
      bgColor: "#ffffff",
      bgOpacity: 1,
      frameWidth: 500,
    };

    const result = computeBubbleStyle(input);

    expect(result).toEqual({
      transform: "translate(30px, 50px)",
      left: 0,
      top: 0,
      color: "#00ff00",
      fontFamily: "Verdana",
      fontSize: 28,
      textAlign: "right",
      backgroundColor: "transparent",
      opacity: 1,
      padding: 0,
      borderRadius: 0,
      cursor: "grab",
      userSelect: "none",
      lineHeight: 1.25,
      maxWidth: "450px",
      whiteSpace: "pre-wrap",
      textShadow: "0 1px 2px rgba(0,0,0,0.4)",
      transformOrigin: "top left",
      touchAction: "none",
      willChange: "transform",
    });
  });

  it("should handle the case where the frameWidth is 0", () => {
    const input: CaptionStyleInput = {
      scale: 1,
      posFrame: { x: 10, y: 20 },
      textColor: "#000000",
      fontFamily: "Times New Roman",
      fontSize: 12,
      align: "left",
      showBg: true,
      bgColor: "#ffffff",
      bgOpacity: 0.7,
      frameWidth: 0,
    };

    const result = computeBubbleStyle(input);

    expect(result.maxWidth).toBeUndefined();
  });
});
