import dotenv from "dotenv";
import path from "path";

dotenv.config();

export const PORT = Number(process.env.PORT ?? 5000);
export const FRONTEND_ORIGIN = process.env.ORIGIN ?? "http://localhost:5173";
export const BASE_URL = (process.env.BASE_URL ?? `http://localhost:${PORT}`).replace(/\/$/, "");
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"));

export const makePublicUrl = (p: string) =>
  new URL(p.startsWith("/") ? p : `/${p}`, BASE_URL).href;

export const getUploadBasename = (imageUrl: string) => {
  try {
    const u = new URL(imageUrl, BASE_URL);
    const m = u.pathname.match(/\/uploads\/(.+)$/);
    return m ? m[1] : path.basename(imageUrl);
  } catch {
    const m = imageUrl.match(/\/uploads\/(.+)$/);
    return m ? m[1] : path.basename(imageUrl);
  }
};
