import { Router } from "express";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import type { Request } from "express";
import { prisma } from "../prisma.js";
import { requireUserId } from "../middlware/auth.js";
import {
  uploadSingle,
  makePublicUploadUrl,
  uploadsUrlToPath,
} from "../middlware/uploads.js";

const router = Router();

const pageQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(12),
});

const createBodySchema = z.object({
  caption: z.string().min(1),
  tone: z.string().optional(),
  keywords: z
    .preprocess((v) => {
      if (typeof v === "string") {
        try {
          return JSON.parse(v);
        } catch {
          return [];
        }
      }
      return v;
    }, z.array(z.string()).optional())
    .optional(),
});

function toPublicPathFromDiskPath(_req: Request, diskPath: string) {
  const filename = diskPath.split("/").pop() || diskPath;
  return makePublicUploadUrl(filename);
}

router.get("/media", async (req, res, next) => {
  try {
    const userId = await requireUserId(req);
    const { page, pageSize } = pageQuerySchema.parse(req.query);

    const [items, total] = await Promise.all([
      prisma.media.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.media.count({ where: { userId } }),
    ]);

    const hasNext = page * pageSize < total;
    res.json({ items, total, hasNext, page, pageSize });
  } catch (err) {
    next(err);
  }
});

router.get("/media/:id", async (req, res, next) => {
  try {
    const userId = await requireUserId(req);
    const { id } = req.params;

    const item = await prisma.media.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: "not_found" });
    if (item.userId !== userId) {
      return res.status(403).json({ error: "forbidden", reason: "not_owner" });
    }

    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.post("/media", uploadSingle("file"), async (req, res, next) => {
  try {
    const userId = await requireUserId(req);

    const parsed = createBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "invalid_body", details: parsed.error.flatten() });
    }

    if (!req.file) return res.status(400).json({ error: "file_required" });

    const imageUrl = makePublicUploadUrl(req.file.filename);

    const item = await prisma.media.create({
      data: {
        userId,
        imageUrl,
        caption: parsed.data.caption,
        tone: parsed.data.tone ?? null,
        keywords: parsed.data.keywords ?? undefined,
      },
    });

    res.status(201).json({ id: item.id, item });
  } catch (err) {
    next(err);
  }
});

router.put("/media/:id", async (req, res, next) => {
  try {
    const userId = await requireUserId(req);
    const { id } = req.params;

    const exists = await prisma.media.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ error: "not_found" });
    if (exists.userId !== userId) {
      return res.status(403).json({ error: "forbidden", reason: "not_owner" });
    }

    const updatable = [
      "caption",
      "tone",
      "keywords",
      "fontFamily",
      "fontSize",
      "textColor",
      "align",
      "showBg",
      "bgColor",
      "bgOpacity",
      "posX",
      "posY",
    ] as const;

    const data: Record<string, any> = {};
    for (const k of updatable) {
      if (k in req.body) data[k] = req.body[k];
    }

    const item = await prisma.media.update({ where: { id }, data });
    res.json({ id: item.id, item });
  } catch (err) {
    next(err);
  }
});

router.delete("/media/:id", async (req, res, next) => {
  try {
    const userId = await requireUserId(req);
    const { id } = req.params;

    const item = await prisma.media.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: "not_found" });
    if (item.userId !== userId) {
      return res.status(403).json({ error: "forbidden", reason: "not_owner" });
    }

    await prisma.media.delete({ where: { id } });

    const absPath = uploadsUrlToPath(item.imageUrl);
    if (absPath) {
      try {
        await fs.unlink(absPath);
      } catch (e: any) {
        if (e?.code !== "ENOENT") {
          console.warn("[media][delete] unlink failed:", e);
        }
      }
    }

    res.json({ ok: true, id });
  } catch (err) {
    next(err);
  }
});

const SHARE_TTL_MS = 15 * 60 * 1000;

const shareMap = new Map<
  string,
  { userId: string; mediaId: string; filePath: string; expiresAt: number }
>();

function signToken() {
  return crypto.randomBytes(24).toString("base64url");
}

function guessMimeFromPath(p: string) {
  const ext = path.extname(p).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "application/octet-stream";
}

router.get("/media/:id/file", async (req, res, next) => {
  try {
    const userId = await requireUserId(req);
    const { id } = req.params;

    const item = await prisma.media.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: "not_found" });
    if (item.userId !== userId) {
      return res.status(403).json({ error: "forbidden", reason: "not_owner" });
    }

    const filePath = uploadsUrlToPath(item.imageUrl);
    if (!filePath) return res.status(404).json({ error: "file_missing" });

    const buf = await fs.readFile(filePath);
    res.setHeader("Content-Type", guessMimeFromPath(filePath));
    res.send(buf);
  } catch (err) {
    next(err);
  }
});

router.post("/media/:id/share", async (req, res, next) => {
  try {
    const userId = await requireUserId(req);
    const { id } = req.params;

    const item = await prisma.media.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: "not_found" });
    if (item.userId !== userId) {
      return res.status(403).json({ error: "forbidden", reason: "not_owner" });
    }

    const filePath = uploadsUrlToPath(item.imageUrl);
    if (!filePath) return res.status(404).json({ error: "file_missing" });

    await fs.stat(filePath);

    const token = signToken();
    shareMap.set(token, {
      userId,
      mediaId: id,
      filePath,
      expiresAt: Date.now() + SHARE_TTL_MS,
    });

    const base =
      process.env.BASE_URL ?? `${req.protocol}://${req.get("host")}`;
    const url = `${base}/share/${token}`;
    res.json({ url, expiresInMs: SHARE_TTL_MS });
  } catch (err) {
    next(err);
  }
});

router.get("/share/:token", async (req, res, next) => {
  try {
    const token = req.params.token;
    const row = shareMap.get(token);
    if (!row) return res.status(404).json({ error: "invalid_token" });

    if (Date.now() > row.expiresAt) {
      shareMap.delete(token);
      return res.status(410).json({ error: "expired" });
    }

    const buf = await fs.readFile(row.filePath);
    res.setHeader("Cache-Control", "private, max-age=0, must-revalidate");
    res.setHeader("Content-Type", guessMimeFromPath(row.filePath));
    res.send(buf);
  } catch (err) {
    next(err);
  }
});

export default router;
