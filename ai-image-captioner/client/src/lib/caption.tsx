import type { ToneOption } from "../components/Upload/ToneSelect";

// Replace with a real API call when ready.
export async function generateCaption(
  tone: ToneOption,
  keywords: string[] = []
): Promise<string> {
  await new Promise((r) => setTimeout(r, 1100));

  const canned: Record<ToneOption, string> = {
    casual: "Just vibin’ with these colors—so much personality in one frame.",
    formal: "A refined composition that highlights balance, texture, and light.",
    humorous: "POV: you opened the camera by accident… but it kinda slaps 😅",
    professional: "A polished visual narrative that communicates clarity and intent.",
    inspirational: "Embrace the moment—every detail whispers progress and possibility.",
  };

  const base = canned[tone];
  const tags =
    keywords.length > 0
      ? " " +
        keywords
          .slice(0, 8)
          .map((k) => `#${k.replace(/\s+/g, "")}`)
          .join(" ")
      : "";

  return base + tags;
}
