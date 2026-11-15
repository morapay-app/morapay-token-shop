import { describe, expect, it } from "vitest";
import { resolveReferral } from "@/lib/referral";

describe("referral precedence", () => {
  it("prefers query over cookie over env over config", () => {
    expect(
      resolveReferral({
        query: "MP-QUERY1",
        cookie: "MP-COOKI1",
        env: "MP-ENVENV",
        config: "MP-CONFIG",
      }),
    ).toBe("MP-QUERY1");
    expect(
      resolveReferral({
        cookie: "MP-COOKI1",
        env: "MP-ENVENV",
        config: "MP-CONFIG",
      }),
    ).toBe("MP-COOKI1");
    expect(
      resolveReferral({ env: "MP-ENVENV", config: "MP-CONFIG" }),
    ).toBe("MP-ENVENV");
    expect(resolveReferral({ config: "MP-CONFIG" })).toBe("MP-CONFIG");
    expect(resolveReferral({ query: "nope" })).toBeUndefined();
  });
});
