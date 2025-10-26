export type Media = {
  id: string;
  imageUrl: string;
  caption: string;
  tone?: string | null;
  keywords?: string[] | null;
  fontFamily?: string | null;
  fontSize?: number | null;
  textColor?: string | null;
  align?: "left" | "center" | "right" | string | null;
  showBg?: boolean | null;
  bgColor?: string | null;
  bgOpacity?: number | null;
  posX?: number | null;
  posY?: number | null;
  createdAt: string;
  updatedAt: string;
};

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:5000";
const DEV_USER_ID = import.meta.env.VITE_DEV_USER_ID ?? "dev-user-1";

const commonHeaders: HeadersInit = {
  "x-user-id": DEV_USER_ID,
};

export function __debugApiBase() {
  return { BASE, DEV_USER_ID, commonHeaders };
}

async function debugFetch(
  url: string | URL,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const label = `[api] ${init.method ?? "GET"} ${url}`;
  const started = performance.now();
  const controller = new AbortController();
  const timeoutMs = init.timeoutMs ?? 20000;
  const t = setTimeout(() => controller.abort(`timeout ${timeoutMs}ms`), timeoutMs);

  const reqInit: RequestInit = {
    ...init,
    signal: controller.signal,
    credentials: init.credentials ?? "include",
  };

  console.group(label);
  try {
    let bodyDesc = "";
    if (init.body instanceof FormData) {
      const parts: string[] = [];
      init.body.forEach((v, k) => {
        if (v instanceof File) parts.push(`${k}: [File name=${v.name} type=${v.type} size=${v.size}]`);
        else parts.push(`${k}: ${String(v).slice(0, 200)}`);
      });
      bodyDesc = `FormData { ${parts.join(", ")} }`;
    } else if (typeof init.body === "string") {
      bodyDesc = init.body.slice(0, 500);
    } else if (init.body) {
      bodyDesc = JSON.stringify(init.body).slice(0, 500);
    }

    console.log("headers:", init.headers);
    console.log("credentials:", reqInit.credentials);
    if (bodyDesc) console.log("body:", bodyDesc);

    const res = await fetch(url, reqInit);
    const elapsed = Math.round(performance.now() - started);
    console.log("status:", res.status, res.statusText, `(${elapsed}ms)`);

    if (!res.ok) {
      const txt = await res.text().catch(() => "<read body failed>");
      console.error("response body (error):", txt);
    }

    console.groupEnd();
    clearTimeout(t);
    return res;
  } catch (err) {
    const elapsed = Math.round(performance.now() - started);
    console.error("fetch failed after", `${elapsed}ms`, "error:", err);
    console.groupEnd();
    clearTimeout(t);
    throw err;
  }
}

export async function uploadMedia(opts: {
  file: File;
  caption: string;
  tone?: string;
  keywords?: string[];
  style?: Partial<Media>;
}): Promise<Media> {
  const form = new FormData();
  form.append("file", opts.file);
  form.append("caption", opts.caption);
  if (opts.tone) form.append("tone", opts.tone);
  if (opts.keywords) form.append("keywords", JSON.stringify(opts.keywords));
  if (opts.style) {
    Object.entries(opts.style).forEach(([k, v]) => {
      if (v !== undefined && v !== null) form.append(k, String(v));
    });
  }

  const url = `${BASE}/api/media`;
  const res = await debugFetch(url, {
    method: "POST",
    body: form,
    headers: commonHeaders,
    timeoutMs: 30000,
  });
  if (!res.ok) throw new Error(`uploadMedia failed: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function listMedia(params?: { tone?: string; keyword?: string; page?: number; pageSize?: number; }) {
  const url = new URL(`${BASE}/api/media`);
  if (params?.tone) url.searchParams.set("tone", params.tone);
  if (params?.keyword) url.searchParams.set("keyword", params.keyword);
  if (params?.page) url.searchParams.set("page", String(params.page));
  if (params?.pageSize) url.searchParams.set("pageSize", String(params.pageSize));
  const res = await debugFetch(url, { headers: commonHeaders, timeoutMs: 20000 });
  if (!res.ok) throw new Error(`listMedia failed: ${res.status} ${res.statusText}`);
  return res.json() as Promise<{ items: Media[]; total: number; page: number; pageSize: number }>;
}

export async function getMedia(id: string): Promise<Media> {
  const res = await debugFetch(`${BASE}/api/media/${id}`, { headers: commonHeaders, timeoutMs: 20000 });
  if (!res.ok) throw new Error(`getMedia failed: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function updateMedia(id: string, data: Partial<Media>): Promise<Media> {
  const res = await debugFetch(`${BASE}/api/media/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...commonHeaders },
    body: JSON.stringify(data),
    timeoutMs: 20000,
  });
  if (!res.ok) throw new Error(`updateMedia failed: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function deleteMedia(id: string): Promise<void> {
  const res = await debugFetch(`${BASE}/api/media/${id}`, { method: "DELETE", headers: commonHeaders, timeoutMs: 20000 });
  if (!res.ok) throw new Error(`deleteMedia failed: ${res.status} ${res.statusText}`);
}

export async function duplicateMedia(id: string): Promise<Media> {
  const res = await debugFetch(`${BASE}/api/media/${id}/duplicate`, { method: "POST", headers: commonHeaders, timeoutMs: 20000 });
  if (!res.ok) throw new Error(`duplicateMedia failed: ${res.status} ${res.statusText}`);
  return res.json();
}
