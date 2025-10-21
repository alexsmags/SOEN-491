import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { authHandler, authConfig } from "./auth.js";
import { signup } from "./routes/signup.js";
import { getSession } from "@auth/express";
import { prisma } from "./prisma.js";

dotenv.config();

const app = express();
app.set("trust proxy", true);

app.use(cors({
  origin: process.env.ORIGIN ?? "http://localhost:5173",
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

app.use((req, _res, next) => { console.log(`[REQ] ${req.method} ${req.originalUrl}`); next(); });
app.use((req, res, next) => {
  res.on("finish", () => {
    if (req.originalUrl.startsWith("/auth/callback/credentials")) {
      console.log("[auth][callback][set-cookie]:", res.getHeader("set-cookie"));
    }
  });
  next();
});

app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/debug/routes", (_req, res) => {
  const routes: string[] = [];
  const stack = (app as any)._router?.stack ?? [];
  for (const layer of stack) {
    if (layer.route) {
      const path = layer.route?.path;
      const methods = Object.keys(layer.route?.methods ?? {}).join(",").toUpperCase();
      routes.push(`${methods} ${path}`);
    } else if (layer.name === "router" && layer.handle?.stack) {
      for (const r of layer.handle.stack) {
        if (r.route) {
          const path = r.route.path;
          const methods = Object.keys(r.route.methods ?? {}).join(",").toUpperCase();
          routes.push(`${methods} /auth${path}`);
        }
      }
    }
  }
  res.json({ routes, env: { ORIGIN: process.env.ORIGIN, AUTH_URL: process.env.AUTH_URL } });
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

app.use("/auth", authHandler);

app.use("/api/signup", signup);

app.get("/api/me", async (req, res) => {
  const session = await getSession(req, authConfig);
  if (!session?.user) return res.status(401).json({ error: "unauthorized" });
  res.json({ user: session.user });
});

app.get("/api/images", async (req, res) => {
  const session = await getSession(req, authConfig);
  if (!session?.user?.id) return res.status(401).json({ error: "unauthorized" });
  const images = await prisma.image.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(images);
});

app.get("/api/logout", (req, res) => {
  const base = process.env.AUTH_URL ?? "http://localhost:5000";
  const fe = process.env.ORIGIN ?? "http://localhost:5173";
  res.redirect(`${base}/auth/signout?callbackUrl=${encodeURIComponent(fe)}`);
});


const FE = process.env.ORIGIN ?? "http://localhost:5173";
app.get(/^\/(?!api|auth|debug).*/, (req, res) => {
  const q = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  res.redirect(302, `${FE}${req.path}${q}`);
});

app.use((req, res) => {
  console.warn(`[404] ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: "not_found", path: req.originalUrl });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[ERR]", err);
  res.status(500).json({ error: "server_error" });
});

const port = Number(process.env.PORT ?? 5000);
app.listen(port, () => console.log(`API running on :${port}`));
