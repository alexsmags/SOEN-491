import type { Request } from "express";

jest.mock("@auth/express", () => ({
  __esModule: true,
  getSession: jest.fn(),
}));

jest.mock("../../auth.js", () => ({
  __esModule: true,
  authConfig: {},
}));

const ORIGINAL_ENV = process.env;

function makeReq(headers: Record<string, string | undefined> = {}): Request {
  return {
    header: (name: string) => headers[name.toLowerCase()],
  } as unknown as Request;
}

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("requireUserId", () => {
  test("returns x-user-id header when not in production", async () => {
    process.env.NODE_ENV = "development";
    const { requireUserId } = await import("../auth");
    const req = makeReq({ "x-user-id": "dev-123" });
    const uid = await requireUserId(req);
    expect(uid).toBe("dev-123");
    const { getSession } = require("@auth/express");
    expect(getSession).not.toHaveBeenCalled();
  });

  test("falls back to session when no x-user-id header in non-production", async () => {
    process.env.NODE_ENV = "test";
    const { requireUserId } = await import("../auth");
    const { getSession } = require("@auth/express") as { getSession: jest.Mock };
    getSession.mockResolvedValue({ user: { id: "sess-456" } });
    const req = makeReq();
    const uid = await requireUserId(req);
    expect(uid).toBe("sess-456");
    expect(getSession).toHaveBeenCalled();
  });

  test("ignores header in production and uses session", async () => {
    process.env.NODE_ENV = "production";
    const { requireUserId } = await import("../auth");
    const { getSession } = require("@auth/express") as { getSession: jest.Mock };
    getSession.mockResolvedValue({ user: { id: "prod-789" } });
    const req = makeReq({ "x-user-id": "should-be-ignored" });
    const uid = await requireUserId(req);
    expect(uid).toBe("prod-789");
    expect(getSession).toHaveBeenCalled();
  });

  test("throws error when no user id in session", async () => {
    process.env.NODE_ENV = "production";
    const { requireUserId } = await import("../auth");
    const { getSession } = require("@auth/express") as { getSession: jest.Mock };
    getSession.mockResolvedValue({});
    const req = makeReq();
    await expect(requireUserId(req)).rejects.toMatchObject({
      message: "unauthorized",
      status: 401,
    });
  });
});
