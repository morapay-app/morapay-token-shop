/**
 * Pi shop: PI is "coming soon". It can be picked for a price, but neither flow continues past the
 * quote. PCM is unaffected.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";

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

const PI_QUOTE = {
  success: true,
  data: { ...QUOTE.data, quoteId: "qpi", exchangeRate: "1 PI ≈ 0.72 GHS", output: { amount: "693", currency: "PI", chain: "31415926" } },
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function stubFetch() {
  const quoteBodies: Array<Record<string, unknown>> = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const path = String(url);
      if (path.startsWith("/api/config")) return new Response(JSON.stringify(CONFIG));
      if (path.startsWith("/api/quote")) {
        const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
        quoteBodies.push(body);
        if (body.action === "OFFRAMP") {
          return new Response(JSON.stringify({ success: true, data: { ...QUOTE.data, output: { amount: "720", currency: "GHS", chain: "31415926" } } }));
        }
        return new Response(JSON.stringify(body.token === "PI" ? PI_QUOTE : QUOTE));
      }
      if (path.startsWith("/api/institutions")) {
        return new Response(JSON.stringify({ success: true, data: { institutions: [{ code: "MTN", name: "MTN", kind: "mobile_money" }] } }));
      }
      return new Response(JSON.stringify({ success: true, data: {} }));
    }),
  );
  return quoteBodies;
}

async function settle() {
  for (let i = 0; i < 4; i += 1) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
  }
}

const NOTE = "Live PI price. Orders open later.";

async function fillSellForm(wallet: string) {
  await act(async () => {
    fireEvent.click(document.getElementById("sell-bank")!);
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("option", { name: /MTN/ }));
  });
  await act(async () => {
    fireEvent.change(document.getElementById("sell-account")!, { target: { value: "0244123456" } });
    fireEvent.change(document.getElementById("sell-wallet")!, { target: { value: wallet } });
  });
  await settle();
}

describe("buy: PI coming soon", () => {
  it("prices PI from the picker but keeps Continue disabled", async () => {
    const quotes = stubFetch();
    const { BuyWidget } = await import("@/components/BuyWidget/BuyWidget");
    render(<BuyWidget />);
    const group = await screen.findByRole("radiogroup", { name: "Token" });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await act(async () => {
      fireEvent.click(within(group).getByRole("radio", { name: /PI/ }));
    });
    await act(async () => {
      fireEvent.change(document.getElementById("amount")!, { target: { value: "500" } });
    });
    await settle();
    expect(quotes.at(-1)).toMatchObject({ action: "ONRAMP", token: "PI" });
    expect(await screen.findByText(/693/)).toBeTruthy();
    expect(screen.getByText(NOTE)).toHaveAttribute("title");
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("PCM still continues as before", async () => {
    const quotes = stubFetch();
    const { BuyWidget } = await import("@/components/BuyWidget/BuyWidget");
    render(<BuyWidget />);
    await screen.findByRole("radiogroup", { name: "Token" });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await act(async () => {
      fireEvent.change(document.getElementById("amount")!, { target: { value: "50" } });
    });
    await settle();
    expect(quotes.at(-1)).toMatchObject({ token: "PCM" });
    expect(await screen.findByText(/183\.09/)).toBeTruthy();
    expect(screen.queryByText(NOTE)).toBeNull();
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });
});

describe("sell: PI coming soon", () => {
  it("prices a PI sell but keeps Continue disabled", async () => {
    const quotes = stubFetch();
    const { SellWidget } = await import("@/components/SellWidget/SellWidget");
    render(<SellWidget />);
    const group = await screen.findByRole("radiogroup", { name: "Token" });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await settle();
    await act(async () => {
      fireEvent.click(within(group).getByRole("radio", { name: /PI/ }));
    });
    await act(async () => {
      fireEvent.change(document.getElementById("sell-amount")!, { target: { value: "1000" } });
    });
    await fillSellForm("GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7");
    expect(quotes.at(-1)).toMatchObject({ action: "OFFRAMP", token: "PI" });
    expect(await screen.findByText(/720 GHS/)).toBeTruthy();
    expect(screen.getByText(NOTE)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("the same filled form continues for PCM, with no note", async () => {
    stubFetch();
    const { SellWidget } = await import("@/components/SellWidget/SellWidget");
    render(<SellWidget />);
    await screen.findByRole("radiogroup", { name: "Token" });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await settle();
    await act(async () => {
      fireEvent.change(document.getElementById("sell-amount")!, { target: { value: "1000" } });
    });
    await fillSellForm("0x8ba1f109551bD432803012645Ac136ddd64DBA72");
    expect(await screen.findByText(/720 GHS/)).toBeTruthy();
    expect(screen.queryByText(NOTE)).toBeNull();
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });
});
