import type { Request, Response, NextFunction } from "express";

jest.doMock("../../middlware/auth.js", () => ({
  requireUserId: jest.fn(async () => "u1"),
}));

const mediaFindMany = jest.fn();
const mediaCount = jest.fn();
const mediaFindUnique = jest.fn();
const mediaCreate = jest.fn();
const mediaUpdate = jest.fn();
const mediaDelete = jest.fn();

jest.doMock("../../prisma.js", () => ({
  prisma: {
    media: {
      findMany: mediaFindMany,
      count: mediaCount,
      findUnique: mediaFindUnique,
      create: mediaCreate,
      update: mediaUpdate,
      delete: mediaDelete,
    },
  },
  __esModule: true,
}));

const makePublicUploadUrl = jest.fn((fn: string) => `http://test/uploads/${fn}`);
const uploadsUrlToPath = jest.fn(() => "/abs/path/file.jpg");
jest.doMock("../../middlware/uploads.js", () => ({
  uploadSingle: () => (_req: unknown, _res: unknown, next: unknown) => (next as Function)(),
  makePublicUploadUrl,
  uploadsUrlToPath,
  __esModule: true,
}));

const unlinkMock = jest.fn(async () => {});
const readFileMock = jest.fn(async () => Buffer.from("file"));
const statMock = jest.fn(async () => ({}));
jest.doMock("fs/promises", () => ({
  default: { unlink: unlinkMock, readFile: readFileMock, stat: statMock },
  unlink: unlinkMock,
  readFile: readFileMock,
  stat: statMock,
  __esModule: true,
}));

import router from "../../routes/media";

function getRoute(path: string, method: string = "get") {
  const stack: any[] = (router as any).stack;
  const layer = stack.find((l) => l.route && l.route.path === path && l.route.methods[method]);
  if (!layer) throw new Error(`Route not found: ${method.toUpperCase()} ${path}`);
  const handlers = layer.route.stack.map((s: any) => s.handle);
  return handlers[handlers.length - 1];
}

function mockReqRes(
  params: Record<string, unknown> = {},
  body: Record<string, unknown> = {},
  query: Record<string, unknown> = {}
) {
  const req = { params, body, query } as unknown as Request;
  let statusCode: number | undefined;
  let jsonBody: unknown;
  const res = {
    status: jest.fn(function (this: Response, code: number) {
      statusCode = code;
      return this;
    }),
    json: jest.fn(function (this: Response, payload: unknown) {
      jsonBody = payload;
      return this;
    }),
  } as unknown as Response;
  const next = jest.fn() as unknown as NextFunction;
  return { req, res, next, getStatus: () => statusCode, getJson: () => jsonBody };
}

function mockReqResBuf(params: Record<string, unknown> = {}) {
  const headers: Record<string, string> = {};
  let sent: unknown;
  const req = { params } as unknown as Request;
  const res = {
    setHeader(k: string, v: string) {
      headers[k] = v;
    },
    send(b: unknown) {
      sent = b;
      return this;
    },
    status: jest.fn(function (this: Response, _code: number) {
      return this;
    }),
    json: jest.fn(function (this: Response, _payload: unknown) {
      return this;
    }),
    get headers() {
      return headers;
    },
    get body() {
      return sent;
    },
  } as unknown as Response;
  const next = jest.fn() as unknown as NextFunction;
  return { req, res, next, getHeaders: () => headers, getBody: () => sent };
}

describe("media routes", () => {
  let warnSpy: jest.SpyInstance;

  beforeAll(() => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterAll(() => {
    warnSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /media returns paginated items (hasNext = true)", async () => {
    const handler = getRoute("/media", "get");
    mediaFindMany.mockResolvedValueOnce([{ id: "m1" }]);
    mediaCount.mockResolvedValueOnce(2);
    const { req, res, next, getJson } = mockReqRes({}, {}, { page: "1", pageSize: "1" });
    await handler(req, res, next);
    expect(mediaFindMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
      orderBy: { createdAt: "desc" },
      skip: 0,
      take: 1,
    });
    expect(getJson()).toEqual({
      items: [{ id: "m1" }],
      total: 2,
      hasNext: true,
      page: 1,
      pageSize: 1,
    });
  });

  it("GET /media falls back to defaults and returns hasNext = false", async () => {
    const handler = getRoute("/media", "get");
    mediaFindMany.mockResolvedValueOnce([{ id: "m1" }]);
    mediaCount.mockResolvedValueOnce(1);
    const { req, res, next, getJson } = mockReqRes();
    await handler(req, res, next);
    expect(mediaFindMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
      orderBy: { createdAt: "desc" },
      skip: 0,
      take: 12,
    });
    expect(getJson()).toEqual({
      items: [{ id: "m1" }],
      total: 1,
      hasNext: false,
      page: 1,
      pageSize: 12,
    });
  });

  it("GET /media calls next(err) on failure", async () => {
    const handler = getRoute("/media", "get");
    const err = new Error("db failed");
    mediaFindMany.mockRejectedValueOnce(err);
    const { req, res, next } = mockReqRes();
    await handler(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  it("GET /media/:id returns 404 if not found", async () => {
    const handler = getRoute("/media/:id", "get");
    mediaFindUnique.mockResolvedValueOnce(null);
    const { req, res, next, getStatus, getJson } = mockReqRes({ id: "m1" });
    await handler(req, res, next);
    expect(getStatus()).toBe(404);
    expect(getJson()).toEqual({ error: "not_found" });
  });

  it("GET /media/:id returns 403 if not owner", async () => {
    const handler = getRoute("/media/:id", "get");
    mediaFindUnique.mockResolvedValueOnce({ id: "m1", userId: "u2" });
    const { req, res } = mockReqRes({ id: "m1" });
    await handler(req, res, jest.fn());
    expect((res as any).status).toHaveBeenCalledWith(403);
  });

  it("GET /media/:id returns item if owner", async () => {
    const handler = getRoute("/media/:id", "get");
    const item = { id: "m1", userId: "u1" };
    mediaFindUnique.mockResolvedValueOnce(item);
    const { req, res, getJson } = mockReqRes({ id: "m1" });
    await handler(req, res, jest.fn());
    expect(getJson()).toEqual(item);
  });

  it("GET /media/:id calls next(err) on failure", async () => {
    const handler = getRoute("/media/:id", "get");
    const err = new Error("find failed");
    mediaFindUnique.mockRejectedValueOnce(err);
    const { req, res, next } = mockReqRes({ id: "m1" });
    await handler(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  it("POST /media creates new media item", async () => {
    const handler = getRoute("/media", "post");
    const created = { id: "m1" };
    mediaCreate.mockResolvedValueOnce(created);
    const req: any = { body: { caption: "hi" }, file: { filename: "a.jpg" } };
    const res: any = { status: jest.fn(() => res), json: jest.fn() };
    await handler(req, res, jest.fn());
    expect(mediaCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "u1",
        caption: "hi",
        imageUrl: "http://test/uploads/a.jpg",
      }),
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("POST /media parses keywords string and preserves tone", async () => {
    const handler = getRoute("/media", "post");
    const created = { id: "m2" };
    mediaCreate.mockResolvedValueOnce(created);
    const req: any = {
      body: { caption: "hello", tone: "playful", keywords: '["one","two"]' },
      file: { filename: "b.png" },
    };
    const res: any = { status: jest.fn(() => res), json: jest.fn() };
    await handler(req, res, jest.fn());
    expect(mediaCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tone: "playful",
        keywords: ["one", "two"],
      }),
    });
  });

  it("POST /media handles invalid keywords JSON", async () => {
    const handler = getRoute("/media", "post");
    const created = { id: "m3" };
    mediaCreate.mockResolvedValueOnce(created);
    const req: any = { body: { caption: "hi", keywords: "not-json" }, file: { filename: "c.png" } };
    const res: any = { status: jest.fn(() => res), json: jest.fn() };
    await handler(req, res, jest.fn());
    expect(mediaCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ keywords: [] }),
    });
  });

  it("POST /media allows keywords array", async () => {
    const handler = getRoute("/media", "post");
    const created = { id: "m4" };
    mediaCreate.mockResolvedValueOnce(created);
    const req: any = { body: { caption: "hi", keywords: ["alpha", "beta"] }, file: { filename: "d.png" } };
    const res: any = { status: jest.fn(() => res), json: jest.fn() };
    await handler(req, res, jest.fn());
    expect(mediaCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ keywords: ["alpha", "beta"] }),
    });
  });

  it("POST /media returns 400 on invalid body", async () => {
    const handler = getRoute("/media", "post");
    const req: any = { body: { tone: "x" }, file: { filename: "a.jpg" } };
    const res: any = { status: jest.fn(() => res), json: jest.fn() };
    await handler(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mediaCreate).not.toHaveBeenCalled();
  });

  it("POST /media returns 400 when file missing", async () => {
    const handler = getRoute("/media", "post");
    const req: any = { body: { caption: "hi" } };
    const res: any = { status: jest.fn(() => res), json: jest.fn() };
    await handler(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("POST /media calls next(err) when create fails", async () => {
    const handler = getRoute("/media", "post");
    const err = new Error("create failed");
    mediaCreate.mockRejectedValueOnce(err);
    const req: any = { body: { caption: "x" }, file: { filename: "z.jpg" } };
    const res: any = { status: jest.fn(() => res), json: jest.fn() };
    const next = jest.fn();
    await handler(req, res, next as any);
    expect(next).toHaveBeenCalledWith(err);
  });

  it("PUT /media/:id updates allowed fields", async () => {
    const handler = getRoute("/media/:id", "put");
    mediaFindUnique.mockResolvedValueOnce({ id: "m1", userId: "u1" });
    mediaUpdate.mockResolvedValueOnce({ id: "m1" });
    const { req, res, getJson } = mockReqRes({ id: "m1" }, { caption: "new cap", align: "center" });
    await handler(req, res, jest.fn());
    expect(mediaUpdate).toHaveBeenCalledWith({
      where: { id: "m1" },
      data: { caption: "new cap", align: "center" },
    });
    expect(getJson()).toEqual({ id: "m1", item: { id: "m1" } });
  });

  it("PUT /media/:id ignores unknown fields", async () => {
    const handler = getRoute("/media/:id", "put");
    mediaFindUnique.mockResolvedValueOnce({ id: "m1", userId: "u1" });
    mediaUpdate.mockResolvedValueOnce({ id: "m1" });
    const { req, res } = mockReqRes({ id: "m1" }, { caption: "ok", foo: "bar", textColor: "#fff" });
    await handler(req, res, jest.fn());
    expect(mediaUpdate).toHaveBeenCalledWith({
      where: { id: "m1" },
      data: { caption: "ok", textColor: "#fff" },
    });
  });

  it("PUT /media/:id returns 404 when not found", async () => {
    const handler = getRoute("/media/:id", "put");
    mediaFindUnique.mockResolvedValueOnce(null);
    const { req, res, getStatus, getJson } = mockReqRes({ id: "m404" }, { caption: "anything" });
    await handler(req, res, jest.fn());
    expect(getStatus()).toBe(404);
    expect(getJson()).toEqual({ error: "not_found" });
  });

  it("PUT /media/:id returns 403 when not owner", async () => {
    const handler = getRoute("/media/:id", "put");
    mediaFindUnique.mockResolvedValueOnce({ id: "m1", userId: "u2" });
    const { req, res, getStatus, getJson } = mockReqRes({ id: "m1" }, { caption: "nope" });
    await handler(req, res, jest.fn());
    expect(getStatus()).toBe(403);
    expect(getJson()).toEqual({ error: "forbidden", reason: "not_owner" });
  });

  it("PUT /media/:id calls next(err) on update failure", async () => {
    const handler = getRoute("/media/:id", "put");
    mediaFindUnique.mockResolvedValueOnce({ id: "m1", userId: "u1" });
    const err = new Error("update failed");
    mediaUpdate.mockRejectedValueOnce(err);
    const { req, res, next } = mockReqRes({ id: "m1" }, { caption: "x" });
    await handler(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  it("DELETE /media/:id removes media and unlinks file", async () => {
    const handler = getRoute("/media/:id", "delete");
    mediaFindUnique.mockResolvedValueOnce({ id: "m1", userId: "u1", imageUrl: "http://test/uploads/a.jpg" });
    mediaDelete.mockResolvedValueOnce({});
    uploadsUrlToPath.mockReturnValueOnce("/abs/path/a.jpg");
    const { req, res, getJson } = mockReqRes({ id: "m1" });
    await handler(req, res, jest.fn());
    expect(mediaDelete).toHaveBeenCalledWith({ where: { id: "m1" } });
    expect(unlinkMock).toHaveBeenCalledWith("/abs/path/a.jpg");
    expect(getJson()).toEqual({ ok: true, id: "m1" });
  });

  it("DELETE /media/:id returns 404 when not found", async () => {
    const handler = getRoute("/media/:id", "delete");
    mediaFindUnique.mockResolvedValueOnce(null);
    const { req, res, getStatus, getJson } = mockReqRes({ id: "m404" });
    await handler(req, res, jest.fn());
    expect(getStatus()).toBe(404);
    expect(getJson()).toEqual({ error: "not_found" });
  });

  it("DELETE /media/:id returns 403 when not owner", async () => {
    const handler = getRoute("/media/:id", "delete");
    mediaFindUnique.mockResolvedValueOnce({ id: "m1", userId: "u2", imageUrl: "http://test/uploads/a.jpg" });
    const { req, res, getStatus, getJson } = mockReqRes({ id: "m1" });
    await handler(req, res, jest.fn());
    expect(getStatus()).toBe(403);
    expect(getJson()).toEqual({ error: "forbidden", reason: "not_owner" });
  });

  it("DELETE /media/:id skips unlink if path is null", async () => {
    const handler = getRoute("/media/:id", "delete");
    mediaFindUnique.mockResolvedValueOnce({ id: "m1", userId: "u1", imageUrl: "http://test/uploads/a.jpg" });
    mediaDelete.mockResolvedValueOnce({});
    uploadsUrlToPath.mockReturnValueOnce(null as any);
    const { req, res } = mockReqRes({ id: "m1" });
    await handler(req, res, jest.fn());
    expect(unlinkMock).not.toHaveBeenCalled();
  });

  it("DELETE /media/:id ignores ENOENT on unlink", async () => {
    const handler = getRoute("/media/:id", "delete");
    mediaFindUnique.mockResolvedValueOnce({ id: "m1", userId: "u1", imageUrl: "http://test/uploads/a.jpg" });
    mediaDelete.mockResolvedValueOnce({});
    uploadsUrlToPath.mockReturnValueOnce("/abs/path/a.jpg");
    unlinkMock.mockRejectedValueOnce(Object.assign(new Error("no file"), { code: "ENOENT" }));
    const { req, res } = mockReqRes({ id: "m1" });
    await handler(req, res, jest.fn());
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("DELETE /media/:id warns on unexpected unlink error", async () => {
    const handler = getRoute("/media/:id", "delete");
    mediaFindUnique.mockResolvedValueOnce({ id: "m1", userId: "u1", imageUrl: "http://test/uploads/a.jpg" });
    mediaDelete.mockResolvedValueOnce({});
    uploadsUrlToPath.mockReturnValueOnce("/abs/path/a.jpg");
    unlinkMock.mockRejectedValueOnce(Object.assign(new Error("EPERM"), { code: "EPERM" }));
    const { req, res } = mockReqRes({ id: "m1" });
    await handler(req, res, jest.fn());
    expect(warnSpy).toHaveBeenCalledWith("[media][delete] unlink failed:", expect.any(Error));
  });

  it("DELETE /media/:id calls next(err) when delete fails", async () => {
    const handler = getRoute("/media/:id", "delete");
    mediaFindUnique.mockResolvedValueOnce({ id: "m1", userId: "u1", imageUrl: "http://test/uploads/a.jpg" });
    const err = new Error("delete failed");
    mediaDelete.mockRejectedValueOnce(err);
    const { req, res, next } = mockReqRes({ id: "m1" });
    await handler(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  it("GET /media/:id/file returns buffer and content-type jpeg", async () => {
    const handler = getRoute("/media/:id/file", "get");
    mediaFindUnique.mockResolvedValueOnce({ id: "m1", userId: "u1", imageUrl: "http://u/a.jpg" });
    uploadsUrlToPath.mockReturnValueOnce("/abs/path/a.jpg");
    readFileMock.mockResolvedValueOnce(Buffer.from("jpgdata"));
    const { req, res, getHeaders, getBody } = mockReqResBuf({ id: "m1" });
    await handler(req, res, jest.fn());
    expect(getHeaders()["Content-Type"]).toBe("image/jpeg");
    expect(Buffer.isBuffer(getBody())).toBe(true);
  });

  it("GET /media/:id/file uses png type for .png", async () => {
    const handler = getRoute("/media/:id/file", "get");
    mediaFindUnique.mockResolvedValueOnce({ id: "m2", userId: "u1", imageUrl: "http://u/a.png" });
    uploadsUrlToPath.mockReturnValueOnce("/abs/path/a.png");
    readFileMock.mockResolvedValueOnce(Buffer.from("pngdata"));
    const { req, res, getHeaders } = mockReqResBuf({ id: "m2" });
    await handler(req, res, jest.fn());
    expect(getHeaders()["Content-Type"]).toBe("image/png");
  });

  it("GET /media/:id/file returns 403 if not owner", async () => {
    const handler = getRoute("/media/:id/file", "get");
    mediaFindUnique.mockResolvedValueOnce({ id: "m1", userId: "u2", imageUrl: "u" });
    const { req, res } = mockReqRes({ id: "m1" });
    await handler(req, res, jest.fn());
    expect((res as any).status).toHaveBeenCalledWith(403);
  });

  it("GET /media/:id/file returns 404 if path missing", async () => {
    const handler = getRoute("/media/:id/file", "get");
    mediaFindUnique.mockResolvedValueOnce({ id: "m1", userId: "u1", imageUrl: "x" });
    uploadsUrlToPath.mockReturnValueOnce("");
    const { req, res } = mockReqRes({ id: "m1" });
    await handler(req, res, jest.fn());
    expect((res as any).status).toHaveBeenCalledWith(404);
  });

  it("GET /media/:id/file returns 404 if item not found", async () => {
    const handler = getRoute("/media/:id/file", "get");
    mediaFindUnique.mockResolvedValueOnce(null);
    const { req, res } = mockReqRes({ id: "m404" });
    await handler(req, res, jest.fn());
    expect((res as any).status).toHaveBeenCalledWith(404);
  });

  it("GET /media/:id/file calls next(err) on read error", async () => {
    const handler = getRoute("/media/:id/file", "get");
    mediaFindUnique.mockResolvedValueOnce({ id: "m1", userId: "u1", imageUrl: "x" });
    uploadsUrlToPath.mockReturnValueOnce("/abs/path/a.jpg");
    const err = new Error("io");
    readFileMock.mockRejectedValueOnce(err);
    const { req, res, next } = mockReqRes({ id: "m1" });
    await handler(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  it("POST /media/:id/share returns signed url and ttl", async () => {
    const handler = getRoute("/media/:id/share", "post");
    mediaFindUnique.mockResolvedValueOnce({ id: "m1", userId: "u1", imageUrl: "http://test/uploads/a.jpg" });
    uploadsUrlToPath.mockReturnValueOnce("/abs/path/a.jpg");
    statMock.mockResolvedValueOnce({});
    const { req, res, getJson } = mockReqRes({ id: "m1" });
    (req as any).protocol = "http";
    (req as any).get = () => "example.com";
    await handler(req, res, jest.fn());
    const json = getJson() as any;
    expect(json.url).toMatch(/^http:\/\/example\.com\/share\/[A-Za-z0-9_-]{32}$/);
    expect(typeof json.expiresInMs).toBe("number");
  });

  it("POST /media/:id/share uses BASE_URL when provided", async () => {
    const handler = getRoute("/media/:id/share", "post");
    mediaFindUnique.mockResolvedValueOnce({ id: "m2", userId: "u1", imageUrl: "http://test/uploads/b.jpg" });
    uploadsUrlToPath.mockReturnValueOnce("/abs/path/b.jpg");
    statMock.mockResolvedValueOnce({});
    const prev = process.env.BASE_URL;
    process.env.BASE_URL = "https://base.example";
    const { req, res, getJson } = mockReqRes({ id: "m2" });
    await handler(req, res, jest.fn());
    const json = getJson() as any;
    expect(json.url).toMatch(/^https:\/\/base\.example\/share\/[A-Za-z0-9_-]{32}$/);
    process.env.BASE_URL = prev;
  });

  it("POST /media/:id/share returns 404 when item not found", async () => {
    const handler = getRoute("/media/:id/share", "post");
    mediaFindUnique.mockResolvedValueOnce(null);
    const { req, res } = mockReqRes({ id: "m404" });
    await handler(req, res, jest.fn());
    expect((res as any).status).toHaveBeenCalledWith(404);
  });

  it("POST /media/:id/share returns 403 if not owner", async () => {
    const handler = getRoute("/media/:id/share", "post");
    mediaFindUnique.mockResolvedValueOnce({ id: "m1", userId: "u2", imageUrl: "u" });
    const { req, res } = mockReqRes({ id: "m1" });
    await handler(req, res, jest.fn());
    expect((res as any).status).toHaveBeenCalledWith(403);
  });

  it("POST /media/:id/share returns 404 if path missing", async () => {
    const handler = getRoute("/media/:id/share", "post");
    mediaFindUnique.mockResolvedValueOnce({ id: "m1", userId: "u1", imageUrl: "x" });
    uploadsUrlToPath.mockReturnValueOnce("");
    const { req, res } = mockReqRes({ id: "m1" });
    await handler(req, res, jest.fn());
    expect((res as any).status).toHaveBeenCalledWith(404);
  });

  it("POST /media/:id/share calls next(err) when stat fails", async () => {
    const handler = getRoute("/media/:id/share", "post");
    mediaFindUnique.mockResolvedValueOnce({ id: "m1", userId: "u1", imageUrl: "http://test/uploads/a.jpg" });
    uploadsUrlToPath.mockReturnValueOnce("/abs/path/a.jpg");
    const err = new Error("stat fail");
    statMock.mockRejectedValueOnce(err);
    const { req, res, next } = mockReqRes({ id: "m1" });
    await handler(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  it("GET /share/:token serves file and sets cache headers", async () => {
    const shareHandler = getRoute("/media/:id/share", "post");
    mediaFindUnique.mockResolvedValueOnce({ id: "m1", userId: "u1", imageUrl: "http://test/uploads/a.webp" });
    uploadsUrlToPath.mockReturnValueOnce("/abs/path/a.webp");
    statMock.mockResolvedValueOnce({});
    const shareReq: any = { params: { id: "m1" }, get: () => "host", protocol: "http" };
    let shareJson: any;
    const shareRes: any = { json: (x: any) => (shareJson = x) };
    await shareHandler(shareReq, shareRes, jest.fn());
    const token = shareJson.url.split("/").pop();
    const handler = getRoute("/share/:token", "get");
    readFileMock.mockResolvedValueOnce(Buffer.from("buf"));
    const { req, res, getHeaders, getBody } = mockReqResBuf({ token });
    await handler(req, res, jest.fn());
    expect(getHeaders()["Content-Type"]).toBe("image/webp");
    expect(getHeaders()["Cache-Control"]).toBe("private, max-age=0, must-revalidate");
    expect(Buffer.isBuffer(getBody())).toBe(true);
  });

  it("GET /share/:token uses default octet-stream for unknown extension", async () => {
    const shareHandler = getRoute("/media/:id/share", "post");
    mediaFindUnique.mockResolvedValueOnce({ id: "m9", userId: "u1", imageUrl: "http://test/uploads/a.bin" });
    uploadsUrlToPath.mockReturnValueOnce("/abs/path/a.bin");
    statMock.mockResolvedValueOnce({});
    const shareReq: any = { params: { id: "m9" }, get: () => "host", protocol: "http" };
    let shareJson: any;
    const shareRes: any = { json: (x: any) => (shareJson = x) };
    await shareHandler(shareReq, shareRes, jest.fn());
    const token = shareJson.url.split("/").pop();
    const handler = getRoute("/share/:token", "get");
    readFileMock.mockResolvedValueOnce(Buffer.from("buf"));
    const { req, res, getHeaders } = mockReqResBuf({ token });
    await handler(req, res, jest.fn());
    expect(getHeaders()["Content-Type"]).toBe("application/octet-stream");
  });

  it("GET /share/:token returns 410 when expired", async () => {
    const shareHandler = getRoute("/media/:id/share", "post");
    mediaFindUnique.mockResolvedValueOnce({ id: "m1", userId: "u1", imageUrl: "http://test/uploads/a.jpg" });
    uploadsUrlToPath.mockReturnValueOnce("/abs/path/a.jpg");
    statMock.mockResolvedValueOnce({});
    const shareReq: any = { params: { id: "m1" }, get: () => "host", protocol: "http" };
    let shareJson: any;
    const shareRes: any = { json: (x: any) => (shareJson = x) };
    await shareHandler(shareReq, shareRes, jest.fn());
    const token = shareJson.url.split("/").pop();
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(Date.now() + 16 * 60 * 1000);
    const handler = getRoute("/share/:token", "get");
    const { req, res } = mockReqRes({ token });
    await handler(req, res, jest.fn());
    expect((res as any).status).toHaveBeenCalledWith(410);
    nowSpy.mockRestore();
  });

  it("GET /share/:token returns 404 for invalid token", async () => {
    const handler = getRoute("/share/:token", "get");
    const { req, res } = mockReqRes({ token: "nope" });
    await handler(req, res, jest.fn());
    expect((res as any).status).toHaveBeenCalledWith(404);
  });
});
