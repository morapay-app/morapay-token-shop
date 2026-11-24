import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoDepositInstructions } from "@/components/SellWidget/MemoDepositInstructions";

const ADDR = "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";

afterEach(cleanup);

function renderIt() {
  return render(
    <MemoDepositInstructions
      ticker="PI"
      networkName="Pi Network"
      depositAddress={ADDR}
      depositMemo="K7Q2M9XA"
      depositAmount="12.5"
      orderRef="MP-REF-1"
    />,
  );
}

describe("Pi sell deposit step", () => {
  it("shows our address, the exact amount and the memo", () => {
    renderIt();
    expect(screen.getByTestId("deposit-memo")).toHaveTextContent("K7Q2M9XA");
    expect(screen.getByTestId("deposit-amount")).toHaveTextContent("12.5 PI");
    expect(screen.getByTestId("deposit-address")).toHaveTextContent(ADDR);
    expect(screen.getByText(/Memo \(required\)/)).toBeInTheDocument();
    expect(screen.getByText(/missing or wrong memo means your payment is held for review/i)).toBeInTheDocument();
    expect(screen.getByText(/Ref MP-REF-1/)).toBeInTheDocument();
  });

  it("copies the memo, amount and address", () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    renderIt();
    fireEvent.click(screen.getByRole("button", { name: "Copy memo" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy amount" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy address" }));
    expect(writeText).toHaveBeenNthCalledWith(1, "K7Q2M9XA");
    expect(writeText).toHaveBeenNthCalledWith(2, "12.5");
    expect(writeText).toHaveBeenNthCalledWith(3, ADDR);
  });

  it("names no provider", () => {
    const { container } = renderIt();
    expect(container.textContent).not.toMatch(/mexc|quidax|squid/i);
  });
});
