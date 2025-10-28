import { Router } from "express";
import { prisma } from "../prisma.js";
import { z } from "zod";
import argon2 from "argon2";
import { Prisma } from "@prisma/client";

export const signup = Router();

const Body = z.object({
  name: z.string().min(1, "name_required"),
  email: z.string().email("email_invalid"),
  password: z.string().min(8, "password_too_short"),
});

signup.post("/", async (req, res) => {
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "invalid_input";
    return res.status(400).json({ error: "invalid_input", detail: first });
  }

  const name = parsed.data.name.trim();
  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;

  try {
    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (existing) {
      return res.status(409).json({ error: "email_in_use" });
    }

    const passwordHash = await argon2.hash(password);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, email: true, name: true },
    });

    console.log("[signup] created:", user.id, user.email);
    return res.status(201).json(user);
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: "email_in_use" });
    }
    console.error("[signup] unexpected error:", err);
    const isDev = process.env.NODE_ENV !== "production";
    return res.status(500).json({
      error: "server_error",
      ...(isDev ? { detail: err?.code || err?.message || "unknown" } : {}),
    });
  }
});
