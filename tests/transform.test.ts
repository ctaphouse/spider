import { describe, it, expect } from "bun:test";
import { toSQLiteType, normaliseValue } from "../src/transform/types.ts";

describe("toSQLiteType", () => {
  it("adBoolean (11) → INTEGER",        () => expect(toSQLiteType(11)).toBe("INTEGER"));
  it("adSmallInt (2) → INTEGER",        () => expect(toSQLiteType(2)).toBe("INTEGER"));
  it("adInteger (3) → INTEGER",         () => expect(toSQLiteType(3)).toBe("INTEGER"));
  it("adDouble (5) → REAL",             () => expect(toSQLiteType(5)).toBe("REAL"));
  it("adCurrency (6) → NUMERIC",        () => expect(toSQLiteType(6)).toBe("NUMERIC"));
  it("adDate (7) → TEXT",               () => expect(toSQLiteType(7)).toBe("TEXT"));
  it("adLongVarChar (201) → TEXT",      () => expect(toSQLiteType(201)).toBe("TEXT"));
  it("adLongVarBinary (205) → BLOB",    () => expect(toSQLiteType(205)).toBe("BLOB"));
  it("unknown type → TEXT",             () => expect(toSQLiteType(999)).toBe("TEXT"));
});

describe("normaliseValue", () => {
  it("converts Access Boolean -1 → 1",  () => expect(normaliseValue(11, -1)).toBe(1));
  it("converts Access Boolean 0 → 0",   () => expect(normaliseValue(11, 0)).toBe(0));
  it("leaves non-boolean values alone", () => expect(normaliseValue(3, 42)).toBe(42));
  it("leaves null alone",               () => expect(normaliseValue(11, null)).toBe(null));
});
