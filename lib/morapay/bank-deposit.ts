/** The only bank transfer details a payer sees. Core's confirm response carries much more. */
export type BankDeposit = {
  bankName: string;
  accountNumber: string;
  accountName: string | null;
  amount: string;
  currency: string;
  expiresAt: string | null;
};

type Raw = Record<string, unknown>;
const obj = (v: unknown): Raw => (v && typeof v === "object" && !Array.isArray(v) ? (v as Raw) : {});
const str = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : typeof v === "number" ? String(v) : null;

const BANK_LABEL: Record<string, string> = {
  fidelity: "Fidelity Bank",
  wema: "Wema Bank",
  "wema bank": "Wema Bank",
  providus: "Providus Bank",
  sterling: "Sterling Bank",
  gtbank: "GTBank",
  access: "Access Bank",
  zenith: "Zenith Bank",
  uba: "UBA",
  "first bank": "First Bank",
  kuda: "Kuda",
  moniepoint: "Moniepoint",
  opay: "OPay",
  palmpay: "PalmPay",
};

function bankLabel(raw: string): string {
  const known = BANK_LABEL[raw.toLowerCase()];
  if (known) return known;
  return raw
    .split(/\s+/)
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w[0]!.toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
}

function nameLabel(raw: string): string {
  return raw
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w === "-" ? w : w[0]!.toUpperCase() + w.slice(1)))
    .join(" ");
}

/** Accepts the confirm response, its `bankDeposit`, or `paymentInstructions`; null when incomplete. */
export function parseBankDeposit(raw: unknown, currency: string): BankDeposit | null {
  const top = obj(raw);
  const d = obj(top.bankDeposit ?? top.bank_deposit ?? obj(top.payment).bankDeposit ?? top);
  const bankName = str(d.bankName ?? d.bank_name);
  const accountNumber = str(d.accountNumber ?? d.account_number);
  const amount = str(d.amount);
  if (!bankName || !accountNumber || !amount) return null;
  const accountName = str(d.accountName ?? d.account_name);
  return {
    bankName: bankLabel(bankName),
    accountNumber,
    accountName: accountName ? nameLabel(accountName) : null,
    amount,
    currency: (str(d.currency) ?? currency).toUpperCase(),
    expiresAt: str(d.expiresAt ?? d.expires_at ?? d.expiry_time),
  };
}
