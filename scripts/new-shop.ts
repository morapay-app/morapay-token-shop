#!/usr/bin/env tsx
/**
 * pnpm new-shop — copy an example config and prompt for fields.
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

async function ask(rl: ReturnType<typeof createInterface>, q: string, def?: string) {
  const hint = def ? ` [${def}]` : "";
  const a = (await rl.question(`${q}${hint}: `)).trim();
  return a || def || "";
}

async function main() {
  const rl = createInterface({ input, output });
  console.log("Create a new Morapay token shop config\n");

  const example = await ask(rl, "Base example (milan|griot)", "milan");
  const shopId = await ask(rl, "shopId (kebab-case)", "my-token");
  const ticker = await ask(rl, "Token ticker", "TOKEN");
  const name = await ask(rl, "Token name", ticker);
  const chainId = await ask(
    rl,
    "chainId (56=BSC, 101=Solana, 144=XRPL native XRP, 31415926=Pi Network native PI)",
    "56",
  );
  const contract = await ask(rl, "Token contract / mint");
  const siteUrl = await ask(rl, "Site URL", "https://example.com");
  const accent = await ask(rl, "Accent colour #RRGGBB", "#2B6CB0");
  const desk = await ask(rl, "Telegram desk URL", "https://t.me/morapay");
  const referral = await ask(rl, "Referral MP-XXXXXX (optional)", "");

  rl.close();

  const src = path.join("examples", `${example}.config.ts`);
  if (!existsSync(src)) {
    console.error(`Missing ${src}`);
    process.exit(1);
  }

  let text = readFileSync(src, "utf8");
  text = text
    .replace(/shopId:\s*"[^"]+"/, `shopId: "${shopId}"`)
    .replace(/siteUrl:\s*"[^"]+"/, `siteUrl: "${siteUrl}"`)
    .replace(/name:\s*"[^"]+"/, `name: "${name}"`)
    .replace(/ticker:\s*"[^"]+"/, `ticker: "${ticker}"`)
    .replace(/chainId:\s*\d+/, `chainId: ${Number(chainId)}`)
    .replace(/contract:\s*"[^"]+"/, `contract: "${contract}"`)
    .replace(/accent:\s*"#[0-9A-Fa-f]{6}"/, `accent: "${accent}"`)
    .replace(/deskUrl:\s*"[^"]+"/, `deskUrl: "${desk}"`);

  if (referral) {
    if (text.includes("referralCode:")) {
      text = text.replace(
        /referralCode:\s*[^\n]+/,
        `referralCode: "${referral}",`,
      );
    } else {
      text = text.replace(
        /attribution:\s*\{/,
        `attribution: { referralCode: "${referral}", `,
      );
    }
  }

  writeFileSync("shop.config.ts", text);
  mkdirSync("public/brand", { recursive: true });
  console.log("\nWrote shop.config.ts");
  console.log("Add logo.png and hero.jpg to public/brand/");
  console.log("Set env vars from .env.example, then deploy.");

  // Also write a tiny marker for CI/scripted runs
  writeFileSync(
    path.join("public/brand", ".shop-id"),
    shopId,
    "utf8",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
