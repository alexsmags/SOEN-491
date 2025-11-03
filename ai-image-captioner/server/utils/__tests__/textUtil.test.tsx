import {
  tagify,
  ensureVoice,
  trimToLength,
  ruleBasedCaption,
  looksBad,
  extractEmojisOnly,
  extractTopKeywords,
  type Placement,
} from "../../utils/textUtils";

describe("tagify()", () => {
  it("lowercases, strips non-alphanumerics, and ensures single #", () => {
    expect(tagify("Hello World!!")).toBe("#helloworld");
    expect(tagify("  C++ / JS ")).toBe("#cjs");
    expect(tagify("###Hash_TAG 123")).toBe("#hashtag123");
  });

  it("removes extra leading # and keeps a single #", () => {
    expect(tagify("#AlreadyTagged")).toBe("#alreadytagged");
    expect(tagify("####just###hashes###")).toBe("#justhashes");
  });

  it("handles strings that become empty after stripping to #", () => {
    expect(tagify("!!!")).toBe("#");
  });
});

describe("ensureVoice()", () => {
  it("neutral returns unchanged", () => {
    expect(ensureVoice("Great day at the beach", "neutral")).toBe("Great day at the beach");
  });
  it("adds leading 'I ' when no first-person token present", () => {
    expect(ensureVoice("Great day at the beach", "i")).toBe("I great day at the beach");
  });
  it("adds leading 'We ' when no plural token present", () => {
    expect(ensureVoice("Great day at the beach", "we")).toBe("We great day at the beach");
  });
  it("respects existing pronouns", () => {
    expect(ensureVoice("I love pizza", "i")).toBe("I love pizza");
    expect(ensureVoice("We are thrilled", "we")).toBe("We are thrilled");
    expect(ensureVoice("we’re happy", "we")).toBe("we’re happy");
  });
});

describe("trimToLength()", () => {
  const long = "one two three four five six seven eight nine ten eleven twelve thirteen";
  it("short → 12 words", () => {
    expect(trimToLength(long, "short").split(/\s+/).length).toBe(12);
  });
  it("medium → 25 words cap", () => {
    const med = Array.from({ length: 30 }, (_, i) => `w${i}`).join(" ");
    expect(trimToLength(med, "medium").split(/\s+/).length).toBe(25);
  });
  it("long → 60 words cap", () => {
    const lng = Array.from({ length: 70 }, (_, i) => `w${i}`).join(" ");
    expect(trimToLength(lng, "long").split(/\s+/).length).toBe(60);
  });
  it("returns original if already under limit", () => {
    expect(trimToLength("a b c", "short")).toBe("a b c");
  });
});

describe("ruleBasedCaption()", () => {
  const base = "A lovely sunny afternoon by the river.";
  const opts = {
    tone: "casual",
    keywords: ["river", "sunny"],
    hashtags: ["SunnyDay", "Nature", "Walk"],
    includeHashtags: true,
    includeMentions: true,
    location: "Paris",
    handles: ["alice", "@bob"],
    voice: "neutral" as const,
    length: "medium" as const,
    includeEmojis: true,
    emojis: ["🌞", "🌿"],
    emojiPlacement: "beginning" as Placement,
    hashtagsPlacement: "end" as Placement,
    mentionsPlacement: "middle" as Placement,
  };

  it("drops leading 'A'/'The' article and composes placements", () => {
    const out = ruleBasedCaption(base, opts);
    expect(out.startsWith("🌞 🌿 ")).toBe(true);
    expect(out.includes("📍Paris")).toBe(true);
    expect(out.includes("@alice")).toBe(true);
    expect(out.includes("@bob")).toBe(true);
    expect(out.endsWith("#sunnyday #nature #walk")).toBe(true);
    expect(out).not.toMatch(/\s+[,.!?;:]/);
  });

  it("respects voice injection after placement", () => {
    const out = ruleBasedCaption(base, { ...opts, voice: "i" });
    expect(out.startsWith("I ")).toBe(true);
  });

  it("honors length cap", () => {
    const longCore =
      "The very very long description filled with many many words should be trimmed when length is short to avoid overflow of characters and words beyond limit";
    const short = ruleBasedCaption(longCore, { ...opts, length: "short" });
    expect(short.split(/\s+/).length).toBeLessThanOrEqual(12);
  });

  it("skips segments when toggles are off", () => {
    const out = ruleBasedCaption(base, {
      ...opts,
      includeHashtags: false,
      includeMentions: false,
      includeEmojis: false,
    });
    expect(out).not.toContain("#");
    expect(out).not.toContain("@");
    expect(out).not.toContain("🌞");
  });

  it("places segments in 'middle' between first and last word", () => {
    const midOut = ruleBasedCaption("Lovely river walk today", {
      ...opts,
      emojiPlacement: "middle",
      hashtagsPlacement: "middle",
      mentionsPlacement: "middle",
    });
    const words = midOut.split(/\s+/);
    const first = words[0];
    const last = words[words.length - 1];
    expect(first).not.toMatch(/^[@#]|[\u{1F300}-\u{1FAFF}]/u);
    expect(last).not.toMatch(/^[@#]|[\u{1F300}-\u{1FAFF}]/u);
  });

  it("caps hashtags to 8 and sanitizes via tagify", () => {
    const many = ["A!", "B-", "C__", "D d", "E", "F", "G", "H", "I", "J"];
    const out = ruleBasedCaption("The core", {
      ...opts,
      hashtags: many,
      includeHashtags: true,
      includeMentions: false,
      includeEmojis: false,
      hashtagsPlacement: "end",
      mentionsPlacement: "end",
      emojiPlacement: "end",
    });
    const tags = out.split(/\s+/).filter((t) => t.startsWith("#"));
    expect(tags.length).toBe(8);
    expect(tags.slice(-3)).toEqual(["#f", "#g", "#h"]);
  });

  it("omits location/mentions segment when both are empty", () => {
    const out = ruleBasedCaption("The scene", {
      ...opts,
      includeMentions: true,
      location: "",
      handles: [],
    });
    expect(out).not.toContain("📍");
    expect(out).not.toMatch(/@\w/);
  });

  it("cleans stray spaces before punctuation", () => {
    const messy = "A view , with sun ! and birds ?";
    const out = ruleBasedCaption(messy, {
      ...opts,
      includeEmojis: false,
      includeHashtags: false,
      includeMentions: false,
    });
    expect(out).not.toMatch(/\s+[,.!?;:]/);
  });
});

describe("looksBad()", () => {
  it("flags empty or super short", () => {
    expect(looksBad("", "p")).toBe(true);
    expect(looksBad("hi", "p")).toBe(true);
  });
  it("flags copy that echoes the prompt", () => {
    expect(looksBad("Paraphrase into friendly caption", "Paraphrase into friendly caption")).toBe(
      true
    );
  });
  it("flags with heuristic hints", () => {
    expect(looksBad("Open the text editor, then...", "x")).toBe(true);
    expect(looksBad("There is no other way to do this", "x")).toBe(true);
  });
  it("passes normal text", () => {
    expect(looksBad("Having a great day by the river", "x")).toBe(false);
  });
});

describe("extractEmojisOnly()", () => {
  it("extracts only emoji-ish tokens and trims to max", () => {
    const raw = "Words 🤖, 🚀 and 🌟 ! plus text";
    expect(extractEmojisOnly(raw, 2)).toEqual(["🤖", "🚀"]);
  });
  it("filters out letters/numbers/punct and keeps pictographs", () => {
    const raw = "ok 123 !! 🐶 🏖️ abc 🌈";
    const out = extractEmojisOnly(raw, 10);
    expect(out).toEqual(["🐶", "🏖️", "🌈"]);
  });
  it("returns [] for falsy", () => {
    expect(extractEmojisOnly("", 5)).toEqual([]);
  });
});

describe("extractTopKeywords()", () => {
  it("ignores stop words, hashtags, and mentions; counts frequency", () => {
    const txt =
      "We were at the river with our friends @alice #sunnyday river river walk WALK walk!";
    const out = extractTopKeywords(txt, 3);
    expect(out.length).toBe(3);
    expect(out).toEqual(expect.arrayContaining(["river", "walk", "friends"]));
  });

  it("respects max cap", () => {
    const txt = "apple banana cherry date egg fruit grape hazel ivy jack kiwi lemon mango";
    const out = extractTopKeywords(txt, 5);
    expect(out.length).toBe(5);
  });

  it("drops tokens shorter than 3 chars", () => {
    const txt = "a an of is am me we go to it be AI ML";
    const out = extractTopKeywords(txt, 10);
    expect(out.length).toBe(0);
  });
});
