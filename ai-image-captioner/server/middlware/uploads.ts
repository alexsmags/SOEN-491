import express from "express";
import fs from "fs";
import path from "path";
import multer, { Multer } from "multer";
import { v4 as uuid } from "uuid";
import { UPLOAD_DIR, BASE_URL } from "../config/env.js";

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export const uploadStatic = express.static(UPLOAD_DIR, {
  maxAge: 0,
  immutable: false,
  etag: true,
  setHeaders: (res) => {
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  },
});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = (path.extname(file.originalname || "") || ".jpg").toLowerCase();
    cb(null, `${uuid()}${ext}`);
  },
});

export const upload: Multer = multer({ storage });

export const memUpload: Multer = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

export const uploadSingle = (field: string) => upload.single(field);
export const uploadArray = (field: string, maxCount: number = 10) =>
  upload.array(field, maxCount);
export const uploadFields = (fields: { name: string; maxCount?: number }[]) =>
  upload.fields(fields);

export function makePublicUploadUrl(filename: string): string {
  const base = (BASE_URL || "").replace(/\/+$/, "");
  const name = filename.startsWith("/") ? filename.slice(1) : filename;
  return `${base}/uploads/${name}`;
}

export function uploadsUrlToPath(imageUrl: string): string | null {
  try {
    if (!imageUrl || typeof imageUrl !== "string") return null;

    let pathname = imageUrl;
    if (/^https?:\/\//i.test(imageUrl)) {
      const u = new URL(imageUrl);
      pathname = u.pathname;
    }

    if (!pathname.startsWith("/uploads/")) return null;

    const fname = path.basename(pathname);
    if (!fname) return null;

    const abs = path.resolve(UPLOAD_DIR, fname);
    const root = path.resolve(UPLOAD_DIR);
    if (!abs.startsWith(root)) return null;

    return abs;
  } catch {
    return null;
  }
}
