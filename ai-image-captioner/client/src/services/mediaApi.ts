export type MediaItem = {
  id: string;
  imageUrl: string;
  caption?: string;
  fontFamily?: string | null;
  fontSize?: number | null;
  textColor?: string | null;
  align?: "left" | "center" | "right" | string | null;
  showBg?: boolean | null;
  bgColor?: string | null;
  bgOpacity?: number | null;
  posX?: number | null;
  posY?: number | null;
};

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "";

export async function fetchMedia(mediaId: string): Promise<MediaItem> {
  const res = await fetch(`${SERVER_URL}/api/media/${encodeURIComponent(mediaId)}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to load media (${res.status})`);
  return res.json();
}

export async function saveMedia(
  mediaId: string,
  data: Partial<MediaItem>
): Promise<MediaItem> {
  const res = await fetch(`${SERVER_URL}/api/media/${encodeURIComponent(mediaId)}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Save failed (${res.status})`);
  return res.json();
}
