import { describe, expect, it } from "vitest";
import { parseBankDeposit } from "@/lib/morapay/bank-deposit";

const confirm = {
  method: "bank",
  requiresOtp: false,
  instructions: "Customer should send the exact amount to the bank account below.",
  bankDeposit: {
    bankName: "fidelity",
    accountNumber: "4574745751",
    accountName: "PAY - THE AFRICAN MEME",
    amount: "5000.00",
    reference: "BANK_ACCOUNT_d3376bc7",
    expiresAt: "2026-11-25T05:18:27.189Z",
  },
  networkCorrectedFromHint: false,
};

describe("bank deposit", () => {
  it("reads the real confirmOnramp shape: bankDeposit is the payment object, details one level deeper", () => {
    const confirmed = { reference: "r", status: "PENDING", bankDeposit: confirm, payment: confirm };
    expect(parseBankDeposit(confirmed, "ngn")?.accountNumber).toBe("4574745751");
  });

  it("keeps only what the payer needs, in plain words", () => {
    expect(parseBankDeposit(confirm, "ngn")).toEqual({
      bankName: "Fidelity Bank",
      accountNumber: "4574745751",
      accountName: "Pay - The African Meme",
      amount: "5000.00",
      currency: "NGN",
      expiresAt: "2026-11-25T05:18:27.189Z",
    });
  });
  it("refuses incomplete details instead of showing a partial account", () => {
    expect(parseBankDeposit({ bankDeposit: { bankName: "fidelity", amount: "1" } }, "ngn")).toBeNull();
  });
});
