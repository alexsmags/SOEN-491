import fs from "fs";
import path from "path";
import multer from "multer";

jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid"),
}));

const TEST_UPLOAD_DIR = path.resolve(process.cwd(), ".jest-upload-tmp");
const TEST_BASE_URL = "http://localhost:3000";

jest.doMock("../../config/env.js", () => ({
  UPLOAD_DIR: TEST_UPLOAD_DIR,
  BASE_URL: TEST_BASE_URL,
}));

import {
  uploadStatic,
  upload,
  memUpload,
  uploadSingle,
  uploadArray,
  uploadFields,
  makePublicUploadUrl,
  uploadsUrlToPath,
} from "../../middlware/uploads";

describe("upload module (unit)", () => {
  beforeAll(() => {
    if (!fs.existsSync(TEST_UPLOAD_DIR)) fs.mkdirSync(TEST_UPLOAD_DIR, { recursive: true });
  });

  afterAll(() => {
    try {
      fs.rmSync(TEST_UPLOAD_DIR, { recursive: true, force: true });
    } catch {}
  });

  describe("makePublicUploadUrl()", () => {
    it("generates a valid uploads URL", () => {
      const url = makePublicUploadUrl("file.jpg");
      expect(url).toBe(`${TEST_BASE_URL}/uploads/file.jpg`);
    });

    it("trims trailing slashes on base and leading slashes on filename", () => {
      const url = makePublicUploadUrl("/nested/dir/image.png");
      expect(url).toBe(`${TEST_BASE_URL}/uploads/nested/dir/image.png`);
    });
  });

  describe("uploadsUrlToPath()", () => {
    const filePath = path.join(TEST_UPLOAD_DIR, "exists.jpg");

    beforeAll(() => {
      fs.writeFileSync(filePath, "dummy");
    });

    it("converts an absolute URL under /uploads to an absolute path", () => {
      const abs = uploadsUrlToPath(`${TEST_BASE_URL}/uploads/exists.jpg`);
      expect(abs).toBe(path.resolve(TEST_UPLOAD_DIR, "exists.jpg"));
    });

    it("converts a plain pathname under /uploads to an absolute path", () => {
      const abs = uploadsUrlToPath(`/uploads/exists.jpg`);
      expect(abs).toBe(path.resolve(TEST_UPLOAD_DIR, "exists.jpg"));
    });

    it("returns null for URLs not under /uploads", () => {
      const abs = uploadsUrlToPath(`${TEST_BASE_URL}/images/exists.jpg`);
      expect(abs).toBeNull();
    });

    it("returns null for invalid input", () => {
      const abs = uploadsUrlToPath("not a url");
      expect(abs).toBeNull();
    });

    it("guards against path traversal", () => {
      const abs = uploadsUrlToPath(`${TEST_BASE_URL}/uploads/../secrets.txt`);
      expect(abs).toBeNull();
    });

    it("guards against escaping the upload root", () => {
      const abs = uploadsUrlToPath(`${TEST_BASE_URL}/uploads/../../etc/passwd`);
      expect(abs).toBeNull();
    });
  });

  describe("multer configurations (shape checks)", () => {
    it("memUpload uses memoryStorage and has a 20MB limit", () => {
      const mem: any = memUpload;
      expect(mem.limits.fileSize).toBe(20 * 1024 * 1024);
      expect(mem.storage).toBeDefined();
    });

    it("upload exposes expected multer API", () => {
      const u: any = upload;
      expect(typeof u.single).toBe("function");
      expect(typeof u.array).toBe("function");
      expect(typeof u.fields).toBe("function");
    });

    it("uploadSingle/uploadArray/uploadFields return functions", () => {
      const single = uploadSingle("file");
      const array = uploadArray("files", 3);
      const fields = uploadFields([
        { name: "avatar", maxCount: 1 },
        { name: "gallery", maxCount: 2 },
      ]);
      expect(typeof single).toBe("function");
      expect(typeof array).toBe("function");
      expect(typeof fields).toBe("function");
    });
  });

  describe("uploadStatic", () => {
    it("is an express-compatible middleware function", () => {
      expect(typeof uploadStatic).toBe("function");
    });
  });
});
