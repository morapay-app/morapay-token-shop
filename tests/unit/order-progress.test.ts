import { describe, expect, it } from "vitest";
import { buySteps } from "@/components/OrderProgress";
import { sellSteps } from "@/components/SellWidget/SellTracker";

describe("order progress", () => {
  it("never shows payment as received before it is", () => {
    expect(buySteps("awaiting", "PI").map((s) => s.state)).toEqual(["active", "todo", "todo"]);
    expect(buySteps("delivering", "PI").map((s) => s.state)).toEqual(["done", "active", "todo"]);
  });

  it("sells wait for the deposit before paying out", () => {
    expect(sellSteps("in_progress", "PI")[0]).toEqual({ label: "Waiting for your PI", state: "active" });
    expect(sellSteps("delivering", "PI").map((s) => s.state)).toEqual(["done", "active"]);
  });
});
