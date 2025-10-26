import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import multer from "multer";
import { v4 as uuid } from "uuid";
import swaggerUi from "swagger-ui-express";

import { authHandler, authConfig } from "./auth.js";
import { signup } from "./routes/signup.js";
import { getSession } from "@auth/express";
import { prisma } from "./prisma.js";
import { Prisma } from "@prisma/client";
import { openapiSpec } from "./openapi.js";

dotenv.config();

const app = express();
app.set("trust proxy", true);

const PORT = Number(process.env.PORT ?? 5000);
const FRONTEND_ORIGIN = process.env.ORIGIN ?? "http://localhost:5173";
const BASE_URL = (process.env.BASE_URL ?? `http://localhost:${PORT}`).replace(/\/$/, "");
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"));

const makePublicUrl = (p: string) =>
  new URL(p.startsWith("/") ? p : `/${p}`, BASE_URL).href;

const getUploadBasename = (imageUrl: string) => {
  try {
    const u = new URL(imageUrl, BASE_URL);
    const m = u.pathname.match(/\/uploads\/(.+)$/);
    return m ? m[1] : path.basename(imageUrl);
  } catch {
    const m = imageUrl.match(/\/uploads\/(.+)$/);
    return m ? m[1] : path.basename(imageUrl);
  }
};

// Middleware
app.use(
  cors({
    origin: [FRONTEND_ORIGIN, "http://127.0.0.1:5173"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});
app.use((req, res, next) => {
  res.on("finish", () => {
    if (req.originalUrl.startsWith("/auth/callback/credentials")) {
      console.log("[auth][callback][set-cookie]:", res.getHeader("set-cookie"));
    }
  });
  next();
});

// Static uploads
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    maxAge: "1d",
    immutable: true,
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
    },
  })
);

// Multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "") || ".jpg";
    cb(null, `${uuid()}${ext}`);
  },
});
const upload = multer({ storage });

// Auth helper
async function requireUserId(req: express.Request): Promise<string> {
  const dev = req.header("x-user-id");
  if (dev) return dev;

  const session = await getSession(req, authConfig);
  const uid = (session as any)?.user?.id as string | undefined;
  if (!uid) {
    const err: any = new Error("unauthorized");
    err.status = 401;
    throw err;
  }
  return uid;
}

// Health / Debug
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/debug/routes", (_req, res) => {
  const routes: string[] = [];
  const stack = (app as any)._router?.stack ?? [];
  for (const layer of stack) {
    if (layer.route) {
      const p = layer.route?.path;
      const methods = Object.keys(layer.route?.methods ?? {})
        .join(",")
        .toUpperCase();
      routes.push(`${methods} ${p}`);
    } else if (layer.name === "router" && layer.handle?.stack) {
      for (const r of layer.handle.stack) {
        if (r.route) {
          const p = r.route.path;
          const methods = Object.keys(r.route.methods ?? {})
            .join(",")
            .toUpperCase();
          routes.push(`${methods} /auth${p}`);
        }
      }
    }
  }
  res.json({
    routes,
    env: { ORIGIN: process.env.ORIGIN, AUTH_URL: process.env.AUTH_URL, BASE_URL },
  });
});

app.get("/debug/users", async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, passwordHash: true },
    orderBy: { email: "asc" },
  });
  res.json(users);
});

app.get("/debug/sessions", async (_req, res) => {
  const sessions = await prisma.session.findMany({
    orderBy: { expires: "desc" },
    take: 5,
    select: { sessionToken: true, userId: true, expires: true },
  });
  res.json(sessions);
});

app.get("/debug/whoami", async (req, res) => {
  const session = await getSession(req, authConfig);
  res.json({ session });
});

// Auth / Signup 
app.use("/auth", authHandler);
app.use("/api/signup", signup);

app.get("/api/me", async (req, res) => {
  const session = await getSession(req, authConfig);
  if (!session?.user) return res.status(401).json({ error: "unauthorized" });
  res.json({ user: session.user });
});

app.get("/api/logout", (req, res) => {
  const base = process.env.AUTH_URL ?? `http://localhost:${PORT}`;
  const fe = FRONTEND_ORIGIN;
  res.redirect(`${base}/auth/signout?callbackUrl=${encodeURIComponent(fe)}`);
});

// MEDIA PERSISTENCE ROUTES
function toKeywordsInput(
  raw: unknown
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed == null ? Prisma.DbNull : (parsed as Prisma.InputJsonValue);
    } catch {
      return [] as unknown as Prisma.InputJsonValue;
    }
  }
  if (raw == null) return Prisma.DbNull;
  return raw as Prisma.InputJsonValue;
}

app.post("/api/media", upload.single("file"), async (req, res, next) => {
  try {
    const userId = await requireUserId(req);
    if (!req.file) return res.status(400).json({ error: "file is required" });

    const {
      caption = "",
      tone = null,
      keywords = "[]",
      fontFamily = "Arial",
      fontSize = 24,
      textColor = "#FFFFFF",
      align = "center",
      showBg = true,
      bgColor = "#3B3F4A",
      bgOpacity = 0.8,
      posX = 120,
      posY = 120,
    } = req.body;

    const filename = req.file.filename;
    const imageUrl = makePublicUrl(`/uploads/${filename}`);

    const media = await prisma.media.create({
      data: {
        userId,
        imageUrl,
        caption,
        tone,
        keywords: toKeywordsInput(keywords),
        fontFamily,
        fontSize: Number(fontSize),
        textColor,
        align,
        showBg: showBg === true || showBg === "true",
        bgColor,
        bgOpacity: Number(bgOpacity),
        posX: Number(posX),
        posY: Number(posY),
      },
    });

    res.json(media);
  } catch (err) {
    next(err);
  }
});

app.get("/api/media", async (req, res, next) => {
  try {
    const userId = await requireUserId(req);
    const { tone, keyword, q, from, to, page = "1", pageSize = "24" } = req.query;

    const where: any = { userId };
    if (tone) where.tone = String(tone);

    const searchTerm = (q as string) || (keyword as string);
    if (searchTerm) {
      where.caption = { contains: String(searchTerm), mode: "insensitive" };
    }

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(String(from));
      if (to) where.createdAt.lte = new Date(String(to));
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const take = Math.min(100, Math.max(1, Number(pageSize) || 24));
    const skip = (pageNum - 1) * take;

    const [items, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.media.count({ where }),
    ]);

    const norm = items.map((m) => {
      const url =
        typeof m.imageUrl === "string" && m.imageUrl.startsWith("/uploads/")
          ? makePublicUrl(m.imageUrl)
          : (m.imageUrl as any);
      return { ...m, imageUrl: url };
    });

    res.json({ items: norm, total, page: pageNum, pageSize: take });
  } catch (err) {
    next(err);
  }
});

app.get("/api/media/:id", async (req, res, next) => {
  try {
    const userId = await requireUserId(req);
    const media = await prisma.media.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!media) return res.status(404).json({ error: "not_found" });

    const url =
      typeof media.imageUrl === "string" && media.imageUrl.startsWith("/uploads/")
        ? makePublicUrl(media.imageUrl)
        : (media.imageUrl as any);

    res.json({ ...media, imageUrl: url });
  } catch (err) {
    next(err);
  }
});

app.put("/api/media/:id", async (req, res, next) => {
  try {
    const userId = await requireUserId(req);
    const current = await prisma.media.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!current) return res.status(404).json({ error: "not_found" });

    const {
      caption,
      tone,
      keywords,
      fontFamily,
      fontSize,
      textColor,
      align,
      showBg,
      bgColor,
      bgOpacity,
      posX,
      posY,
    } = req.body ?? {};

    const data: any = {
      caption: caption ?? current.caption,
      tone: tone ?? current.tone,
      fontFamily: fontFamily ?? current.fontFamily,
      fontSize: fontSize != null ? Number(fontSize) : current.fontSize,
      textColor: textColor ?? current.textColor,
      align: align ?? current.align,
      showBg: showBg != null ? (showBg === true || showBg === "true") : current.showBg,
      bgColor: bgColor ?? current.bgColor,
      bgOpacity: bgOpacity != null ? Number(bgOpacity) : current.bgOpacity,
      posX: posX != null ? Number(posX) : current.posX,
      posY: posY != null ? Number(posY) : current.posY,
    };

    if (typeof keywords !== "undefined") {
      data.keywords = toKeywordsInput(keywords);
    }

    const updated = await prisma.media.update({
      where: { id: current.id },
      data,
    });

    const url =
      typeof updated.imageUrl === "string" && updated.imageUrl.startsWith("/uploads/")
        ? makePublicUrl(updated.imageUrl)
        : (updated.imageUrl as any);

    res.json({ ...updated, imageUrl: url });
  } catch (err) {
    next(err);
  }
});

app.delete("/api/media/:id", async (req, res, next) => {
  try {
    const userId = await requireUserId(req);
    const current = await prisma.media.findFirst({
      where: { id: req.params.id, userId },
    });
  if (!current) return res.status(404).json({ error: "not_found" });
    const basename = getUploadBasename(String(current.imageUrl ?? ""));
    const full = path.join(UPLOAD_DIR, basename);
    fs.promises.unlink(full).catch(() => void 0);

    await prisma.media.delete({ where: { id: current.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// SWAGGER / OPENAPI
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(openapiSpec, {
    swaggerOptions: { displayRequestDuration: true },
  })
);

app.get("/openapi.json", (_req, res) => res.json(openapiSpec));

// FRONTEND REDIRECT

app.get(/^\/(?!api|auth|debug|uploads).*/, (req, res) => {
  const q = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  res.redirect(302, `${FRONTEND_ORIGIN}${req.path}${q}`);
});

app.use((req, res) => {
  console.warn(`[404] ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: "not_found", path: req.originalUrl });
});

app.use(
  (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.status || 500;
    console.error("[ERR]", err);
    res.status(status).json({ error: err.message || "server_error" });
  }
);

app.listen(PORT, () =>
  console.log(`API running on :${PORT} (BASE_URL=${BASE_URL})`)
);