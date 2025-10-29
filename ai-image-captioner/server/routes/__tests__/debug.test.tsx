import type { Request, Response, NextFunction } from "express";

jest.doMock("../../config/env.js", () => ({
  BASE_URL: "http://example.test",
  __esModule: true,
}));

const userFindMany = jest.fn();
const sessionFindMany = jest.fn();

jest.doMock("../../prisma.js", () => ({
  prisma: {
    user: { findMany: userFindMany },
    session: { findMany: sessionFindMany },
  },
  __esModule: true,
}));

import router from "../../routes/debug";

function getHandlers(path: string, method: string = "get") {
  const stack: any[] = (router as any).stack;
  const routeLayer = stack.find(
    (l) => l.route && l.route.path === path && l.route.methods[method]
  );
  if (!routeLayer) throw new Error(`Route not found: [${method.toUpperCase()}] ${path}`);

  return routeLayer.route.stack.map((s: any) => s.handle);
}

function mockReqRes(query: any = {}) {
  const req = { query } as unknown as Request;

  let statusCode: number | undefined;
  let jsonBody: any;

  const res = {
    status(code: number) {
      statusCode = code;
      return this as any;
    },
    json(payload: any) {
      jsonBody = payload;
      return this as any;
    },
  } as unknown as Response;

  const next = jest.fn() as unknown as NextFunction;

  return {
    req,
    res,
    next,
    getStatus: () => statusCode,
    getJson: () => jsonBody,
  };
}

describe("debug routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /health -> { ok: true }", async () => {
    const [handler] = getHandlers("/health", "get");
    const { req, res, next, getJson } = mockReqRes();

    await handler(req, res, next);

    expect(getJson()).toEqual({ ok: true });
    expect(next).not.toHaveBeenCalled();
  });

  it("GET /routes -> returns BASE_URL and note", async () => {
    const [handler] = getHandlers("/routes", "get");
    const { req, res, next, getJson } = mockReqRes();

    await handler(req, res, next);

    expect(getJson()).toEqual({
      base: "http://example.test",
      note: "Enable detailed router listing in server.ts if needed.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("GET /users -> queries prisma.user.findMany and returns rows", async () => {
    const rows = [
      { id: "u1", email: "a@example.com", name: "A", passwordHash: "h1" },
      { id: "u2", email: "b@example.com", name: "B", passwordHash: "h2" },
    ];
    userFindMany.mockResolvedValueOnce(rows);

    const [handler] = getHandlers("/users", "get");
    const { req, res, next, getJson } = mockReqRes();

    await handler(req, res, next);

    expect(userFindMany).toHaveBeenCalledWith({
      select: { id: true, email: true, name: true, passwordHash: true },
      orderBy: { email: "asc" },
    });
    expect(getJson()).toEqual(rows);
    expect(next).not.toHaveBeenCalled();
  });

  it("GET /sessions -> queries prisma.session.findMany and returns rows", async () => {
    const rows = [
      { sessionToken: "t3", userId: "u3", expires: new Date("2030-01-01") },
      { sessionToken: "t2", userId: "u2", expires: new Date("2029-01-01") },
    ];
    sessionFindMany.mockResolvedValueOnce(rows);

    const [handler] = getHandlers("/sessions", "get");
    const { req, res, next, getJson } = mockReqRes();

    await handler(req, res, next);

    expect(sessionFindMany).toHaveBeenCalledWith({
      orderBy: { expires: "desc" },
      take: 5,
      select: { sessionToken: true, userId: true, expires: true },
    });
    expect(getJson()).toEqual(rows);
    expect(next).not.toHaveBeenCalled();
  });
});
