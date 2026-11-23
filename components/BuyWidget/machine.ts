export type BuyStep =
  | "amount"
  | "payment"
  | "wallet"
  | "review"
  | "submitting"
  | "awaiting_prompt"
  | "otp"
  | "bank_deposit"
  | "delivering"
  | "completed"
  | "error"
  | "still_processing"
  | "fallback";

export type QuoteView = {
  quoteId: string;
  expiresAt: string;
  exchangeRate?: string;
  inputAmount: string;
  inputCurrency: string;
  outputAmount: string;
  outputCurrency: string;
  totalFee?: string | number;
};

export type BuyState = {
  step: BuyStep;
  country: string;
  currency: string;
  amount: string;
  methodId: string;
  methodKind: "mobile_money" | "bank_transfer" | "card" | "";
  networkProvider: string;
  phone: string;
  customerName: string;
  wallet: string;
  payoutDestinationTag: string;
  quote: QuoteView | null;
  acceptedRisk: boolean;
  ref: string | null;
  bankDeposit: Record<string, unknown> | null;
  otp: string;
  error: string | null;
  errorCode: string | null;
  retryAfterSec: number | null;
  txHash: string | null;
  explorerUrl: string | null;
  fallback: boolean;
  showNameField: boolean;
};

export type BuyAction =
  | { type: "HYDRATE"; payload: Partial<BuyState> }
  | { type: "SET_COUNTRY"; country: string; currency: string }
  | { type: "SET_AMOUNT"; amount: string }
  | { type: "SET_QUOTE"; quote: QuoteView | null }
  | { type: "SET_METHOD"; methodId: string; methodKind: BuyState["methodKind"]; networkProvider?: string }
  | { type: "SET_PHONE"; phone: string; networkHint?: string }
  | { type: "SET_NETWORK"; networkProvider: string }
  | { type: "SET_NAME"; customerName: string }
  | { type: "SET_WALLET"; wallet: string }
  | { type: "SET_DESTINATION_TAG"; payoutDestinationTag: string }
  | { type: "SET_RISK"; accepted: boolean }
  | { type: "SET_OTP"; otp: string }
  | { type: "GOTO"; step: BuyStep }
  | { type: "SUBMIT_START" }
  | {
      type: "SUBMIT_OK";
      ref: string;
      nextStep: BuyStep;
      bankDeposit?: Record<string, unknown> | null;
    }
  | {
      type: "SUBMIT_ERR";
      message: string;
      code?: string;
      retryAfterSec?: number;
      backToPayment?: boolean;
    }
  | { type: "STATUS"; phase: string; txHash?: string; explorerUrl?: string; message?: string }
  | { type: "ENABLE_FALLBACK" };

export const initialBuyState = (country: string, currency: string): BuyState => ({
  step: "amount",
  country,
  currency,
  amount: "",
  methodId: "",
  methodKind: "",
  networkProvider: "",
  phone: "",
  customerName: "",
  wallet: "",
  payoutDestinationTag: "",
  quote: null,
  acceptedRisk: false,
  ref: null,
  bankDeposit: null,
  otp: "",
  error: null,
  errorCode: null,
  retryAfterSec: null,
  txHash: null,
  explorerUrl: null,
  fallback: false,
  showNameField: false,
});

export function buyReducer(state: BuyState, action: BuyAction): BuyState {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, ...action.payload };
    case "SET_COUNTRY":
      return {
        ...state,
        country: action.country,
        currency: action.currency,
        methodId: "",
        methodKind: "",
        networkProvider: "",
        quote: null,
        amount: state.amount,
      };
    case "SET_AMOUNT":
      return { ...state, amount: action.amount, quote: null };
    case "SET_QUOTE":
      return { ...state, quote: action.quote };
    case "SET_METHOD":
      return {
        ...state,
        methodId: action.methodId,
        methodKind: action.methodKind,
        networkProvider: action.networkProvider ?? state.networkProvider,
      };
    case "SET_PHONE":
      return {
        ...state,
        phone: action.phone,
        networkProvider: action.networkHint ?? state.networkProvider,
      };
    case "SET_NETWORK":
      return { ...state, networkProvider: action.networkProvider };
    case "SET_NAME":
      return { ...state, customerName: action.customerName };
    case "SET_WALLET":
      return { ...state, wallet: action.wallet };
    case "SET_DESTINATION_TAG":
      return { ...state, payoutDestinationTag: action.payoutDestinationTag };
    case "SET_RISK":
      return { ...state, acceptedRisk: action.accepted };
    case "SET_OTP":
      return { ...state, otp: action.otp };
    case "GOTO":
      return { ...state, step: action.step, error: null, errorCode: null };
    case "SUBMIT_START":
      return { ...state, step: "submitting", error: null, errorCode: null };
    case "SUBMIT_OK":
      return {
        ...state,
        step: action.nextStep,
        ref: action.ref,
        bankDeposit: action.bankDeposit ?? null,
        error: null,
      };
    case "SUBMIT_ERR":
      return {
        ...state,
        step: action.backToPayment ? "payment" : "error",
        error: action.message,
        errorCode: action.code ?? null,
        retryAfterSec: action.retryAfterSec ?? null,
        showNameField:
          action.backToPayment &&
          (action.code === "name_mismatch" ||
            action.code === "account_lookup_failed")
            ? true
            : state.showNameField,
      };
    case "STATUS": {
      if (action.phase === "completed") {
        return {
          ...state,
          step: "completed",
          txHash: action.txHash ?? null,
          explorerUrl: action.explorerUrl ?? null,
        };
      }
      if (action.phase === "failed" || action.phase === "cancelled") {
        return {
          ...state,
          step: "error",
          error: action.message ?? "Order failed.",
        };
      }
      // Soft delay: keep waiting with the countdown until the client hits 11 min.
      if (action.phase === "delayed") {
        return {
          ...state,
          step: "delivering",
          error: action.message ?? state.error,
        };
      }
      if (action.phase === "delivering") {
        return { ...state, step: "delivering", error: null };
      }
      return state;
    }
    case "ENABLE_FALLBACK":
      return { ...state, fallback: true, step: "fallback" };
    default:
      return state;
  }
}
