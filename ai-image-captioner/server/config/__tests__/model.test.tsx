import path from "path";

const mockEnv: Record<string, any> = {};
const pipelineMock = jest.fn(async (task: string, model: string) => {
  return { task, model, mocked: true };
});

jest.mock("@xenova/transformers", () => {
  return {
    __esModule: true,
    env: mockEnv,
    pipeline: pipelineMock,
  };
});

const ORIGINAL_ENV = process.env;

async function loadFreshModule() {
  jest.resetModules();
  pipelineMock.mockClear();

  await import("@xenova/transformers");
  return await import("../../config/model"); 
}

function xEnv() {
  const anyEnv = require("@xenova/transformers").env as any;
  return anyEnv;
}

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.HF_TOKEN;
  delete process.env.HUGGING_FACE_HUB_TOKEN;
  delete process.env.TRANSFORMERS_CACHE;
  delete process.env.BLIP_MODEL_ID;
  delete process.env.GEN_MODEL_ID;

  for (const k of Object.keys(mockEnv)) delete mockEnv[k];
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("model.ts", () => {
  test("sets valid HF token on import; clears when invalid", async () => {
    process.env.HF_TOKEN = "hf_ABC123";
    await loadFreshModule();

    expect(xEnv().HF_TOKEN).toBe("hf_ABC123");
    expect(xEnv().HF_ACCESS_TOKEN).toBe("hf_ABC123");

    process.env.HF_TOKEN = "not_valid";
    await loadFreshModule();
    expect("HF_TOKEN" in xEnv()).toBe(false);
    expect("HF_ACCESS_TOKEN" in xEnv()).toBe(false);
  });

  test("sets cacheDir to default or env override", async () => {
    await loadFreshModule();
    expect(xEnv().cacheDir).toBe(
      path.resolve(process.cwd(), ".transformers-cache")
    );

    process.env.TRANSFORMERS_CACHE = path.join("tmp", "hf-cache");
    await loadFreshModule();
    expect(xEnv().cacheDir).toBe(process.env.TRANSFORMERS_CACHE);
  });

  test("uses default MODEL_ID and GEN_MODEL_ID; respects overrides", async () => {
    let mod = await loadFreshModule();
    expect(mod.MODEL_ID).toBe("Xenova/vit-gpt2-image-captioning");
    expect(mod.GEN_MODEL_ID).toBe("Xenova/LaMini-Flan-T5-248M");

    process.env.BLIP_MODEL_ID = "Custom/BLIP";
    process.env.GEN_MODEL_ID = "Custom/GEN";
    mod = await loadFreshModule();
    expect(mod.MODEL_ID).toBe("Custom/BLIP");
    expect(mod.GEN_MODEL_ID).toBe("Custom/GEN");
  });

  test("getCaptioner: calls pipeline once and memoizes", async () => {
    const mod = await loadFreshModule();

    const p1 = mod.getCaptioner();
    expect(pipelineMock).toHaveBeenCalledTimes(1);
    expect(pipelineMock).toHaveBeenCalledWith("image-to-text", mod.MODEL_ID);

    const r1 = await p1;
    expect(r1).toEqual({ task: "image-to-text", model: mod.MODEL_ID, mocked: true });

    const p2 = mod.getCaptioner();
    expect(pipelineMock).toHaveBeenCalledTimes(1);
    expect(p2).toBe(p1);
    expect(await p2).toBe(r1);
  });

  test("getGenerator: calls pipeline once and memoizes; respects override", async () => {
    process.env.GEN_MODEL_ID = "Custom/GEN";
    const mod = await loadFreshModule();

    const p1 = mod.getGenerator();
    expect(pipelineMock).toHaveBeenCalledTimes(1);
    expect(pipelineMock).toHaveBeenCalledWith("text2text-generation", "Custom/GEN");

    const r1 = await p1;
    expect(r1).toEqual({ task: "text2text-generation", model: "Custom/GEN", mocked: true });

    const p2 = mod.getGenerator();
    expect(pipelineMock).toHaveBeenCalledTimes(1);
    expect(p2).toBe(p1);
    expect(await p2).toBe(r1);
  });
});
