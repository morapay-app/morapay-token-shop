import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const PATTERNS = [/sk_live_/, /sk_test_/, /MORAPAY_PARTNER_SECRET/, /UPSTASH_REDIS_REST_TOKEN=/];

function walk(dir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) return files;
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(js|css|html|json|map)$/.test(name)) files.push(p);
  }
  return files;
}

describe("client bundle secret grep", () => {
  it("finds no secrets in .next/static when built", () => {
    const root = path.join(process.cwd(), ".next/static");
    if (!existsSync(root)) {
      // Skip when unit tests run before build
      expect(true).toBe(true);
      return;
    }
    const hits: string[] = [];
    for (const file of walk(root)) {
      const text = readFileSync(file, "utf8");
      for (const re of PATTERNS) {
        if (re.test(text)) hits.push(`${file} ~ ${re}`);
      }
    }
    expect(hits).toEqual([]);
  });
});
