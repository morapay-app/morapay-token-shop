import type { ShopConfigInput } from "./schema";

type Country = ShopConfigInput["countries"]["list"][number];
type Method = Country["methods"][number];
type Caps = Country["caps"];

const bankTransfer: Method = {
  id: "bank_transfer",
  kind: "bank_transfer",
  label: "Bank transfer",
  enabled: true,
};
const bankTransferOff: Method = { ...bankTransfer, enabled: false };
/** Listed but off, so it can be switched on per shop. */
const cardOff: Method = { id: "card", kind: "card", label: "Card", enabled: false };

/** Ghana mobile networks, as core issues them. */
const ghanaMomo: Method[] = [
  {
    id: "momo_mtn",
    kind: "mobile_money",
    label: "MTN MoMo",
    enabled: true,
    networkProvider: "MTN",
    institutionCode: "0004",
    phonePrefixes: ["024", "025", "053", "054", "055", "059"],
  },
  {
    id: "momo_telecel",
    kind: "mobile_money",
    label: "Telecel Cash",
    enabled: true,
    networkProvider: "Vodafone",
    institutionCode: "0006",
    phonePrefixes: ["020", "050"],
  },
  {
    id: "momo_airteltigo",
    kind: "mobile_money",
    label: "AirtelTigo Money",
    enabled: true,
    networkProvider: "AirtelTigo",
    institutionCode: "0005",
    phonePrefixes: ["026", "027", "056", "057"],
  },
];

export function ghana(opts: { caps?: Caps; card?: boolean } = {}): Country {
  return {
    code: "GH",
    currency: "GHS",
    enabled: true,
    quickAmounts: [50, 100, 200, 500],
    caps: opts.caps ?? { minFiat: 50, maxFiat: 2900 },
    methods: [...ghanaMomo, bankTransfer, ...(opts.card ? [cardOff] : [])],
  };
}

export function nigeria(opts: { caps?: Caps } = {}): Country {
  return {
    code: "NG",
    currency: "NGN",
    enabled: true,
    quickAmounts: [5000, 10000, 25000, 50000],
    caps: opts.caps ?? { minFiat: 3000, maxFiat: 5000000 },
    methods: [bankTransfer],
  };
}

/** Shown in config only: not open yet. */
export const plannedMarkets: Country[] = [
  {
    code: "KE",
    currency: "KES",
    enabled: false,
    methods: [
      { id: "mpesa", kind: "mobile_money", label: "M-Pesa", enabled: false },
      bankTransferOff,
    ],
  },
  {
    code: "ZA",
    currency: "ZAR",
    enabled: false,
    methods: [{ ...bankTransferOff, label: "Bank transfer (EFT)" }],
  },
  {
    code: "CI",
    currency: "XOF",
    enabled: false,
    methods: [
      { id: "momo_orange", kind: "mobile_money", label: "Orange Money", enabled: false },
    ],
  },
  {
    code: "UG",
    currency: "UGX",
    enabled: false,
    methods: [
      { id: "momo_mtn_ug", kind: "mobile_money", label: "MTN MoMo", enabled: false },
    ],
  },
];
