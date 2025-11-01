import path from "path";

jest.mock("dotenv", () => {
  const fn = jest.fn(); // no-op
  return { __esModule: true, default: { config: fn }, config: fn };
});

const ORIGINAL_ENV = process.env;

async function loadEnvModule() {
  jest.resetModules();
  return await import("../env");
}

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.PORT;
  delete process.env.ORIGIN;
  delete process.env.BASE_URL;
  delete process.env.UPLOAD_DIR;
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("env module", () => {
  test("defaults when no env vars are set", async () => {
    const mod = await loadEnvModule();

    expect(mod.PORT).toBe(5000);
    expect(mod.FRONTEND_ORIGIN).toBe("http://localhost:5173");
    expect(mod.BASE_URL).toBe("http://localhost:5000");
    expect(mod.UPLOAD_DIR).toBe(
      path.resolve(path.join(process.cwd(), "uploads"))
    );
  });

  test("respects explicit PORT and ORIGIN", async () => {
    process.env.PORT = "8080";
    process.env.ORIGIN = "https://app.example.com";
    const mod = await loadEnvModule();

    expect(mod.PORT).toBe(8080);
    expect(mod.FRONTEND_ORIGIN).toBe("https://app.example.com");
    expect(mod.BASE_URL).toBe("http://localhost:8080");
  });

  test("BASE_URL env overrides and trims trailing slash", async () => {
    process.env.BASE_URL = "https://api.example.com/";
    const mod = await loadEnvModule();

    expect(mod.BASE_URL).toBe("https://api.example.com");
  });

  test("UPLOAD_DIR env overrides and resolves absolute path", async () => {
    process.env.UPLOAD_DIR = "data/uploads";
    const mod = await loadEnvModule();

    expect(mod.UPLOAD_DIR).toBe(
      path.resolve(path.join(process.cwd(), "data/uploads"))
    );
  });

  describe("makePublicUrl", () => {
    test("prefixes a leading slash when missing", async () => {
      process.env.BASE_URL = "https://api.example.com";
      const mod = await loadEnvModule();

      expect(mod.makePublicUrl("v1/ping")).toBe(
        "https://api.example.com/v1/ping"
      );
    });

    test("keeps single leading slash (no double slashes)", async () => {
      process.env.BASE_URL = "https://api.example.com/";
      const mod = await loadEnvModule();

      expect(mod.makePublicUrl("/v1/ping")).toBe(
        "https://api.example.com/v1/ping"
      );
    });

    test("works with nested paths", async () => {
      process.env.BASE_URL = "http://localhost:7000";
      const mod = await loadEnvModule();

      expect(mod.makePublicUrl("uploads/images/a.png")).toBe(
        "http://localhost:7000/uploads/images/a.png"
      );
    });
  });

  describe("getUploadBasename", () => {
    test("extracts name after /uploads/ for same-origin absolute URL", async () => {
      process.env.BASE_URL = "http://localhost:9000";
      const mod = await loadEnvModule();

      const url = "http://localhost:9000/uploads/avatar.png";
      expect(mod.getUploadBasename(url)).toBe("avatar.png");
    });

    test("extracts nested path after /uploads/ (keeps subdirs)", async () => {
      process.env.BASE_URL = "https://api.example.com";
      const mod = await loadEnvModule();

      const url = "https://cdn.example.com/uploads/user/123/photo.jpg";
      expect(mod.getUploadBasename(url)).toBe("user/123/photo.jpg");
    });

    test("handles relative /uploads/* paths against BASE_URL", async () => {
      process.env.BASE_URL = "https://api.example.com";
      const mod = await loadEnvModule();

      expect(mod.getUploadBasename("/uploads/x/y/z.png")).toBe("x/y/z.png");
    });

    test("falls back to basename when no /uploads/ in path", async () => {
      const mod = await loadEnvModule();

      const url = "https://example.com/assets/images/photo-final.jpeg";
      expect(mod.getUploadBasename(url)).toBe("photo-final.jpeg");
    });

    test("handles non-URL strings by regex first, then basename", async () => {
      const mod = await loadEnvModule();

      expect(mod.getUploadBasename("not-a-url /uploads/abc/file.txt")).toBe(
        "abc/file.txt"
      );

      expect(mod.getUploadBasename("weird\\local\\path\\image.gif")).toBe(
        "image.gif"
      );
    });
  });
});
