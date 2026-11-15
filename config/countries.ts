/** Default country / method catalogue. Shops toggle via shop.config.ts. */

export type CatalogueMethod = {
  id: string;
  kind: "mobile_money" | "bank_transfer" | "card";
  label: string;
  networkProvider?: string;
  institutionCode?: string;
  phonePrefixes?: string[];
};

export type CatalogueCountry = {
  code: string;
  name: string;
  currency: string;
  flag: string;
  methods: CatalogueMethod[];
};

export const COUNTRY_CATALOGUE: CatalogueCountry[] = [
  {
    code: "GH",
    name: "Ghana",
    currency: "GHS",
    flag: "🇬🇭",
    methods: [
      {
        id: "momo_mtn",
        kind: "mobile_money",
        label: "MTN MoMo",
        networkProvider: "MTN",
        institutionCode: "0004",
        phonePrefixes: ["024", "025", "053", "054", "055", "059"],
      },
      {
        id: "momo_telecel",
        kind: "mobile_money",
        label: "Telecel Cash",
        networkProvider: "Vodafone",
        institutionCode: "0006",
        phonePrefixes: ["020", "050"],
      },
      {
        id: "momo_airteltigo",
        kind: "mobile_money",
        label: "AirtelTigo Money",
        networkProvider: "AirtelTigo",
        institutionCode: "0005",
        phonePrefixes: ["026", "027", "056", "057"],
      },
      { id: "bank_transfer", kind: "bank_transfer", label: "Bank transfer" },
      { id: "card", kind: "card", label: "Card" },
    ],
  },
  {
    code: "NG",
    name: "Nigeria",
    currency: "NGN",
    flag: "🇳🇬",
    methods: [
      { id: "bank_transfer", kind: "bank_transfer", label: "Bank transfer" },
      { id: "card", kind: "card", label: "Card" },
      { id: "mobile_money", kind: "mobile_money", label: "Mobile money" },
    ],
  },
  {
    code: "KE",
    name: "Kenya",
    currency: "KES",
    flag: "🇰🇪",
    methods: [
      { id: "mpesa", kind: "mobile_money", label: "M-Pesa" },
      { id: "bank_transfer", kind: "bank_transfer", label: "Bank transfer" },
      { id: "card", kind: "card", label: "Card" },
    ],
  },
  {
    code: "ZA",
    name: "South Africa",
    currency: "ZAR",
    flag: "🇿🇦",
    methods: [
      {
        id: "bank_transfer",
        kind: "bank_transfer",
        label: "Bank transfer (EFT)",
      },
      { id: "card", kind: "card", label: "Card" },
    ],
  },
  {
    code: "CI",
    name: "Côte d'Ivoire",
    currency: "XOF",
    flag: "🇨🇮",
    methods: [
      { id: "momo_orange", kind: "mobile_money", label: "Orange Money" },
      { id: "momo_mtn", kind: "mobile_money", label: "MTN MoMo" },
      { id: "momo_wave", kind: "mobile_money", label: "Wave" },
      { id: "card", kind: "card", label: "Card" },
    ],
  },
  {
    code: "UG",
    name: "Uganda",
    currency: "UGX",
    flag: "🇺🇬",
    methods: [
      { id: "momo_mtn_ug", kind: "mobile_money", label: "MTN MoMo" },
      { id: "momo_airtel", kind: "mobile_money", label: "Airtel Money" },
    ],
  },
];

export function flagFor(code: string): string {
  return COUNTRY_CATALOGUE.find((c) => c.code === code)?.flag ?? "🌍";
}

export function nameFor(code: string): string {
  return COUNTRY_CATALOGUE.find((c) => c.code === code)?.name ?? code;
}
