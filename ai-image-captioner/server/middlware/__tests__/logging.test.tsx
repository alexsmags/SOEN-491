// middlware/__tests__/logging.test.tsx
import { EventEmitter } from "events";
import type { Request, Response, NextFunction } from "express";

function makeReq(method: string, url: string): Request {
  return { method, originalUrl: url } as unknown as Request;
}

describe("logRequests", () => {
  let next: NextFunction;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    next = jest.fn();
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  test("logs request line and calls next", async () => {
    const { logRequests } = await import("../logging");
    const req = makeReq("GET", "/foo");
    const res: any = new EventEmitter();
    res.getHeader = jest.fn();

    logRequests(req, res as unknown as Response, next);

    expect(logSpy).toHaveBeenCalledWith("[REQ] GET /foo");
    expect(next).toHaveBeenCalled();
  });

  test("logs set-cookie on finish for credentials callback", async () => {
    const { logRequests } = await import("../logging");
    const req = makeReq("POST", "/auth/callback/credentials");
    const res: any = new EventEmitter();
    res.getHeader = jest.fn().mockReturnValue(["a=b; Path=/"]);

    logRequests(req, res as unknown as Response, next);
    (res as EventEmitter).emit("finish");

    expect(res.getHeader).toHaveBeenCalledWith("set-cookie");
    expect(logSpy).toHaveBeenCalledWith("[auth][callback][set-cookie]:", ["a=b; Path=/"]);
  });

  test("does not log set-cookie for non-credentials paths", async () => {
    const { logRequests } = await import("../logging");
    const req = makeReq("POST", "/auth/callback/google");
    const res: any = new EventEmitter();
    res.getHeader = jest.fn().mockReturnValue(["a=b; Path=/"]);

    logRequests(req, res as unknown as Response, next);
    (res as EventEmitter).emit("finish");

    const calls = logSpy.mock.calls.map((c) => c[0]);
    expect(calls.some((m) => String(m).startsWith("[auth][callback][set-cookie]:"))).toBe(false);
  });
});
