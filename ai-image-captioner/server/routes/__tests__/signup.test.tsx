import type { Request, Response, NextFunction } from "express";

const userFindFirst = jest.fn();
const userCreate = jest.fn();

jest.doMock("../../prisma.js", () => ({
  prisma: {
    user: {
      findFirst: userFindFirst,
      create: userCreate,
    },
  },
  __esModule: true,
}));

const argonHash = jest.fn();
jest.doMock("argon2", () => ({
  default: { hash: argonHash },
  hash: argonHash,
  __esModule: true,
}));

class PrismaClientKnownRequestError extends Error {
  code: string;
  constructor(msg: string, code: string) {
    super(msg);
    this.code = code;
  }
}
jest.doMock("@prisma/client", () => ({
  Prisma: { PrismaClientKnownRequestError },
  __esModule: true,
}));

import { signup } from "../../routes/signup";

function getPostHandler() {
  const stack: any[] = (signup as any).stack;
  const layer = stack.find((l) => l.route && l.route.path === "/" && l.route.methods.post);
  if (!layer) throw new Error("POST / handler not found on signup router");
  const handlers = layer.route.stack.map((s: any) => s.handle);
  return handlers[handlers.length - 1];
}

function mockReqRes(body: any) {
  const req = { body } as unknown as Request;

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

describe("signup POST /", () => {
  const handler = getPostHandler();
  let logSpy: jest.SpyInstance;
  let errSpy: jest.SpyInstance;

  beforeAll(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    logSpy.mockRestore();
    errSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    userFindFirst.mockResolvedValue(null);
    userCreate.mockResolvedValue({ id: "u1", email: "a@example.com", name: "Alice" });
    argonHash.mockResolvedValue("argon-hash-123");
  });

  it("400 on invalid body (missing name)", async () => {
    const { req, res, getStatus, getJson } = mockReqRes({
      email: "a@example.com",
      password: "12345678",
    });

    await handler(req, res);

    expect(getStatus()).toBe(400);
    expect(getJson()).toEqual({
      error: "invalid_input",
      detail: expect.stringContaining("expected string"),
    });
    expect(userFindFirst).not.toHaveBeenCalled();
    expect(userCreate).not.toHaveBeenCalled();
  });

  it("400 on invalid email", async () => {
    const { req, res, getStatus, getJson } = mockReqRes({
      name: "Alice",
      email: "not-an-email",
      password: "12345678",
    });

    await handler(req, res);

    expect(getStatus()).toBe(400);
    expect(getJson()).toEqual({ error: "invalid_input", detail: "email_invalid" });
  });

  it("400 on short password", async () => {
    const { req, res, getStatus, getJson } = mockReqRes({
      name: "Alice",
      email: "a@example.com",
      password: "short",
    });

    await handler(req, res);

    expect(getStatus()).toBe(400);
    expect(getJson()).toEqual({ error: "invalid_input", detail: "password_too_short" });
  });

  it("409 when email already exists (case-insensitive)", async () => {
    userFindFirst.mockResolvedValueOnce({ id: "u_existing" });

    const { req, res, getStatus, getJson } = mockReqRes({
      name: "Alice",
      email: "A@Example.com",
      password: "12345678",
    });

    await handler(req, res);

    expect(getStatus()).toBe(409);
    expect(getJson()).toEqual({ error: "email_in_use" });
    expect(userCreate).not.toHaveBeenCalled();
  });

  it("201 on success; hashes password and returns public fields", async () => {
    const { req, res, getStatus, getJson } = mockReqRes({
      name: "Alice",
      email: "A@Example.com",
      password: "12345678",
    });

    await handler(req, res);

    expect(getStatus()).toBe(201);
    expect(getJson()).toEqual({ id: "u1", email: "a@example.com", name: "Alice" });

    const createdArg = userCreate.mock.calls[0]?.[0];
    if (createdArg) {
      expect(createdArg.data).toEqual({
        name: "Alice",
        email: "a@example.com",
        passwordHash: "argon-hash-123",
      });
      expect(createdArg.select).toEqual({ id: true, email: true, name: true });
    }
  });

  it("409 on Prisma P2002 unique constraint (from prisma.user.create)", async () => {
    userCreate.mockRejectedValueOnce(new PrismaClientKnownRequestError("dup", "P2002"));

    const { req, res, getStatus, getJson } = mockReqRes({
      name: "Alice",
      email: "a@example.com",
      password: "12345678",
    });

    await handler(req, res);

    expect(getStatus()).toBe(409);
    expect(getJson()).toEqual({ error: "email_in_use" });
  });

  it("500 on unexpected error (non-production includes detail)", async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    userCreate.mockRejectedValueOnce(Object.assign(new Error("kaboom"), { code: "EFAIL" }));

    const { req, res, getStatus, getJson } = mockReqRes({
      name: "Alice",
      email: "a@example.com",
      password: "12345678",
    });

    await handler(req, res);

    expect(getStatus()).toBe(500);
    expect(getJson()).toEqual({ error: "server_error", detail: "EFAIL" });

    process.env.NODE_ENV = prev;
  });

  it("500 on unexpected error (production hides detail)", async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    userCreate.mockRejectedValueOnce(new Error("kaboom"));

    const { req, res, getStatus, getJson } = mockReqRes({
      name: "Alice",
      email: "a@example.com",
      password: "12345678",
    });

    await handler(req, res);

    expect(getStatus()).toBe(500);
    expect(getJson()).toEqual({ error: "server_error" });

    process.env.NODE_ENV = prev;
  });
});
