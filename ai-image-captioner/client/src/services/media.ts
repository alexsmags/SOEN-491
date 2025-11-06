// client/src/services/media.ts
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
    body: "{}",                // no body fields needed
    credentials: "include",    // send cookies for auth
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
) {
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

export async function fetchMediaMeta(mediaId: string): Promise<any> {
  const res = await fetch(`${SERVER_URL}/api/media/${mediaId}`, {
    method: "GET",
    headers: { ...getDevHeaders() },
    credentials: "include",
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Failed to load media meta (${res.status}): ${t}`);
  }
  return res.json();
}
