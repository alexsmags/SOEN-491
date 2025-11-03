import path from "path";
import os from "os";

jest.mock("uuid", () => ({ v4: jest.fn(() => "uuid-mock") }));

jest.doMock("../../middlware/auth", () => ({
  requireUserId: jest.fn(async () => "u1"),
  __esModule: true,
}));

jest.doMock("../../utils/emoji", () => ({
  __esModule: true,
  suggestEmojisByEmbedding: jest.fn(async (_embedder, _text, desiredCount = 2) => {
    const base = ["🏖️", "🌅"];
    const n = Math.max(1, Math.min(8, Number(desiredCount) || 2));
    return Array.from({ length: n }, (_, i) => base[i % base.length]);
  }),
}));

const capModelId = "IMG-1";
const genModelId = "TXT-1";
const embModelId = "EMB-1";

const getCaptionerMock = jest.fn(async () => [
  { generated_text: "A warm sunset over the beach." },
]);
(getCaptionerMock as any).model = { modelId: capModelId };

const genFn = jest.fn(async (prompt: string) => {
  if (prompt.startsWith("Paraphrase into")) {
    return [{ generated_text: "Chill vibes at the beach" }];
  }
  if (prompt.startsWith("Given this caption:")) {
    return [{ generated_text: "🏖️ 🌅" }];
  }
  return [{ generated_text: "default" }];
});
(genFn as any).model = { modelId: genModelId };

const getGeneratorMock = jest.fn(async () => genFn);

const embedderFn = jest.fn(async (_input: string) => ({ data: [[1, 0]] }));
(embedderFn as any).model = { modelId: embModelId };

jest.doMock("../../config/model", () => ({
  MODEL_ID: "IMG-DEFAULT",
  GEN_MODEL_ID: "TXT-DEFAULT",
  getCaptioner: jest.fn(async () => getCaptionerMock),
  getGenerator: getGeneratorMock,
  getEmbedder: jest.fn(async () => embedderFn),
  __esModule: true,
}));

const looksBadMock = jest.fn<boolean, [string, string]>(() => false);
const ruleBasedCaptionMock = jest.fn<string, [string, any]>(
  (core: string) => `${core} 🏖️ 🌅 #beachlife`
);

jest.doMock("../../utils/textUtils", () => ({
  looksBad: looksBadMock,
  ruleBasedCaption: ruleBasedCaptionMock,
  __esModule: true,
}));

import fs from "fs";
const writeFileSpy = jest.spyOn(fs.promises, "writeFile").mockImplementation(async () => {});
const unlinkSpy = jest.spyOn(fs.promises, "unlink").mockImplementation(async () => {});

import router from "../../routes/caption";
import type { Request, Response, NextFunction } from "express";

function getCaptionHandler() {
  const stack: any[] = (router as any).stack;
  const routeLayer = stack.find((l) => l.route && l.route.path === "/caption");
  const handlers = routeLayer.route.stack.map((s: any) => s.handle);
  return handlers[handlers.length - 1];
}

function mockReqRes(
  body: any,
  file?: { buffer: Buffer; originalname?: string }
) {
  const req = {
    body,
    file: file || undefined,
    headers: {},
  } as unknown as Request;

  let statusCode: number | undefined;
  let jsonBody: any;

  const res = {
    status(code: number) {
      statusCode = code;
      return this as any;
    },
    json(payload: any) {
      jsonBody = payload;
      return this as any;
    },
  } as unknown as Response;

  const next = jest.fn() as unknown as NextFunction;

  return {
    req,
    res,
    next,
    getStatus: () => statusCode,
    getJson: () => jsonBody,
  };
}

describe("POST /caption handler", () => {
  const handler = getCaptionHandler();

  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeAll(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterAll(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("400 when no file provided", async () => {
    const { req, res, next, getStatus, getJson } = mockReqRes({
      tone: "casual",
    });
    await handler(req, res, next);
    expect(getStatus()).toBe(400);
    expect(getJson()).toEqual({ error: "No image uploaded (field 'file')." });
    expect(next).not.toHaveBeenCalled();
  });

  it("happy path: returns enhanced caption and meta", async () => {
    const body = {
      tone: "casual",
      keywords: JSON.stringify(["sunset", "ocean"]),
      hashtags: JSON.stringify(["beachlife"]),
      includeHashtags: "true",
      includeMentions: "false",
      location: "Tulum",
      handles: JSON.stringify(["@someone"]),
      voice: "we",
      length: "short",
      includeEmojis: "true",
      emojiCount: "2",
      hashtagsPlacement: "end",
      mentionsPlacement: "end",
      emojiPlacement: "end",
    };

    const file = { buffer: Buffer.from("img"), originalname: "pic.jpg" };
    const { req, res, next, getJson } = mockReqRes(body, file);

    await handler(req, res, next);

    const out = getJson();
    expect(out.caption).toBe("A warm sunset over the beach.");
    expect(out.enhanced).toBe("Chill vibes at the beach 🏖️ 🌅 #beachlife");

    expect(writeFileSpy).toHaveBeenCalledTimes(1);
    const tmpArg: any = writeFileSpy.mock.calls[0]?.[0];
    expect(typeof tmpArg).toBe("string");
    const tmpPath = tmpArg as string;
    expect(tmpPath.startsWith(path.join(os.tmpdir(), "cap-"))).toBe(true);
    expect(unlinkSpy).toHaveBeenCalledWith(tmpPath);

    expect(looksBadMock).toHaveBeenCalled();
    expect(ruleBasedCaptionMock).toHaveBeenCalled();

    expect(out.meta.image_caption_model).toBe(capModelId);
    expect(out.meta.text_gen_model).toBe(genModelId);
    expect(out.meta.source).toBe("model");
    expect(out.meta.used_keywords).toEqual(["sunset", "ocean"]);
    expect(out.meta.used_hashtags).toEqual(["beachlife"]);
    expect(out.meta.used_emojis).toEqual(["🏖️", "🌅"]);
    expect(out.meta.placements).toEqual({
      hashtagsPlacement: "end",
      mentionsPlacement: "end",
      emojiPlacement: "end",
    });
    expect(out.meta.embed_model).toBe(embModelId);
  });

  it("falls back to rule-based when generated core looks bad", async () => {
    looksBadMock.mockReturnValueOnce(true);

    const body = {
      tone: "casual",
      includeEmojis: "false",
      includeHashtags: "false",
    };

    const file = { buffer: Buffer.from("x"), originalname: "x.jpg" };
    const { req, res, next, getJson } = mockReqRes(body, file);

    ruleBasedCaptionMock.mockImplementationOnce((core: string) => core);

    await handler(req, res, next);

    const out = getJson();
    expect(out.caption).toBe("A warm sunset over the beach.");
    expect(out.enhanced).toBe("A warm sunset over the beach.");
    expect(out.meta.source).toBe("rule-based");
  });

  it("handles generator exception and falls back to base caption", async () => {
    const errGen = jest.fn(async () => {
      throw new Error("gen fail");
    });
    (errGen as any).model = { modelId: "TXT-BROKEN" };

    const model = jest.requireMock("../../config/model") as any;
    model.getGenerator.mockImplementationOnce(async () => errGen);

    const body = {
      tone: "casual",
      includeEmojis: "false",
      includeHashtags: "false",
    };

    const file = { buffer: Buffer.from("y"), originalname: "y.jpg" };
    const { req, res, next, getJson } = mockReqRes(body, file);

    ruleBasedCaptionMock.mockImplementationOnce((core: string) => core);

    await handler(req, res, next);

    const out = getJson();
    expect(out.caption).toBe("A warm sunset over the beach.");
    expect(out.enhanced).toBe("A warm sunset over the beach.");
    expect(out.meta.source).toBe("rule-based");
  });

  it("parses keywords and hashtags from CSV strings and JSON; handles include flags and placements normalization", async () => {
    const body = {
      keywords: "k1, k2 , k3",
      hashtags: "tag1, tag2 ,tag3",
      includeHashtags: "false",
      includeMentions: "true",
      handles: "@a, @b",
      voice: "neutral",
      length: "medium",
      includeEmojis: "false",
      emojiCount: "7",
      hashtagsPlacement: "INVALID",
      mentionsPlacement: "middle",
      emojiPlacement: "INVALID",
    };
    const file = { buffer: Buffer.from("img"), originalname: "" };
    const { req, res, next, getJson } = mockReqRes(body, file);

    await handler(req, res, next);

    const out = getJson();
    expect(out.caption).toBe("A warm sunset over the beach.");
    expect(out.enhanced.startsWith("Chill vibes at the beach")).toBe(true);

    const call = ruleBasedCaptionMock.mock.calls[ruleBasedCaptionMock.mock.calls.length - 1];
    const opts = call[1];
    expect(opts.includeHashtags).toBe(false);
    expect(opts.includeMentions).toBe(true);
    expect(opts.hashtagsPlacement).toBe("end");
    expect(opts.mentionsPlacement).toBe("middle");
    expect(opts.emojiPlacement).toBe("end");

    const tmpArg: any = writeFileSpy.mock.calls.slice(-1)[0][0];
    const ext = path.extname(tmpArg).toLowerCase();
    expect(ext === "" || ext === ".jpg").toBe(true);

    expect(out.meta.used_hashtags).toEqual([]);
    expect(out.meta.used_emojis).toEqual([]);
  });

  it("clamps emojiCount and generates up to 8 emojis when includeEmojis=true", async () => {
    const body = {
      includeEmojis: "true",
      emojiCount: "100",
      includeHashtags: "true",
      hashtags: JSON.stringify(["x"]),
    };
    const file = { buffer: Buffer.from("img"), originalname: "a.png" };
    const { req, res, next, getJson } = mockReqRes(body, file);
    await handler(req, res, next);
    const out = getJson();
    expect(out.meta.used_emojis.length).toBe(8);
    expect(out.meta.used_hashtags).toEqual(["x"]);
  });

  it("handles invalid JSON inputs for keywords/hashtags/handles", async () => {
    const body = {
      keywords: "{bad",
      hashtags: "{bad",
      handles: "{bad",
      includeHashtags: "true",
      includeMentions: "true",
    };
    const file = { buffer: Buffer.from("img"), originalname: "b.png" };
    const { req, res, next } = mockReqRes(body, file);

    await handler(req, res, next);

    const call = ruleBasedCaptionMock.mock.calls[ruleBasedCaptionMock.mock.calls.length - 1];
    const opts = call[1];
    expect(opts.keywords).toEqual([]);
    expect(opts.hashtags).toEqual(["{bad"]);
    expect(opts.handles).toEqual(["{bad"]);
  });

  it("supports array inputs for keywords/hashtags/handles", async () => {
    const body = {
      keywords: ["k1", "k2"],
      hashtags: ["h1", "h2"],
      handles: ["@a", "@b"],
      includeHashtags: "true",
      includeMentions: "true",
      includeEmojis: "true",
      emojiCount: "1",
    };
    const file = { buffer: Buffer.from("img"), originalname: "c.png" };
    const { req, res, next, getJson } = mockReqRes(body, file);

    await handler(req, res, next);

    const out = getJson();
    expect(out.meta.used_keywords).toEqual(["k1", "k2"]);
    expect(out.meta.used_hashtags).toEqual(["h1", "h2"]);
    expect(out.meta.used_emojis.length).toBe(1);
  });
});
