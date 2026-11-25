import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/shop.config", async () => {
  const { ShopConfigSchema } = await import("@/config/schema");
  const { default: xrp } = await import("@/examples/xrp.config");
  const shopConfig = ShopConfigSchema.parse(xrp);
  return { shopConfig, default: shopConfig };
});

const BANKS = {
  ngn: [
    { code: "058", name: "GTBank", kind: "bank" },
    { code: "044", name: "Access Bank", kind: "bank" },
  ],
  ghs: [{ code: "0004", name: "MTN", kind: "mobile_money" }],
};

type Reply = Record<string, unknown>;
let resolve: (body: { bankCode: string; accountNumber: string }) => Promise<Reply> | Reply;
let resolveCalls: { bankCode: string; accountNumber: string }[];

const json = (body: Reply) => Promise.resolve({ json: async () => body } as Response);

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  resolveCalls = [];
  resolve = () => ({ success: true, data: { accountName: "ADA OBI" } });
  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    if (url === "/api/config") return json({ success: true, data: { fallback: false } });
    if (url === "/api/institutions?currency=ngn") return json({ success: true, data: { institutions: BANKS.ngn } });
    if (url === "/api/institutions?currency=ghs") return json({ success: true, data: { institutions: BANKS.ghs } });
    if (url === "/api/quote") return json({ success: true, data: { output: { amount: "900", currency: "NGN" } } });
    if (url === "/api/institutions/resolve") {
      const body = JSON.parse(String(init?.body));
      resolveCalls.push(body);
      return Promise.resolve(resolve(body)).then((r) => ({ json: async () => r }) as Response);
    }
    throw new Error(`unexpected ${url}`);
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function fill(currency: "NGN" | "GHS", pick: RegExp, account: string) {
  const { SellWidget } = await import("@/components/SellWidget/SellWidget");
  const user = userEvent.setup();
  render(<SellWidget />);
  await user.selectOptions(screen.getByLabelText("Payout currency"), currency);
  await user.type(screen.getByLabelText("XRP to sell"), "10");
  await choose(user, pick);
  await user.type(screen.getByLabelText(/Account number|Mobile money number/), account);
  await user.type(screen.getByLabelText("Your sending wallet"), "rDsbeomae4FXwgQTJp9Rs64Qg9vDiTCdBv");
  await screen.findByText(/You receive about/, undefined, { timeout: 5000 });
  return user;
}

async function choose(user: ReturnType<typeof userEvent.setup>, pick: RegExp) {
  const trigger = document.getElementById("sell-bank") as HTMLButtonElement;
  await waitFor(() => expect(trigger).toBeEnabled());
  await user.click(trigger);
  await user.click(await screen.findByRole("option", { name: pick }));
}

const cont = () => screen.getByRole("button", { name: "Continue" });

describe("account name check on sell", { timeout: 20_000 }, () => {
  it("shows the NGN holder and only then allows Continue", async () => {
    let release: (r: Reply) => void = () => undefined;
    resolve = () => new Promise<Reply>((r) => (release = r));
    await fill("NGN", /GTBank/, "0123456789");
    expect(await screen.findByText("Checking name…")).toBeInTheDocument();
    expect(cont()).toBeDisabled();
    release({ success: true, data: { accountName: "ADA OBI" } });
    expect(await screen.findByText("ADA OBI")).toBeInTheDocument();
    expect(cont()).toBeEnabled();
    expect(resolveCalls).toEqual([{ bankCode: "058", accountNumber: "0123456789" }]);
  });

  it("does not look up an incomplete number", async () => {
    await fill("NGN", /GTBank/, "012345678");
    expect(resolveCalls).toEqual([]);
    expect(cont()).toBeDisabled();
  });

  it("blocks Continue on failure and can retry", async () => {
    resolve = () => ({ success: false, message: "Couldn't verify this account. Check the bank and number." });
    const user = await fill("NGN", /GTBank/, "0123456789");
    expect(await screen.findByText(/Couldn't verify this account/)).toBeInTheDocument();
    expect(cont()).toBeDisabled();
    resolve = () => ({ success: true, data: { accountName: "ADA OBI" } });
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("ADA OBI")).toBeInTheDocument();
    expect(cont()).toBeEnabled();
  });

  it("blocks Continue when the name comes back empty or the request dies", async () => {
    resolve = () => ({ success: true, data: { accountName: "  " } });
    const user = await fill("NGN", /GTBank/, "0123456789");
    expect(await screen.findByText(/Name check is unavailable/)).toBeInTheDocument();
    resolve = () => Promise.reject(new Error("offline"));
    await user.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(resolveCalls.length).toBe(2));
    expect(await screen.findByText(/Name check is unavailable/)).toBeInTheDocument();
    expect(cont()).toBeDisabled();
  });

  it("drops the name when the number or bank changes", async () => {
    const user = await fill("NGN", /GTBank/, "0123456789");
    expect(await screen.findByText("ADA OBI")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Account number"), "{Backspace}");
    expect(screen.queryByText("ADA OBI")).toBeNull();
    expect(cont()).toBeDisabled();
    await user.type(screen.getByLabelText("Account number"), "9");
    expect(await screen.findByText("ADA OBI")).toBeInTheDocument();
    resolve = () => ({ success: false, message: "No." });
    await choose(user, /Access Bank/);
    expect(screen.queryByText("ADA OBI")).toBeNull();
    await waitFor(() => expect(resolveCalls.at(-1)).toEqual({ bankCode: "044", accountNumber: "0123456789" }));
    expect(cont()).toBeDisabled();
  });

  it("never looks up a GHS payout and leaves Continue as it was", async () => {
    await fill("GHS", /MTN MoMo/, "0241234567");
    expect(resolveCalls).toEqual([]);
    expect(cont()).toBeEnabled();
  });

  it("carries no bank or number across currencies", async () => {
    const user = await fill("GHS", /MTN MoMo/, "0241234567");
    await user.selectOptions(screen.getByLabelText("Payout currency"), "NGN");
    expect(screen.getByLabelText("Account number")).toHaveValue("");
    expect(document.getElementById("sell-bank")).toHaveTextContent("Choose one");
    expect(resolveCalls).toEqual([]);
  });
});
