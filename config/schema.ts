import { z } from "zod";
import { getChain } from "./chains";

const hexColor = z.string().regex(/^#([0-9a-f]{6})$/i);

export const CultureBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("quote"),
    text: z.string().min(1).max(280),
    by: z.string().max(80).optional(),
  }),
  z.object({
    type: z.literal("blurb"),
    title: z.string().min(1).max(80),
    body: z.string().min(1).max(420),
  }),
  z.object({
    type: z.literal("pulse"),
    label: z.string().min(1).max(60),
    detail: z.string().min(1).max(160),
    href: z.string().url().optional(),
  }),
  z.object({
    type: z.literal("post"),
    title: z.string().min(1).max(100),
    body: z.string().min(1).max(320),
    source: z.string().max(40).optional(),
    href: z.string().url().optional(),
  }),
  z.object({
    type: z.literal("cta"),
    label: z.string().min(1).max(60),
    href: z.string().url(),
  }),
]);

export const PaymentMethodSchema = z.object({
  id: z.string(),
  kind: z.enum(["mobile_money", "bank_transfer", "card"]),
  label: z.string(),
  enabled: z.boolean(),
  networkProvider: z.string().optional(),
  institutionCode: z.string().optional(),
  phonePrefixes: z.array(z.string()).optional(),
  logo: z.string().optional(),
});

export const CountrySchema = z.object({
  code: z.string().length(2),
  currency: z.string().length(3),
  enabled: z.boolean(),
  quickAmounts: z.array(z.number()).optional(),
  caps: z
    .object({
      minFiat: z.number(),
      maxFiat: z.number(),
      dailyMaxFiat: z.number().optional(),
    })
    .optional(),
  methods: z.array(PaymentMethodSchema),
});

export const ShopConfigSchema = z
  .object({
    shopId: z.string().regex(/^[a-z0-9-]{3,40}$/),
    siteUrl: z.string().url(),
    token: z.object({
      name: z.string().min(1),
      ticker: z.string().min(1),
      chainId: z.number().int(),
      contract: z.string().min(1),
      decimals: z.number().int(),
      logo: z.string(),
      description: z.string().max(280),
      explorerTokenUrl: z.string().url().optional(),
    }),
    brand: z.object({
      accent: hexColor,
      accentText: z.string().optional(),
      heroBg: z.string().optional(),
      heroImage: z.string().optional(),
      /** Public path to favicon (e.g. /brand/wikicat/favicon.ico). Omit to auto-detect public/brand/<shopId>/favicon.ico. */
      favicon: z.string().regex(/^\//).optional(),
      /** Home shell: classic hero, AMEM-style culture stage, or WikiCat property theme. */
      layoutVariant: z
        .enum(["default", "culture", "wikicat", "simple"])
        .optional(),
      overridePrimary: z.boolean().default(false),
      headline: z.string().default("Buy ${ticker} with mobile money or bank"),
      subline: z.string().optional(),
    }),
    countries: z.object({
      default: z.string().length(2),
      list: z.array(CountrySchema).min(1),
    }),
    sell: z.object({
      enabled: z.boolean().default(false),
      minToken: z.number().optional(),
      maxToken: z.number().optional(),
    }),
    fees: z.object({
      showFeeLine: z.boolean().default(true),
      note: z.string().optional(),
    }),
    telegram: z.object({
      deskUrl: z.string().url(),
      communityUrl: z.string().url().optional(),
      supportHandle: z.string().optional(),
    }),
    attribution: z.object({
      referralCode: z
        .string()
        .regex(/^MP-[A-Z0-9]{6}$/)
        .optional(),
      utmSource: z.string().optional(),
    }),
    socials: z.record(z.string(), z.string().url()).default({}),
    altBuyLinks: z
      .array(
        z.object({
          label: z.string(),
          url: z.string().url(),
          note: z.string().optional(),
        }),
      )
      .default([]),
    /**
     * Token-culture rails around the buy widget. When set, the shop stage
     * reads as that token's page (story, quotes, market pulse, posts) instead
     * of a generic Morapay shell. Reusable for every shop.
     */
    culture: z
      .object({
        enabled: z.boolean().default(true),
        homeUrl: z.string().url().optional(),
        stageBg: z.string().optional(),
        stageText: z.string().optional(),
        accent: hexColor.optional(),
        brandLine: z.string().min(1),
        roar: z.string().optional(),
        marquee: z.array(z.string()).default([]),
        visual: z.string().optional(),
        left: z.array(CultureBlockSchema).default([]),
        right: z.array(CultureBlockSchema).default([]),
      })
      .optional(),
    faqExtra: z
      .array(z.object({ q: z.string(), a: z.string() }))
      .default([]),
    analytics: z
      .object({ plausibleDomain: z.string().optional() })
      .default({}),
  })
  .superRefine((cfg, ctx) => {
    for (const country of cfg.countries.list) {
      if (!country.enabled) continue;
      for (const method of country.methods) {
        if (method.enabled && !country.enabled) {
          ctx.addIssue({
            code: "custom",
            message: `Method ${method.id} enabled in disabled country ${country.code}`,
            path: ["countries", "list"],
          });
        }
      }
    }
    if (!cfg.telegram.deskUrl) {
      ctx.addIssue({
        code: "custom",
        message: "telegram.deskUrl is required",
        path: ["telegram", "deskUrl"],
      });
    }

    const chain = getChain(cfg.token.chainId);
    const contract = cfg.token.contract;
    if (chain?.kind === "evm") {
      if (!/^0x[a-fA-F0-9]{40}$/.test(contract)) {
        ctx.addIssue({
          code: "custom",
          message: "EVM token.contract must be a 0x-prefixed 20-byte hex address",
          path: ["token", "contract"],
        });
      }
    } else if (chain?.kind === "xrpl") {
      if (contract.toLowerCase() !== "xrp") {
        ctx.addIssue({
          code: "custom",
          message: "XRPL native asset token.contract must be \"xrp\"",
          path: ["token", "contract"],
        });
      }
    }
  });

export type ShopConfig = z.infer<typeof ShopConfigSchema>;
export type ShopConfigInput = z.input<typeof ShopConfigSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type CountryConfig = z.infer<typeof CountrySchema>;

/** Banned marketing words (section 12). */
export const BANNED_COPY = [
  "moon",
  "100x",
  "guaranteed",
  "profit",
  "get rich",
  "risk-free",
  "to the moon",
  "pump",
  "lambo",
  "don't miss out",
  "last chance",
] as const;

export function lintCopy(text: string): string[] {
  const lower = text.toLowerCase();
  return BANNED_COPY.filter((w) => lower.includes(w));
}

export function lintShopConfig(cfg: ShopConfigInput): string[] {
  const cultureBlobs =
    cfg.culture == null
      ? []
      : [
          cfg.culture.brandLine,
          cfg.culture.roar ?? "",
          ...(cfg.culture.marquee ?? []),
          ...(cfg.culture.left ?? []).flatMap((b) => cultureBlockText(b)),
          ...(cfg.culture.right ?? []).flatMap((b) => cultureBlockText(b)),
        ];
  const blobs: string[] = [
    cfg.token.description,
    cfg.brand.headline ?? "",
    cfg.brand.subline ?? "",
    ...(cfg.faqExtra ?? []).flatMap((f) => [f.q, f.a]),
    ...cultureBlobs,
  ];
  const hits: string[] = [];
  for (const blob of blobs) {
    hits.push(...lintCopy(blob));
  }
  return [...new Set(hits)];
}

function cultureBlockText(
  block: z.input<typeof CultureBlockSchema>,
): string[] {
  switch (block.type) {
    case "quote":
      return [block.text, block.by ?? ""];
    case "blurb":
      return [block.title, block.body];
    case "pulse":
      return [block.label, block.detail];
    case "post":
      return [block.title, block.body, block.source ?? ""];
    case "cta":
      return [block.label];
  }
}

export type CultureBlock = z.infer<typeof CultureBlockSchema>;
