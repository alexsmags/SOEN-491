import express from "express";
import fs from "fs";
import os from "os";
import path from "path";
import { v4 as uuid } from "uuid";

import { memUpload } from "../middlware/uploads";
import { requireUserId } from "../middlware/auth";
import { MODEL_ID, GEN_MODEL_ID, getCaptioner, getGenerator } from "../config/model";
import {
  ruleBasedCaption,
  looksBad,
  extractEmojisOnly,
  type Placement,
} from "../utils/textUtils.js";

const router = express.Router();

router.post("/caption", memUpload.single("file"), async (req, res, next) => {
  try {
    const userId = await requireUserId(req);
    if (!req.file) return res.status(400).json({ error: "No image uploaded (field 'file')." });

    const tone = String(req.body.tone ?? "casual");

    const rawKeywords = req.body.keywords;
    const keywords: string[] = (() => {
      if (!rawKeywords) return [];
      if (Array.isArray(rawKeywords)) return rawKeywords as string[];
      try {
        const parsed = JSON.parse(String(rawKeywords));
        return Array.isArray(parsed) ? parsed.map(String) : [];
      } catch {
        return [];
      }
    })();

    const rawHashtags = req.body.hashtags;
    const hashtags: string[] = (() => {
      if (!rawHashtags) return [];
      if (Array.isArray(rawHashtags)) return rawHashtags.map(String);
      try {
        const parsed = JSON.parse(String(rawHashtags));
        return Array.isArray(parsed) ? parsed.map(String) : String(rawHashtags).split(",").map(s => s.trim()).filter(Boolean);
      } catch {
        return String(rawHashtags).split(",").map(s => s.trim()).filter(Boolean);
      }
    })();

    const includeHashtags = (String(req.body.includeHashtags ?? "true") === "true");
    const includeMentions = (String(req.body.includeMentions ?? "false") === "true");
    const location = (req.body.location ? String(req.body.location) : "").trim();

    const rawHandles = req.body.handles;
    const handles: string[] = (() => {
      if (!rawHandles) return [];
      if (Array.isArray(rawHandles)) return rawHandles.map(String);
      try {
        const parsed = JSON.parse(String(rawHandles));
        return Array.isArray(parsed) ? parsed.map(String) : String(rawHandles).split(",").map(s => s.trim()).filter(Boolean);
      } catch {
        return String(rawHandles).split(",").map(s => s.trim()).filter(Boolean);
      }
    })();

    const voice: "i"|"we"|"neutral" = (String(req.body.voice ?? "neutral").toLowerCase() as any);
    const lengthPref: "short"|"medium"|"long" = (String(req.body.length ?? "medium").toLowerCase() as any);

    const includeEmojis = (String(req.body.includeEmojis ?? "false") === "true");
    const emojiCount = Math.min(8, Math.max(1, Number(req.body.emojiCount ?? 2)));

    const normalizePlacement = (v: any, def: Placement): Placement => {
      const s = String(v || "").toLowerCase();
      return s === "beginning" || s === "middle" || s === "end" ? (s as Placement) : def;
    };
    const hashtagsPlacement = normalizePlacement(req.body.hashtagsPlacement, "end");
    const mentionsPlacement = normalizePlacement(req.body.mentionsPlacement, "end");
    const emojiPlacement = normalizePlacement(req.body.emojiPlacement, "end");

    console.log("[caption][user]", {
      userId, tone, keywords, hashtags, includeHashtags, includeMentions, location, handles,
      voice, length: lengthPref, includeEmojis, emojiCount, hashtagsPlacement, mentionsPlacement, emojiPlacement
    });

    const tmpName = `cap-${uuid()}${path.extname(req.file.originalname || ".jpg")}`;
    const tmpPath = path.join(os.tmpdir(), tmpName);
    await fs.promises.writeFile(tmpPath, req.file.buffer);

    let baseCaption = "";
    let imgModelId = MODEL_ID;
    try {
      const cap = await getCaptioner();
      const result: any = await cap(tmpPath, {
        max_new_tokens: 35,
        temperature: 0.7,
        top_k: 50,
        top_p: 0.95,
      });
      const arr = Array.isArray(result) ? result : [result];
      const first = (arr && arr[0]) || {};
      const raw = String(first.generated_text ?? first.text ?? "").trim();
      baseCaption = raw.replace(/\s+/g, " ").replace(/\.(\s*\.)+$/g, ".").trim();
      imgModelId = (cap as any)?.model?.modelId || MODEL_ID;
      console.log("[caption][blip][out]", { baseCaption, modelId: imgModelId });
    } finally {
      fs.promises.unlink(tmpPath).catch(() => void 0);
    }

    const gen = await getGenerator();

    const keywordsLine = keywords.length ? `Incorporate these concepts naturally: ${keywords.join(", ")}. ` : "";
    const locLine = location ? `If relevant, acknowledge the location naturally (do not add hashtags). ` : "";
    const prompt =
      `Paraphrase into a ${tone} social media caption in the voice of "${voice}". ` +
      `Keep it ${lengthPref}. Do NOT include hashtags. ` +
      `${keywordsLine}${locLine}` +
      `Description: ${baseCaption}`;

    let enhancedCore = "";
    let source: "model" | "rule-based" = "model";
    try {
      const genOut: any = await gen(prompt, {
        max_new_tokens: 64,
        temperature: 0.8,
        top_p: 0.95,
        repetition_penalty: 1.05,
      });
      const g0 = Array.isArray(genOut) ? genOut[0] : genOut;
      let text: string = String(g0?.generated_text ?? g0?.text ?? "").trim();
      text = text.replace(/^"+|"+$/g, "").replace(/\s+/g, " ").trim();
      enhancedCore = text.replace(/(^|\s)#\w+/g, "").replace(/\s+/g, " ").trim();

      if (looksBad(enhancedCore, prompt)) {
        source = "rule-based";
        enhancedCore = baseCaption;
      }
    } catch (e) {
      console.warn("[caption][generator][error]", e);
      source = "rule-based";
      enhancedCore = baseCaption;
    }

    let emojis: string[] = [];
    if (includeEmojis) {
      try {
        const emojiPrompt =
          `Given this caption: "${enhancedCore}". Suggest ${emojiCount} relevant emojis only. ` +
          `Return emojis separated by spaces, with no words or punctuation.`;
        const emoOut: any = await gen(emojiPrompt, {
          max_new_tokens: 16,
          temperature: 0.7,
          top_p: 0.95,
        });
        const e0 = Array.isArray(emoOut) ? emoOut[0] : emoOut;
        const raw = String(e0?.generated_text ?? e0?.text ?? "").trim();
        emojis = extractEmojisOnly(raw, emojiCount);
      } catch (e) {
        console.warn("[caption][emoji][error]", e);
        emojis = [];
      }
    }

    const final = ruleBasedCaption(enhancedCore, {
      tone,
      keywords,
      hashtags,
      includeHashtags,
      includeMentions,
      location,
      handles,
      voice,
      length: lengthPref,
      includeEmojis,
      emojis,
      emojiPlacement,
      hashtagsPlacement,
      mentionsPlacement,
    });

    console.log("[caption][generator][out]", final, { source, emojis });

    res.json({
      caption: baseCaption,
      enhanced: final,
      meta: {
        image_caption_model: imgModelId,
        text_gen_model: (await (getGenerator() as any))?.model?.modelId || GEN_MODEL_ID,
        prompt,
        source,
        used_keywords: keywords,
        used_hashtags: includeHashtags ? hashtags : [],
        used_emojis: includeEmojis ? emojis : [],
        placements: {
          hashtagsPlacement,
          mentionsPlacement,
          emojiPlacement,
        },
      },
    });
  } catch (err) {
    console.error("[caption][error]", err);
    next(err);
  }
});

export default router;
