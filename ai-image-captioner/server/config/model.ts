import { env as TEnv, pipeline } from "@xenova/transformers";
import path from "path";

// HF token setup
const rawToken = process.env.HF_TOKEN || process.env.HUGGING_FACE_HUB_TOKEN || "";
const hfToken = /^hf_[A-Za-z0-9]+$/.test(rawToken) ? rawToken : "";
if (hfToken) {
  (TEnv as any).HF_TOKEN = hfToken;
  (TEnv as any).HF_ACCESS_TOKEN = hfToken;
} else {
  delete (TEnv as any).HF_TOKEN;
  delete (TEnv as any).HF_ACCESS_TOKEN;
}
(TEnv as any).cacheDir =
  process.env.TRANSFORMERS_CACHE || path.resolve(process.cwd(), ".transformers-cache");

// Models
export const MODEL_ID = process.env.BLIP_MODEL_ID || "Xenova/vit-gpt2-image-captioning";
export const GEN_MODEL_ID = process.env.GEN_MODEL_ID || "Xenova/LaMini-Flan-T5-248M";

let captionerPromise: Promise<any> | null = null;
let generatorPromise: Promise<any> | null = null;

export function getCaptioner(): Promise<any> {
  if (!captionerPromise) captionerPromise = pipeline("image-to-text", MODEL_ID);
  return captionerPromise as Promise<any>;
}

export function getGenerator(): Promise<any> {
  if (!generatorPromise) generatorPromise = pipeline("text2text-generation", GEN_MODEL_ID);
  return generatorPromise as Promise<any>;
}
