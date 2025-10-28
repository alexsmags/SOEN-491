export type ToneOption = string;

export type Placement = "beginning" | "middle" | "end";

export type CaptionOptions = {
  includeHashtags?: boolean;
  includeMentions?: boolean;
  location?: string;
  handles?: string[];
  voice?: "i" | "we" | "neutral";
  length?: "short" | "medium" | "long";

  hashtags?: string[];

  includeEmojis?: boolean;
  emojiCount?: number;
  emojiPlacement?: Placement;

  hashtagsPlacement?: Placement;
  mentionsPlacement?: Placement;
};

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ??
  import.meta.env.VITE_API_BASE ??
  "";

const DEV_USER_ID: string | undefined = import.meta.env.VITE_DEV_USER_ID;

export async function generateCaption(
  file: File,
  tone: ToneOption,
  keywords: string[],
  opts: CaptionOptions = {}
) {
  const fd = new FormData();
  fd.append("file", file);
  if (tone) fd.append("tone", tone);

  if (keywords?.length) fd.append("keywords", JSON.stringify(keywords));

  if (opts.hashtags?.length) fd.append("hashtags", JSON.stringify(opts.hashtags));

  if (typeof opts.includeHashtags === "boolean") fd.append("includeHashtags", String(opts.includeHashtags));
  if (typeof opts.includeMentions === "boolean") fd.append("includeMentions", String(opts.includeMentions));
  if (opts.location) fd.append("location", opts.location);
  if (opts.handles?.length) fd.append("handles", JSON.stringify(opts.handles));
  if (opts.voice) fd.append("voice", opts.voice);
  if (opts.length) fd.append("length", opts.length);

  if (typeof opts.includeEmojis === "boolean") fd.append("includeEmojis", String(opts.includeEmojis));
  if (typeof opts.emojiCount === "number") fd.append("emojiCount", String(opts.emojiCount));
  if (opts.emojiPlacement) fd.append("emojiPlacement", opts.emojiPlacement);
  if (opts.hashtagsPlacement) fd.append("hashtagsPlacement", opts.hashtagsPlacement);
  if (opts.mentionsPlacement) fd.append("mentionsPlacement", opts.mentionsPlacement);

  const headers: Record<string, string> = {};
  if (DEV_USER_ID) headers["x-user-id"] = DEV_USER_ID;

  const res = await fetch(`${SERVER_URL}/api/caption`, {
    method: "POST",
    body: fd,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `Caption request failed (${res.status})`);
  }

  const data = await res.json();
  const enhanced: string | undefined = data?.enhanced;
  const base: string | undefined = data?.caption || data?.text || data?.generated_text;
  if (!enhanced && !base) throw new Error("No caption returned.");

  console.log("[generateCaption][server-meta]", data?.meta);
  console.log("[generateCaption][base]", base);
  console.log("[generateCaption][enhanced]", enhanced);

  return (enhanced || base) as string;
}
