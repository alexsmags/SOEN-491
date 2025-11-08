import { vi } from "vitest";

vi.stubEnv("VITE_SERVER_URL", "https://mockserver.com");
vi.stubEnv("VITE_DEV_USER_ID", "dev-123");

import { describe, it, expect, beforeEach } from "vitest";
import { generateCaption, type CaptionOptions } from "../caption";

function makeFile(name = "file.png") {
  return new File(["dummy"], name, { type: "image/png" });
}

function mockFetch(response: any, ok = true) {
  const fetchMock = vi.fn(async () => ({
    ok,
    status: ok ? 200 : 500,
    async json() {
      return response;
    },
    async text() {
      return ok ? JSON.stringify(response) : `Caption request failed (${500})`;
    },
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("generateCaption", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sends proper FormData and returns base caption if no enhanced", async () => {
    const file = makeFile();
    const response = { caption: "Base caption" };
    const fetchMock = mockFetch(response);
    const result = await generateCaption(file, "funny", ["keyword1"]);
    expect(result).toBe("Base caption");
    expect(fetchMock).toHaveBeenCalledOnce();
    const fetchCall = (fetchMock as any).mock.calls[0][1];
    expect(fetchCall.method).toBe("POST");
    expect(fetchCall.credentials).toBe("include");
    const body = fetchCall.body as FormData;
    expect(body.get("tone")).toBe("funny");
    expect(body.get("keywords")).toBe(JSON.stringify(["keyword1"]));
  });

  it("returns enhanced caption if provided by server", async () => {
    const file = makeFile();
    const response = { caption: "Base", enhanced: "Enhanced" };
    mockFetch(response);
    const result = await generateCaption(file, "happy", []);
    expect(result).toBe("Enhanced");
  });

  it("throws error when response is not ok", async () => {
    const file = makeFile();
    mockFetch({}, false);
    await expect(generateCaption(file, "neutral", [])).rejects.toThrow(
      /Caption request failed/
    );
  });

  it("throws error when no caption or enhanced returned", async () => {
    const file = makeFile();
    mockFetch({});
    await expect(generateCaption(file, "neutral", [])).rejects.toThrow(
      /No caption returned/
    );
  });

  it("appends optional CaptionOptions correctly", async () => {
    const file = makeFile();
    const opts: CaptionOptions = {
      includeHashtags: true,
      includeMentions: false,
      location: "NYC",
      handles: ["@user1"],
      voice: "i",
      length: "short",
      hashtags: ["#fun"],
      includeEmojis: true,
      emojiCount: 3,
      emojiPlacement: "end",
      hashtagsPlacement: "beginning",
      mentionsPlacement: "middle",
    };
    const fetchMock = mockFetch({ caption: "Test caption" });
    const result = await generateCaption(file, "funny", ["key"], opts);
    expect(result).toBe("Test caption");
    const body = (fetchMock as any).mock.calls[0][1].body as FormData;
    expect(body.get("includeHashtags")).toBe("true");
    expect(body.get("includeMentions")).toBe("false");
    expect(body.get("location")).toBe("NYC");
    expect(body.get("handles")).toBe(JSON.stringify(["@user1"]));
    expect(body.get("voice")).toBe("i");
    expect(body.get("length")).toBe("short");
    expect(body.get("hashtags")).toBe(JSON.stringify(["#fun"]));
    expect(body.get("includeEmojis")).toBe("true");
    expect(body.get("emojiCount")).toBe("3");
    expect(body.get("emojiPlacement")).toBe("end");
    expect(body.get("hashtagsPlacement")).toBe("beginning");
    expect(body.get("mentionsPlacement")).toBe("middle");
  });
});
