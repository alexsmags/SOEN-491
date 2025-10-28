import type { Request } from "express";
import { getSession } from "@auth/express";
import { authConfig } from "../auth.js";

export async function requireUserId(req: Request): Promise<string> {
  const allowHeaderOverride = process.env.NODE_ENV !== "production";
  const dev = allowHeaderOverride ? req.header("x-user-id") : undefined;
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
