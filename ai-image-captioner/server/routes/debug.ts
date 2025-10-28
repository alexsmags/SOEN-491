import express from "express";
import { prisma } from "../prisma.js";
import { BASE_URL } from "../config/env.js";

const router = express.Router();

router.get("/health", (_req, res) => res.json({ ok: true }));

router.get("/routes", (_req, res) => {
  res.json({ base: BASE_URL, note: "Enable detailed router listing in server.ts if needed." });
});

router.get("/users", async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, passwordHash: true },
    orderBy: { email: "asc" },
  });
  res.json(users);
});

router.get("/sessions", async (_req, res) => {
  const sessions = await prisma.session.findMany({
    orderBy: { expires: "desc" },
    take: 5,
    select: { sessionToken: true, userId: true, expires: true },
  });
  res.json(sessions);
});

export default router;
