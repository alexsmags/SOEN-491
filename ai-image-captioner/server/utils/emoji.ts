import fs from "fs";
import { createRequire } from "module";
import { extractTopKeywords } from "./textUtils.js";

type EmbedderFn = (inputs: string, options?: unknown) => Promise<any>;

function normalizeVec(x: number[]): number[] {
  const n = Math.sqrt(x.reduce((s, v) => s + v * v, 0)) || 1;
  return x.map((v) => v / n);
}
function meanPool(feats: number[][]): number[] {
  const d = feats[0].length;
  const out = new Array(d).fill(0);
  for (const row of feats) for (let j = 0; j < d; j++) out[j] += row[j];
  return out.map((v) => v / feats.length);
}
async function embedText(embedder: EmbedderFn, text: string): Promise<number[]> {
  const out: any = await embedder(text, { normalize: false });
  const feats: number[][] = Array.isArray(out.data?.[0]) ? out.data : [out.data];
  return normalizeVec(meanPool(feats));
}
function cosSim(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) s += a[i] * b[i];
  return s;
}

type EmojibaseEntry = {
  emoji: string;
  label: string;
  tags?: string[];
  shortcodes?: string[];
};

let EMOJI_DATA_CACHE:
  | { entries: { emoji: string; text: string; label: string }[] }
  | null = null;

const require_ = createRequire(import.meta.url);

function tryResolve(p: string): string | null {
  try {
    return require_.resolve(p);
  } catch {
    return null;
  }
}

function loadEmojibase(): EmojibaseEntry[] {
  const resolved =
    tryResolve("emojibase-data/en/data.json") ||
    tryResolve("emojibase-data/en/compact.json");
  if (!resolved) {
    throw new Error(
      "Could not resolve emojibase-data. Install it with `npm i emojibase-data`."
    );
  }
  const raw = fs.readFileSync(resolved, "utf8");
  return JSON.parse(raw) as EmojibaseEntry[];
}

function buildEmojiEntries(): { emoji: string; text: string; label: string }[] {
  const data = loadEmojibase();
  return data
    .filter((e) => !!e.emoji && !!e.label)
    .map((e) => {
      const tags = Array.isArray(e.tags) ? e.tags.join(" ") : "";
      const sc = Array.isArray(e.shortcodes) ? e.shortcodes.join(" ") : "";
      const text = `${e.label} ${tags} ${sc}`
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
      return { emoji: e.emoji, text, label: e.label };
    });
}

function getEmojiData() {
  if (!EMOJI_DATA_CACHE) {
    EMOJI_DATA_CACHE = { entries: buildEmojiEntries() };
  }
  return EMOJI_DATA_CACHE.entries;
}

function pickCandidatesByKeywords(
  entries: { emoji: string; text: string; label: string }[],
  keywords: string[],
  maxCandidates = 300
) {
  if (!keywords.length) return entries.slice(0, Math.min(entries.length, maxCandidates));

  const scored = entries.map((e) => {
    let score = 0;
    for (const k of keywords) {
      if (e.text.includes(k.toLowerCase())) score += 1;
    }
    return { e, score };
  });

  const hits = scored.filter((x) => x.score > 0);
  if (hits.length) {
    hits.sort((a, b) => b.score - a.score);
    return hits.slice(0, Math.min(hits.length, maxCandidates)).map((x) => x.e);
    }
  return entries.slice(0, Math.min(entries.length, maxCandidates));
}

export async function suggestEmojisByEmbedding(
  embedder: EmbedderFn,
  caption: string,
  desiredCount = 3
): Promise<string[]> {
  const entries = getEmojiData();
  const keywords = extractTopKeywords(caption, 8);
  const candidates = pickCandidatesByKeywords(entries, keywords, 300);

  const capVec = await embedText(embedder, caption);

  const ranked: { emoji: string; score: number }[] = [];
  for (const c of candidates) {
    const vec = await embedText(embedder, c.text);
    ranked.push({ emoji: c.emoji, score: cosSim(capVec, vec) });
  }
  ranked.sort((a, b) => b.score - a.score);

  const take = Math.max(1, Math.min(8, desiredCount));
  const out: string[] = [];
  const seen = new Set<string>();
  for (const r of ranked) {
    if (seen.has(r.emoji)) continue;
    seen.add(r.emoji);
    out.push(r.emoji);
    if (out.length >= take) break;
  }
  return out;
}
