import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("token shop smoke", () => {
  test("favicon and /favicon.ico match the built shop", async ({ page }) => {
    await page.goto("/");
    const iconHref = await page
      .locator('link[rel="icon"]')
      .last()
      .getAttribute("href");
    expect(iconHref).toBe("/brand/favicon.ico");

    const faviconRes = await page.request.get("/favicon.ico");
    expect(faviconRes.status()).toBe(200);
    expect(faviconRes.headers()["content-type"]?.toLowerCase()).toContain(
      "image",
    );
    const shortcutBytes = Buffer.from(await faviconRes.body());
    const assetRes = await page.request.get(iconHref!);
    const assetBytes = Buffer.from(await assetRes.body());
    expect(shortcutBytes.equals(assetBytes)).toBe(true);
  });

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
      page.getByRole("heading", { name: /AMEM|Amount|Telegram/i }).first(),
    ).toBeVisible();
  });

  test("axe has no serious/critical issues on home", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("heading", { name: /Buy \$AMEM|Amount|Telegram/i })
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
