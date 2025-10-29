import { Prisma } from "@prisma/client";
import { toKeywordsInput } from "../prsimaUtils";

describe("toKeywordsInput()", () => {
  it("parses a valid JSON string into a value", () => {
    const result = toKeywordsInput('["a", "b"]');
    expect(result).toEqual(["a", "b"]);
  });

  it("returns Prisma.DbNull for null JSON", () => {
    const result = toKeywordsInput("null");
    expect(result).toBe(Prisma.DbNull);
  });

  it("returns an empty array for invalid JSON string", () => {
    const result = toKeywordsInput("[invalid json");
    expect(result).toEqual([]);
  });

  it("returns Prisma.DbNull for null or undefined input", () => {
    expect(toKeywordsInput(null)).toBe(Prisma.DbNull);
    expect(toKeywordsInput(undefined)).toBe(Prisma.DbNull);
  });

  it("returns the raw object directly for non-string inputs", () => {
    const arr = ["x", "y"];
    const obj = { a: 1 };
    expect(toKeywordsInput(arr)).toBe(arr);
    expect(toKeywordsInput(obj)).toBe(obj);
  });

  it("handles number and boolean inputs correctly", () => {
    expect(toKeywordsInput(42)).toBe(42);
    expect(toKeywordsInput(true)).toBe(true);
  });
});
