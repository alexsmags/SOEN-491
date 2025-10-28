import { Prisma } from "@prisma/client";

export function toKeywordsInput(
  raw: unknown
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed == null ? Prisma.DbNull : (parsed as Prisma.InputJsonValue);
    } catch {
      return [] as unknown as Prisma.InputJsonValue;
    }
  }
  if (raw == null) return Prisma.DbNull;
  return raw as Prisma.InputJsonValue;
}
