import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

process.env.SHOP_ID = "pi";

/** /api/config as the Pi shop serves it: country caps AND PCM's own caps (both set = the loop case). */
const CONFIG = {
  success: true,
  data: {
    shopId: "pi",
    token: { name: "Pi", ticker: "PI", chainId: 31415926, contract: "pi", decimals: 7, logo: "/brand/pi/logo.svg" },
    tokens: [
      { ticker: "PI", name: "Pi", label: "PI", chainId: 31415926, chainName: "Pi Network", contract: "pi", decimals: 7, logo: "/p.svg", buy: false, sell: false, comingSoon: true },
      {
        ticker: "PCM",
        name: "PCM",
        label: "PCM · OP",
        chainId: 10,
        chainName: "Optimism",
        contract: "0xD0CF4dE352aC8dccE00bD6B93EE73D3Cb272edC3",
        decimals: 18,
        logo: "/pcm.png",
        buy: true,
        sell: true,
        comingSoon: false,
        buyCaps: { GHS: { minFiat: 50, maxFiat: 1500 } },
      },
    ],
    sellEnabled: true,
    brand: { accent: "#7c3aed", headline: "Buy PCM", subline: "" },
    defaultCountry: "GH",
    detectedCountry: "GH",
    countries: [
      {
        code: "GH",
        currency: "GHS",
        enabledInConfig: true,
        liveSupported: true,
        selectable: true,
        quickAmounts: [50, 100],
        caps: { minFiat: 50, maxFiat: 2900 },
        buyLimits: { minFiat: 50, maxFiat: 2900 },
        methods: [{ id: "momo_mtn", kind: "mobile_money", label: "MTN MoMo", enabled: true, selectable: true, comingSoon: false }],
      },
    ],
    fallback: false,
    setupRequired: false,
    merchantSigning: true,
    fees: { showFeeLine: true },
    telegram: {},
  },
};

const QUOTE = {
  success: true,
  data: {
    quoteId: "q1",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    exchangeRate: "1 PCM ≈ 0.27 GHS",
    usdValue: "3.62",
    input: { amount: "50.00", currency: "GHS" },
    output: { amount: "183.09", currency: "PCM", chain: "10" },
  },
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("buy quote with country and token caps (Pi shop PCM)", () => {
  it("asks for the quote once and stops loading", async () => {
    let quotes = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).startsWith("/api/config")) return new Response(JSON.stringify(CONFIG));
        if (String(url).startsWith("/api/quote")) {
          quotes += 1;
          return new Response(JSON.stringify(QUOTE));
        }
        return new Response(JSON.stringify({ success: true, data: {} }));
      }),
    );
    const { BuyWidget } = await import("@/components/BuyWidget/BuyWidget");
    render(<BuyWidget />);
    await screen.findByLabelText(/amount/i).catch(() => null);
    const input = document.getElementById("amount") as HTMLInputElement;
    expect(input).toBeTruthy();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await act(async () => {
      fireEvent.change(input, { target: { value: "50" } });
    });
    // Several quote debounce windows (400 ms) and renders: a loop would keep re-requesting.
    for (let i = 0; i < 8; i += 1) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
    }
    expect(quotes).toBe(1);
    expect(await screen.findByText(/183\.09/)).toBeTruthy();
  });
});
