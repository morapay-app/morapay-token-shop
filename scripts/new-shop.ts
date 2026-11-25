#!/usr/bin/env tsx
/**
 * pnpm new-shop — copy an example config, prompt for fields, register the shop.
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

  const example = await ask(rl, "Base example (milan|xrp|pi|wikicat|ipod|amem|griot)", "milan");
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
    .replace(/(siteUrl:\s*(?:envSiteUrl\()?)"[^"]+"/, `$1"${siteUrl}"`)
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

  const constName = `${shopId.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase())}Config`;
  text = text.replaceAll(/\b[A-Za-z]+Config\b(?=\s*=\s*\{)|(?<=export default )\w+(?=;)/g, constName);

  const out = path.join("examples", `${shopId}.config.ts`);
  if (existsSync(out)) {
    console.error(`${out} already exists`);
    process.exit(1);
  }
  writeFileSync(out, text);

  const registry = readFileSync("shop.config.ts", "utf8")
    .replace(
      /(import \w+Config from ".\/examples\/[^\n]+\n)(?!import \w+Config)/,
      `$1import ${constName} from "./examples/${shopId}.config";\n`,
    )
    .replace("const SHOPS = [\n", `const SHOPS = [\n  ${constName},\n`);
  writeFileSync("shop.config.ts", registry);

  mkdirSync(path.join("public/brand", shopId), { recursive: true });
  console.log(`\nWrote ${out} and listed it in shop.config.ts`);
  console.log(`Add brand files to public/brand/${shopId}/ and set SHOP_ID=${shopId}`);
  console.log("Set env vars from .env.example, then deploy.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
