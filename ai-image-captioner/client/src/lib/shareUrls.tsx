import type { SharePayload } from "../data/shareTargets";

const enc = encodeURIComponent;
const joinTags = (tags?: string[]) =>
  tags && tags.length ? tags.map((t) => t.replace(/^#/, "")).join(",") : "";

export function buildShareUrl(
  platform:
    | "twitter"
    | "facebook"
    | "linkedin"
    | "reddit"
    | "telegram"
    | "whatsapp"
    | "email"
    | "system",
  payload: SharePayload
): string | null {
  const { url, text, hashtags } = payload;

  switch (platform) {
    case "twitter": {
      const q = new URLSearchParams({
        url,
        text: text ?? "",
      });
      const tags = joinTags(hashtags);
      if (tags) q.set("hashtags", tags);
      return `https://twitter.com/intent/tweet?${q.toString()}`;
    }
    case "facebook": {
      const q = new URLSearchParams({ u: url });
      return `https://www.facebook.com/sharer/sharer.php?${q.toString()}`;
    }
    case "linkedin": {
      const q = new URLSearchParams({
        url,
        text: text ?? "",
      });
      return `https://www.linkedin.com/sharing/share-offsite/?${q.toString()}`;
    }
    case "reddit": {
      const q = new URLSearchParams({
        url,
        title: text ?? "",
      });
      return `https://www.reddit.com/submit?${q.toString()}`;
    }
    case "telegram": {
      const q = new URLSearchParams({
        url,
        text: text ?? "",
      });
      return `https://t.me/share/url?${q.toString()}`;
    }
    case "whatsapp": {
      const combined = text ? `${text} ${url}` : url;
      const q = new URLSearchParams({ text: combined });
      return `https://api.whatsapp.com/send?${q.toString()}`;
    }
    case "email": {
      const subject = "Check this out!";
      const body = text ? `${text}\n\n${url}` : url;
      return `mailto:?subject=${enc(subject)}&body=${enc(body)}`;
    }
    case "system": {
      return null;
    }
    default:
      return null;
  }
}
