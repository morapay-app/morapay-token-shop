import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("token shop smoke", () => {
  test("buy widget visible at 360px without scrolling past fold", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/");
    // With FORCE_FALLBACK the Telegram desk card is shown; otherwise Amount step
    const widget = page
      .getByRole("heading", { name: /Amount|Continue on Telegram/i })
      .first();
    await expect(widget).toBeVisible();
    const box = await widget.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.y).toBeLessThan(700);
  });

  test("country=NG path loads", async ({ page }) => {
    await page.goto("/?country=NG");
    await expect(
      page.getByRole("heading", { name: /MILAN|Amount|Telegram/i }).first(),
    ).toBeVisible();
  });

  test("axe has no serious/critical issues on home", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("heading", { name: /Buy \$MILAN|Amount|Telegram/i })
      .first()
      .waitFor();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const serious = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    );
    expect(serious).toEqual([]);
  });
});
