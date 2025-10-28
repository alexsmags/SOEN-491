import { Router } from "express";
import { z } from "zod";
import fs from "fs/promises";
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

export default router;
