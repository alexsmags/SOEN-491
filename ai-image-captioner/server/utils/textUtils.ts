export type Placement = "beginning" | "middle" | "end";

export function tagify(word: string) {
  return "#" + word.toLowerCase().replace(/[^a-z0-9]+/gi, "").replace(/^#+/, "");
}

export function ensureVoice(text: string, voice: "i" | "we" | "neutral") {
  if (voice === "neutral") return text;
  const hasI = /\b(I|I'm|I’ve|I’m|me|my|mine)\b/i.test(text);
  const hasWe = /\b(we|we're|we’ve|us|our|ours)\b/i.test(text);
  if (voice === "i" && !hasI) return `I ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
  if (voice === "we" && !hasWe) return `We ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
  return text;
}

export function trimToLength(text: string, len: "short" | "medium" | "long") {
  const maxWords = len === "short" ? 12 : len === "medium" ? 25 : 60;
  const words = text.split(/\s+/).filter(Boolean);
  return words.length <= maxWords ? text : words.slice(0, maxWords).join(" ").trim();
}

function placeSegment(coreWords: string[], segment: string, where: Placement): string[] {
  if (!segment.trim()) return coreWords;
  const out = [...coreWords];
  const insertAt =
    where === "beginning" ? 0 :
    where === "end" ? out.length :
    Math.max(1, Math.floor(out.length / 2));
  const segWords = segment.trim().split(/\s+/);
  out.splice(insertAt, 0, ...segWords);
  return out;
}

export function ruleBasedCaption(
  baseOrModel: string,
  opts: {
    tone: string;
    keywords: string[];
    hashtags: string[];
    includeHashtags: boolean;
    includeMentions: boolean;
    location?: string;
    handles: string[];
    voice: "i" | "we" | "neutral";
    length: "short" | "medium" | "long";
    includeEmojis: boolean;
    emojis: string[];
    emojiPlacement: Placement;
    hashtagsPlacement: Placement;
    mentionsPlacement: Placement;
  }
) {
  let core = baseOrModel.replace(/^a\s+/i, "").replace(/^the\s+/i, "").trim();

  const mentionsArr =
    opts.includeMentions && opts.handles.length
      ? opts.handles.map((h) => (h.startsWith("@") ? h : `@${h}`))
      : [];

  const locationToken = opts.location ? `📍${opts.location}` : "";
  const mentionsLocTokens: string[] = [];
  if (locationToken) mentionsLocTokens.push(locationToken);
  if (mentionsArr.length) mentionsLocTokens.push(...mentionsArr);
  const mentionsLocSegment = mentionsLocTokens.join(" ").trim();

  const hashtagsArr =
    opts.includeHashtags && opts.hashtags.length
      ? opts.hashtags.slice(0, 8).map(tagify)
      : [];
  const hashtagsSegment = hashtagsArr.join(" ").trim();

  const emojisSegment =
    opts.includeEmojis && opts.emojis.length ? opts.emojis.join(" ") : "";

  const maxWords = opts.length === "short" ? 12 : opts.length === "medium" ? 25 : 60;
  let coreWords = core.split(/\s+/).filter(Boolean);

  const segments: Array<{ where: Placement; content: string }> = [
    { where: opts.emojiPlacement, content: emojisSegment },
    { where: opts.mentionsPlacement, content: mentionsLocSegment },
    { where: opts.hashtagsPlacement, content: hashtagsSegment },
  ];

  (["beginning", "middle", "end"] as Placement[]).forEach((pos) => {
    segments
      .filter((s) => s.where === pos && s.content)
      .forEach((s) => {
        coreWords = placeSegment(coreWords, s.content, pos);
      });
  });

  let out = coreWords.join(" ").replace(/\s+/g, " ").trim();
  out = ensureVoice(out, opts.voice);

  const words = out.split(/\s+/).filter(Boolean);
  if (words.length > maxWords) out = words.slice(0, maxWords).join(" ");

  out = out.replace(/\s+([,.!?;:])/g, "$1").trim();
  return out;
}

export function looksBad(s: string, prompt: string) {
  if (!s) return true;
  if (s.length < 3) return true;
  if (s.toLowerCase().startsWith(prompt.toLowerCase())) return true;
  const badHints = ["text editor", "article", "there is no other way", "first two lines"];
  if (badHints.some((h) => s.toLowerCase().includes(h))) return true;
  return false;
}

export function extractEmojisOnly(s: string, max = 5): string[] {
  if (!s) return [];
  const tokens = s
    .replace(/[A-Za-z0-9,.;:()"'`~_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  const emojiish = tokens.filter((t) =>
    /[\p{Extended_Pictographic}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(t)
  );
  return emojiish.slice(0, Math.max(0, max));
}
