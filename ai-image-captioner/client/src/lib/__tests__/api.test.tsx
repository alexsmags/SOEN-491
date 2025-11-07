import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...import.meta.env };
const originalProcEnv = { ...process.env };
let fetchMock: ReturnType<typeof vi.fn>;

function setEnvBase(url?: string) {
  const nextMeta = { ...import.meta.env } as any;
  delete nextMeta.VITE_API_BASE;
  delete nextMeta.VITE_SERVER_URL;
  if (url) nextMeta.VITE_SERVER_URL = url;
  (import.meta as any).env = nextMeta;
  delete (process.env as any).VITE_API_BASE;
  delete (process.env as any).VITE_SERVER_URL;
  if (url) (process.env as any).VITE_SERVER_URL = url;
}

function mockConsole() {
  vi.spyOn(console, "group").mockImplementation(() => {});
  vi.spyOn(console, "groupEnd").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
}

function restoreConsole() {
  (console.group as any).mockRestore?.();
  (console.groupEnd as any).mockRestore?.();
  (console.log as any).mockRestore?.();
  (console.error as any).mockRestore?.();
}

function setupFetch() {
  fetchMock = vi.fn();
  (globalThis as any).fetch = fetchMock;
}

function makeOkResponse<T>(data: T, extras: Partial<Response> = {}): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => data as any,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
    url: "",
    redirected: false,
    clone() {
      return this;
    },
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    type: "basic",
    ...extras,
  } as unknown as Response;
}

function makeErrResponse(status = 500, statusText = "Server Error", body = "boom"): Response {
  return {
    ok: false,
    status,
    statusText,
    json: async () => ({ error: body }) as any,
    text: async () => body,
    headers: new Headers(),
    url: "",
    redirected: false,
    clone() {
      return this;
    },
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    type: "basic",
  } as unknown as Response;
}

async function importApi() {
  vi.resetModules();
  return await import("../api");
}

beforeEach(() => {
  (import.meta as any).env = { ...originalEnv };
  process.env = { ...originalProcEnv };
  mockConsole();
  setupFetch();
  vi.useFakeTimers();
  (globalThis as any).performance = { now: () => 0 } as any;
  localStorage.clear();
});

afterEach(() => {
  restoreConsole();
  vi.useRealTimers();
});

describe("api BASE and dev headers", () => {
  it("uses VITE_SERVER_URL when set and includes dev header when localStorage has id", async () => {
    setEnvBase("http://test-base:9999");
    localStorage.setItem("dev-user-id", "abc123");
    const { __debugApiBase } = await importApi();
    const dbg = __debugApiBase();
    expect(dbg.BASE).toBe("http://test-base:9999");
    expect(dbg.devHeader).toEqual({ "x-user-id": "abc123" });
  });

  it("falls back to localhost base when env not set and no dev header when missing id", async () => {
    setEnvBase(undefined);
    const { __debugApiBase } = await importApi();
    const dbg = __debugApiBase();
    expect(dbg.BASE).toBe("http://localhost:5000");
    expect(dbg.devHeader).toEqual({});
  });
});

describe("uploadMedia", () => {
  it("posts FormData with file, caption, optional fields and includes credentials and dev header", async () => {
    setEnvBase("http://api.local");
    localStorage.setItem("dev-user-id", "dev-1");
    const { uploadMedia } = await importApi();

    const file = new File(["hi"], "a.png", { type: "image/png" });
    const style = { fontSize: 24, showBg: true, bgOpacity: 0.8, align: "left" as const };
    const expected = { id: "z1", item: { id: "z1" } } as any;
    fetchMock.mockResolvedValueOnce(makeOkResponse(expected));

    const res = await uploadMedia({
      file,
      caption: "Cap",
      tone: "cheerful",
      keywords: ["k1", "k2"],
      style,
    });

    expect(res).toEqual(expected);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit & { signal: AbortSignal }];
    expect(url).toBe("http://api.local/api/media");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect((init.headers as any)["x-user-id"]).toBe("dev-1");
    expect(init.body instanceof FormData).toBe(true);

    const entries: Record<string, any> = {};
    (init.body as FormData).forEach((v, k) => (entries[k] = v));
    expect(entries.file).toBeInstanceOf(File);
    expect(entries.caption).toBe("Cap");
    expect(entries.tone).toBe("cheerful");
    expect(entries.keywords).toBe(JSON.stringify(["k1", "k2"]));
    expect(entries.fontSize).toBe("24");
    expect(entries.showBg).toBe("true");
    expect(entries.bgOpacity).toBe("0.8");
    expect(entries.align).toBe("left");
  });

  it("throws when server responds non-ok and logs error body", async () => {
    setEnvBase("http://api.local");
    const { uploadMedia } = await importApi();
    const file = new File(["x"], "a.png", { type: "image/png" });
    fetchMock.mockResolvedValueOnce(makeErrResponse(400, "Bad", "nope"));
    await expect(uploadMedia({ file, caption: "c" })).rejects.toThrow(/uploadMedia failed: 400 Bad/);
  });
});

describe("list/get/update/delete/duplicate", () => {
  it("listMedia builds query string from params", async () => {
    setEnvBase("http://api.local");
    const { listMedia } = await importApi();
    const payload = { items: [], total: 0, page: 2, pageSize: 50 };
    fetchMock.mockResolvedValueOnce(makeOkResponse(payload));
    const res = await listMedia({ tone: "serious", keyword: "cat", page: 2, pageSize: 50 });
    expect(res).toEqual(payload);
    const [urlStr, init] = fetchMock.mock.calls[0] as [string | URL, RequestInit];
    const url = new URL(urlStr as string);
    expect(url.origin).toBe("http://api.local");
    expect(url.pathname).toBe("/api/media");
    expect(url.searchParams.get("tone")).toBe("serious");
    expect(url.searchParams.get("keyword")).toBe("cat");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("pageSize")).toBe("50");
    expect(init.credentials).toBe("include");
  });

  it("getMedia includes credentials and returns json", async () => {
    setEnvBase("http://api.local");
    const { getMedia } = await importApi();
    const item = { id: "1" } as any;
    fetchMock.mockResolvedValueOnce(makeOkResponse(item));
    const res = await getMedia("1");
    expect(res).toEqual(item);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://api.local/api/media/1");
    expect(init.credentials).toBe("include");
  });

  it("updateMedia sends JSON body and proper headers", async () => {
    setEnvBase("http://api.local");
    const { updateMedia } = await importApi();
    const data = { caption: "N" };
    const out = { id: "1", item: { id: "1" } } as any;
    fetchMock.mockResolvedValueOnce(makeOkResponse(out));
    const res = await updateMedia("1", data);
    expect(res).toEqual(out);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://api.local/api/media/1");
    expect(init.method).toBe("PUT");
    expect((init.headers as any)["Content-Type"]).toBe("application/json");
    expect((init.body as string)).toBe(JSON.stringify(data));
  });

  it("deleteMedia calls DELETE and throws on non-ok", async () => {
    setEnvBase("http://api.local");
    const { deleteMedia } = await importApi();
    fetchMock.mockResolvedValueOnce(makeOkResponse(null as any));
    await expect(deleteMedia("9")).resolves.toBeUndefined();
    let [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://api.local/api/media/9");
    expect(init.method).toBe("DELETE");

    fetchMock.mockResolvedValueOnce(makeErrResponse(404, "NF", "nope"));
    await expect(deleteMedia("404")).rejects.toThrow(/deleteMedia failed: 404 NF/);
  });

  it("duplicateMedia posts and returns result", async () => {
    setEnvBase("http://api.local");
    const { duplicateMedia } = await importApi();
    const out = { id: "d2", item: { id: "d2" } } as any;
    fetchMock.mockResolvedValueOnce(makeOkResponse(out));
    const res = await duplicateMedia("2");
    expect(res).toEqual(out);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://api.local/api/media/2/duplicate");
    expect(init.method).toBe("POST");
  });
});

describe("timeouts and abort", () => {
  it("aborts and rejects when timeout elapses", async () => {
    setEnvBase("http://api.local");
    const { getMedia } = await importApi();

    fetchMock.mockImplementationOnce((_: string, init: RequestInit & { signal: AbortSignal }) => {
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => {
          reject(new Error("aborted"));
        });
      }) as any;
    });

    const p = getMedia("slow");
    vi.advanceTimersByTime(20000);
    await expect(p).rejects.toThrow(/aborted|timeout/i);
  });
});

describe("errors for non-ok", () => {
  it("listMedia throws with status text", async () => {
    setEnvBase("http://api.local");
    const { listMedia } = await importApi();
    fetchMock.mockResolvedValueOnce(makeErrResponse(503, "Unavailable", "x"));
    await expect(listMedia()).rejects.toThrow(/listMedia failed: 503 Unavailable/);
  });

  it("getMedia throws with status text", async () => {
    setEnvBase("http://api.local");
    const { getMedia } = await importApi();
    fetchMock.mockResolvedValueOnce(makeErrResponse(500, "Oops", "x"));
    await expect(getMedia("x")).rejects.toThrow(/getMedia failed: 500 Oops/);
  });

  it("updateMedia throws with status text", async () => {
    setEnvBase("http://api.local");
    const { updateMedia } = await importApi();
    fetchMock.mockResolvedValueOnce(makeErrResponse(400, "Bad", "x"));
    await expect(updateMedia("1", { caption: "c" })).rejects.toThrow(/updateMedia failed: 400 Bad/);
  });

  it("duplicateMedia throws with status text", async () => {
    setEnvBase("http://api.local");
    const { duplicateMedia } = await importApi();
    fetchMock.mockResolvedValueOnce(makeErrResponse(404, "Not Found", "x"));
    await expect(duplicateMedia("1")).rejects.toThrow(/duplicateMedia failed: 404 Not Found/);
  });
});
