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
  uploadSingle: () => (_req: any, _res: any, next: any) => next(),
  makePublicUploadUrl,
  uploadsUrlToPath,
  __esModule: true,
}));

const unlinkMock = jest.fn(async () => {});
jest.doMock("fs/promises", () => ({
  default: { unlink: unlinkMock },
  unlink: unlinkMock,
  __esModule: true,
}));

import router from "../../routes/media";

function getRoute(path: string, method: string = "get") {
  const stack: any[] = (router as any).stack;
  const layer = stack.find(
    (l) => l.route && l.route.path === path && l.route.methods[method]
  );
  if (!layer) throw new Error(`Route not found: ${method.toUpperCase()} ${path}`);
  const handlers = layer.route.stack.map((s: any) => s.handle);
  return handlers[handlers.length - 1];
}

function mockReqRes(params: any = {}, body: any = {}, query: any = {}) {
  const req = { params, body, query } as unknown as Request;
  let statusCode: number | undefined;
  let jsonBody: any;
  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: any) {
      jsonBody = payload;
      return this;
    },
  } as unknown as Response;
  const next = jest.fn() as unknown as NextFunction;
  return { req, res, next, getStatus: () => statusCode, getJson: () => jsonBody };
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

  // GET /media
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

  // GET /media/:id
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
    const { req, res, getStatus, getJson } = mockReqRes({ id: "m1" });
    await handler(req, res, jest.fn());
    expect(getStatus()).toBe(403);
    expect(getJson()).toEqual({ error: "forbidden", reason: "not_owner" });
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

  // POST /media
  it("POST /media creates new media item (basic)", async () => {
    const handler = getRoute("/media", "post");
    const created = { id: "m1" };
    mediaCreate.mockResolvedValueOnce(created);
    const body = { caption: "hi" };
    const req: any = { body, file: { filename: "a.jpg" } };
    const res: any = { status: jest.fn(() => res), json: jest.fn() };
    const next = jest.fn();

    await handler(req, res, next);
    expect(mediaCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "u1",
        caption: "hi",
        imageUrl: "http://test/uploads/a.jpg",
      }),
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: "m1", item: created });
  });

  it("POST /media parses keywords from JSON string and preserves tone", async () => {
    const handler = getRoute("/media", "post");
    const created = { id: "m2" };
    mediaCreate.mockResolvedValueOnce(created);
    const req: any = {
      body: {
        caption: "hello",
        tone: "playful",
        keywords: '["one","two"]',
      },
      file: { filename: "b.png" },
    };
    const res: any = { status: jest.fn(() => res), json: jest.fn() };

    await handler(req, res, jest.fn());
    expect(mediaCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "u1",
        caption: "hello",
        tone: "playful",
        keywords: ["one", "two"],
        imageUrl: "http://test/uploads/b.png",
      }),
    });
  });

  it("POST /media handles invalid keywords JSON -> empty array", async () => {
    const handler = getRoute("/media", "post");
    const created = { id: "m3" };
    mediaCreate.mockResolvedValueOnce(created);
    const req: any = {
      body: {
        caption: "hi",
        keywords: 'not-json',
      },
      file: { filename: "c.png" },
    };
    const res: any = { status: jest.fn(() => res), json: jest.fn() };

    await handler(req, res, jest.fn());
    expect(mediaCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        keywords: [],
      }),
    });
  });

  it("POST /media allows keywords as an existing array", async () => {
    const handler = getRoute("/media", "post");
    const created = { id: "m4" };
    mediaCreate.mockResolvedValueOnce(created);
    const req: any = {
      body: {
        caption: "hi",
        keywords: ["alpha", "beta"],
      },
      file: { filename: "d.png" },
    };
    const res: any = { status: jest.fn(() => res), json: jest.fn() };

    await handler(req, res, jest.fn());
    expect(mediaCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        keywords: ["alpha", "beta"],
      }),
    });
  });

  it("POST /media returns 400 on invalid body (caption missing)", async () => {
    const handler = getRoute("/media", "post");
    const req: any = {
      body: { tone: "x" },
      file: { filename: "a.jpg" },
    };
    const res: any = { status: jest.fn(() => res), json: jest.fn() };

    await handler(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "invalid_body" })
    );
    expect(mediaCreate).not.toHaveBeenCalled();
  });

  it("POST /media returns 400 when file is missing", async () => {
    const handler = getRoute("/media", "post");
    const req: any = { body: { caption: "hi" } };
    const res: any = { status: jest.fn(() => res), json: jest.fn() };

    await handler(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "file_required" });
  });

  it("POST /media calls next(err) when create fails", async () => {
    const handler = getRoute("/media", "post");
    const err = new Error("create failed");
    mediaCreate.mockRejectedValueOnce(err);
    const req: any = { body: { caption: "x" }, file: { filename: "z.jpg" } };
    const res: any = { status: jest.fn(() => res), json: jest.fn() };
    const next = jest.fn();

    await handler(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  // PUT /media/:id
  it("PUT /media/:id updates allowed fields", async () => {
    const handler = getRoute("/media/:id", "put");
    mediaFindUnique.mockResolvedValueOnce({ id: "m1", userId: "u1" });
    mediaUpdate.mockResolvedValueOnce({ id: "m1" });

    const { req, res, getJson } = mockReqRes(
      { id: "m1" },
      { caption: "new cap", align: "center" }
    );
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

    const { req, res } = mockReqRes(
      { id: "m1" },
      { caption: "ok", foo: "bar", textColor: "#fff" }
    );
    await handler(req, res, jest.fn());

    expect(mediaUpdate).toHaveBeenCalledWith({
      where: { id: "m1" },
      data: { caption: "ok", textColor: "#fff" },
    });
  });

  it("PUT /media/:id returns 404 when not found", async () => {
    const handler = getRoute("/media/:id", "put");
    mediaFindUnique.mockResolvedValueOnce(null);

    const { req, res, getStatus, getJson } = mockReqRes(
      { id: "m404" },
      { caption: "anything" }
    );
    await handler(req, res, jest.fn());
    expect(getStatus()).toBe(404);
    expect(getJson()).toEqual({ error: "not_found" });
  });

  it("PUT /media/:id returns 403 when not owner", async () => {
    const handler = getRoute("/media/:id", "put");
    mediaFindUnique.mockResolvedValueOnce({ id: "m1", userId: "u2" });

    const { req, res, getStatus, getJson } = mockReqRes(
      { id: "m1" },
      { caption: "nope" }
    );
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

  // DELETE /media/:id
  it("DELETE /media/:id removes media and unlinks file", async () => {
    const handler = getRoute("/media/:id", "delete");
    mediaFindUnique.mockResolvedValueOnce({
      id: "m1",
      userId: "u1",
      imageUrl: "http://test/uploads/a.jpg",
    });
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
    mediaFindUnique.mockResolvedValueOnce({
      id: "m1",
      userId: "u2",
      imageUrl: "http://test/uploads/a.jpg",
    });

    const { req, res, getStatus, getJson } = mockReqRes({ id: "m1" });
    await handler(req, res, jest.fn());
    expect(getStatus()).toBe(403);
    expect(getJson()).toEqual({ error: "forbidden", reason: "not_owner" });
  });

  it("DELETE /media/:id skips unlink if path is null/undefined", async () => {
    const handler = getRoute("/media/:id", "delete");
    mediaFindUnique.mockResolvedValueOnce({
      id: "m1",
      userId: "u1",
      imageUrl: "http://test/uploads/a.jpg",
    });
    mediaDelete.mockResolvedValueOnce({});
    uploadsUrlToPath.mockReturnValueOnce(null as any);

    const { req, res } = mockReqRes({ id: "m1" });
    await handler(req, res, jest.fn());
    expect(unlinkMock).not.toHaveBeenCalled();
  });

  it("DELETE /media/:id ignores ENOENT on unlink", async () => {
    const handler = getRoute("/media/:id", "delete");
    mediaFindUnique.mockResolvedValueOnce({
      id: "m1",
      userId: "u1",
      imageUrl: "http://test/uploads/a.jpg",
    });
    mediaDelete.mockResolvedValueOnce({});
    uploadsUrlToPath.mockReturnValueOnce("/abs/path/a.jpg");
    unlinkMock.mockRejectedValueOnce(Object.assign(new Error("no file"), { code: "ENOENT" }));

    const { req, res } = mockReqRes({ id: "m1" });
    await handler(req, res, jest.fn());
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("DELETE /media/:id warns on unexpected unlink error", async () => {
    const handler = getRoute("/media/:id", "delete");
    mediaFindUnique.mockResolvedValueOnce({
      id: "m1",
      userId: "u1",
      imageUrl: "http://test/uploads/a.jpg",
    });
    mediaDelete.mockResolvedValueOnce({});
    uploadsUrlToPath.mockReturnValueOnce("/abs/path/a.jpg");
    unlinkMock.mockRejectedValueOnce(Object.assign(new Error("EPERM"), { code: "EPERM" }));

    const { req, res } = mockReqRes({ id: "m1" });
    await handler(req, res, jest.fn());
    expect(warnSpy).toHaveBeenCalledWith("[media][delete] unlink failed:", expect.any(Error));
  });

  it("DELETE /media/:id calls next(err) when delete fails", async () => {
    const handler = getRoute("/media/:id", "delete");
    mediaFindUnique.mockResolvedValueOnce({
      id: "m1",
      userId: "u1",
      imageUrl: "http://test/uploads/a.jpg",
    });
    const err = new Error("delete failed");
    mediaDelete.mockRejectedValueOnce(err);

    const { req, res, next } = mockReqRes({ id: "m1" });
    await handler(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});
