import { describe, expect, it } from "vitest";
import {
  asMorapayApiError,
  isMorapayApiError,
  MorapayApiError,
  toClientError,
} from "@/lib/morapay/client";

describe("MorapayApiError detection", () => {
  it("recognizes real instances", () => {
    const err = new MorapayApiError({
      code: "ramp.limit",
      message: "Minimum buy amount is 50 GHS",
      status: 400,
    });
    expect(isMorapayApiError(err)).toBe(true);
    expect(asMorapayApiError(err)?.code).toBe("ramp.limit");
  });

  it("recognizes cross-bundle errors by name", () => {
    const err = Object.assign(new Error("Minimum buy amount is 50 GHS"), {
      name: "MorapayApiError",
      status: 400,
      code: "ramp.limit",
    });
    expect(isMorapayApiError(err)).toBe(true);
    expect(toClientError(err)).toEqual({
      code: "ramp.limit",
      message: "Minimum buy amount is 50 GHS",
    });
  });

  it("recognizes duck-typed errors with code + status", () => {
    const err = {
      code: "ramp.limit",
      message: "Minimum buy amount is 50 GHS",
      status: 400,
    };
    expect(isMorapayApiError(err)).toBe(true);
  });
});