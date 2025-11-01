import path from "path";
import os from "os";

jest.mock("uuid", () => ({ v4: jest.fn(() => "uuid-mock") }));

jest.doMock("../../middlware/auth", () => ({
  requireUserId: jest.fn(async () => "u1"),
}));

const capModelId = "IMG-1";
const genModelId = "TXT-1";

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

jest.doMock("../../config/model", () => ({
  MODEL_ID: "IMG-DEFAULT",
  GEN_MODEL_ID: "TXT-DEFAULT",
  getCaptioner: jest.fn(async () => getCaptionerMock),
  getGenerator: getGeneratorMock,
  __esModule: true,
}));

const looksBadMock = jest.fn<boolean, [string, string]>(() => false);
const ruleBasedCaptionMock = jest.fn<string, [string, any]>(
  (core: string) => `${core} 🏖️ 🌅 #beachlife`
);
const extractEmojisOnlyMock = jest.fn<string[], [string, number]>();
extractEmojisOnlyMock.mockReturnValue(["🏖️", "🌅"]);

jest.doMock("../../utils/textUtils.js", () => ({
  looksBad: looksBadMock,
  ruleBasedCaption: ruleBasedCaptionMock,
  extractEmojisOnly: extractEmojisOnlyMock,
  __esModule: true,
}));

import fs from "fs";
const writeFileSpy = jest
  .spyOn(fs.promises, "writeFile")
  .mockImplementation(async () => {});
const unlinkSpy = jest
  .spyOn(fs.promises, "unlink")
  .mockImplementation(async () => {});

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
    expect(extractEmojisOnlyMock).toHaveBeenCalledWith(expect.any(String), 2);
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
});
