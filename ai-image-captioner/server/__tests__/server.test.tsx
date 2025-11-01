import type { Request, Response, NextFunction } from "express";
import request from "supertest";

type ExpressWithAppMarker = any;

jest.mock("express", () => {
  const real = jest.requireActual("express") as typeof import("express");
  const factory = () => {
    const app = real();
    (app as any).listen = jest.fn(() => ({ close: jest.fn() }));
    (factory as ExpressWithAppMarker).__app = app;
    return app;
  };
  Object.assign(factory, real);
  return factory;
});

jest.mock(
  "../config/env",
  () => ({
    FRONTEND_ORIGIN: "http://localhost:5173",
    PORT: 4000,
    BASE_URL: "http://localhost:4000",
  }),
  { virtual: true }
);

jest.mock(
  "../middlware/logging",
  () => ({
    logRequests: (_req: Request, _res: Response, next: NextFunction) => next(),
  }),
  { virtual: true }
);

jest.mock(
  "../middlware/uploads",
  () => ({
    uploadStatic: (_req: Request, _res: Response, next: NextFunction) => next(),
  }),
  { virtual: true }
);

const fakeSpec = { openapi: "3.0.0", info: { title: "Test API", version: "1.0.0" } };
jest.mock("../openapi", () => ({ openapiSpec: fakeSpec }));

jest.mock("swagger-ui-express", () => {
  const mw = (_req: Request, _res: Response, next: NextFunction) => next();
  return { __esModule: true, default: { serve: mw, setup: () => mw }, serve: mw, setup: () => mw };
});

jest.mock("../auth", () => {
  const express = jest.requireActual("express") as typeof import("express");
  const router = express.Router();
  router.get("/ping", (_req, res) => res.json({ ok: true, where: "auth" }));
  return { authHandler: router, authConfig: { dummy: true } };
});

jest.mock("../routes/signup", () => {
  const express = jest.requireActual("express") as typeof import("express");
  const router = express.Router();
  router.post("/", (req, res) => res.status(201).json({ created: true, body: req.body ?? null }));
  return { signup: router };
});

jest.mock("../routes/debug", () => {
  const express = jest.requireActual("express") as typeof import("express");
  const router = express.Router();
  router.get("/ping", (_req, res) => res.json({ ok: true, where: "debug" }));
  router.get("/boom", (_req, _res, next) => {
    const err: any = new Error("teapot");
    err.status = 418;
    next(err);
  });
  return { __esModule: true, default: router };
});

jest.mock("../routes/caption", () => {
  const express = jest.requireActual("express") as typeof import("express");
  const router = express.Router();
  router.get("/caption", (_req, res) => res.json({ caption: "ok" }));
  return { __esModule: true, default: router };
});

jest.mock("../routes/media", () => {
  const express = jest.requireActual("express") as typeof import("express");
  const router = express.Router();
  router.get("/media", (_req, res) => res.json({ media: "ok" }));
  return { __esModule: true, default: router };
});

const getSessionMock = jest.fn();
jest.mock("@auth/express", () => ({
  getSession: (...args: any[]) => getSessionMock(...args),
}));

jest.mock("dotenv", () => ({
  config: () => ({ parsed: {} }),
  default: { config: () => ({ parsed: {} }) },
}));

jest.mock("uuid", () => ({
  v4: () => "00000000-0000-4000-8000-000000000000",
}));

import "../server";

const app = (require("express") as ExpressWithAppMarker).__app as import("express").Express;

describe("server.ts (integration via supertest, mocked deps)", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    getSessionMock.mockResolvedValue({ user: null });
  });

  it("exposes an app and stubs listen()", () => {
    const listen = (app as any).listen as jest.Mock;
    expect(typeof app).toBe("function");
    expect(jest.isMockFunction(listen)).toBe(true);
  });

  it("sets CORS headers for allowed origin", async () => {
    const res = await request(app).get("/openapi.json").set("Origin", "http://localhost:5173");
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("serves OpenAPI JSON", async () => {
    const res = await request(app).get("/openapi.json");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeSpec);
  });

  it("mounts /auth routes", async () => {
    const res = await request(app).get("/auth/ping");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, where: "auth" });
  });

  it("mounts /api/signup (POST)", async () => {
    const res = await request(app).post("/api/signup").send({ email: "a@b.com" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ created: true, body: { email: "a@b.com" } });
  });

  it("GET /api/me -> 401 when no session", async () => {
    getSessionMock.mockResolvedValueOnce({ user: null });
    const res = await request(app).get("/api/me");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "unauthorized" });
  });

  it("GET /api/me -> 200 with user when session exists", async () => {
    getSessionMock.mockResolvedValueOnce({ user: { id: "u1", name: "Ada" } });
    const res = await request(app).get("/api/me");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: { id: "u1", name: "Ada" } });
  });

    it("GET /api/logout redirects to /auth/signout with callbackUrl", async () => {
    const res = await request(app).get("/api/logout");
    expect(res.status).toBe(302);

    const loc = res.headers["location"] as string;
    const url = new URL(loc);

    expect(url.protocol).toBe("http:");
    expect(url.hostname).toBe("localhost");
    expect(Number.isNaN(Number(url.port))).toBe(false);

    expect(url.pathname).toBe("/auth/signout");
    expect(url.searchParams.get("callbackUrl")).toBe("http://localhost:5173");
    });



  it("mounts /debug routes", async () => {
    const res = await request(app).get("/debug/ping");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, where: "debug" });
  });

  it("mounts /api caption + media routes", async () => {
    const cap = await request(app).get("/api/caption");
    expect(cap.status).toBe(200);
    expect(cap.body).toEqual({ caption: "ok" });

    const med = await request(app).get("/api/media");
    expect(med.status).toBe(200);
    expect(med.body).toEqual({ media: "ok" });
  });

  it("front-end redirect for non-API paths", async () => {
    const res = await request(app).get("/some/unknown/frontend/path?x=1&y=2");
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(
      "http://localhost:5173/some/unknown/frontend/path?x=1&y=2"
    );
  });

  it("404 JSON for unknown API path", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "not_found", path: "/api/does-not-exist" });
  });

  it("error handler returns proper status/body", async () => {
    const res = await request(app).get("/debug/boom");
    expect(res.status).toBe(418);
    expect(res.body).toEqual({ error: "teapot" });
  });

  it("serves /docs (swagger UI pipeline hooked up)", async () => {
    const res = await request(app).get("/docs");
    expect([200, 204, 302, 304]).toContain(res.status);
  });

  it("does not treat /uploads specially when file missing (falls through to 404)", async () => {
    const res = await request(app).get("/uploads/some-file.png");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "not_found", path: "/uploads/some-file.png" });
  });
});
