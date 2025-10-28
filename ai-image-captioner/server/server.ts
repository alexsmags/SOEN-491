import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import dotenv from "dotenv";

import { authHandler, authConfig } from "./auth.js"
import { signup } from "./routes/signup.js";
import { getSession } from "@auth/express";
import { openapiSpec } from "./openapi.js";

import { FRONTEND_ORIGIN, PORT, BASE_URL } from "./config/env.js";
import { logRequests } from "./middlware/logging.js";
import { uploadStatic } from "./middlware/uploads.js";

// Routes
import debugRoutes from "./routes/debug.js";
import captionRoutes from "./routes/caption.js";
import mediaRoutes from "./routes/media.js";

dotenv.config();

const app = express();
app.set("trust proxy", true);

// Core middleware
app.use(
  cors({
    origin: [FRONTEND_ORIGIN, "http://127.0.0.1:5173"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(logRequests);

// Static uploads
app.use("/uploads", uploadStatic);

// Auth / Signup
app.use("/auth", authHandler);
app.use("/api/signup", signup);

// Session helpers
app.get("/api/me", async (req, res) => {
  const session = await getSession(req, authConfig);
  if (!session?.user) return res.status(401).json({ error: "unauthorized" });
  res.json({ user: session.user });
});

app.get("/api/logout", (req, res) => {
  const base = process.env.AUTH_URL ?? `http://localhost:${PORT}`;
  res.redirect(`${base}/auth/signout?callbackUrl=${encodeURIComponent(FRONTEND_ORIGIN)}`);
});

// Routes
app.use("/debug", debugRoutes);
app.use("/api", captionRoutes);
app.use("/api", mediaRoutes);

// Swagger / OpenAPI
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(openapiSpec, {
    swaggerOptions: { displayRequestDuration: true },
  })
);
app.get("/openapi.json", (_req, res) => res.json(openapiSpec));

// Frontend redirect
app.get(/^\/(?!api|auth|debug|uploads).*/, (req, res) => {
  const q = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  res.redirect(302, `${FRONTEND_ORIGIN}${req.path}${q}`);
});

// 404 + error handler
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
