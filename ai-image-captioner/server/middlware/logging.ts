import type { Request, Response, NextFunction } from "express";

export function logRequests(req: Request, res: Response, next: NextFunction) {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  res.on("finish", () => {
    if (req.originalUrl.startsWith("/auth/callback/credentials")) {
      console.log("[auth][callback][set-cookie]:", res.getHeader("set-cookie"));
    }
  });
  next();
}
