const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "";

function getDevHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const id = localStorage.getItem("dev-user-id");
  return id ? { "x-user-id": id } : {};
}

export async function fetchShareLink(mediaId: string): Promise<string> {
  const res = await fetch(`${SERVER_URL}/api/media/${mediaId}/share`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getDevHeaders(),
    },
    body: "{}", 
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Unable to create share link (${res.status}): ${body}`);
  }
  const data = await res.json();
  return data.url as string;
}

export async function fetchMediaFileAsFile(
  mediaId: string,
  mime: string | undefined | null,
  filename = "image"
): Promise<File> {
  const url = `${SERVER_URL}/api/media/${mediaId}/file`;
  const res = await fetch(url, {
    method: "GET",
    headers: { ...getDevHeaders() },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to fetch media file (${res.status})`);
  const blob = await res.blob();
  const ext = mime?.split("/")[1] || "png";
  return new File([blob], `${filename}.${ext}`, {
    type: mime || blob.type || "image/png",
  });
}

export interface MediaMeta {
  id: string;
  caption?: string | null;
  keywords?: string[] | null;
  mime?: string | null;
  imageUrl?: string | null;
  fontFamily?: string | null;
  fontSize?: number | null;
  textColor?: string | null;
  align?: "left" | "center" | "right" | null;
  showBg?: boolean | null;
  bgColor?: string | null;
  bgOpacity?: number | null;
  posX?: number | null;
  posY?: number | null;
}

export async function fetchMediaMeta(mediaId: string): Promise<MediaMeta> {
  const res = await fetch(`${SERVER_URL}/api/media/${mediaId}`, {
    method: "GET",
    headers: { ...getDevHeaders() },
    credentials: "include",
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Failed to load media meta (${res.status}): ${t}`);
  }
  return res.json() as Promise<MediaMeta>;
}
