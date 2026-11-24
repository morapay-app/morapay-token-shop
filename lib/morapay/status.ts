export type RampPhase =
  | "in_progress"
  | "delivering"
  | "completed"
  | "failed"
  | "cancelled"
  | "delayed";

export type TransactionLike = {
  status?: string | null;
  deliveryStatus?: string | null;
  distributionStatus?: string | null;
  settlementMode?: string | null;
  txHash?: string | null;
  /** Merchant API shape: the delivery leg is nested. */
  delivery?: { status?: string | null; txHash?: string | null } | null;
  errorMessage?: string | null;
};

/**
 * Port of app.morapay.io isRampFullySettled (section 6.6).
 */
export function interpretStatus(tx: TransactionLike): {
  phase: RampPhase;
  txHash?: string;
  message?: string;
} {
  const status = (tx.status ?? "").toUpperCase();
  const delivery = (
    tx.deliveryStatus ??
    tx.delivery?.status ??
    tx.distributionStatus ??
    "NONE"
  ).toUpperCase();
  const settlement = (tx.settlementMode ?? "DIRECT").toUpperCase();

  if (status === "FAILED") {
    return { phase: "failed", message: tx.errorMessage ?? undefined };
  }
  if (status === "CANCELLED" || status === "CANCELED") {
    return { phase: "cancelled", message: tx.errorMessage ?? undefined };
  }

  if (delivery === "FAILED") {
    if (["PAID", "COMPLETED", "SETTLED"].includes(status)) {
      return {
        phase: "delayed",
        message: "Delivery delayed — support will contact you.",
      };
    }
    return { phase: "failed", message: tx.errorMessage ?? undefined };
  }

  if (status !== "COMPLETED") {
    if (["PAID", "SETTLED"].includes(status) && delivery !== "COMPLETED") {
      return { phase: "delivering" };
    }
    return { phase: "in_progress" };
  }

  if (["SWAPPING", "SENDING", "PENDING"].includes(delivery)) {
    return { phase: "delivering" };
  }

  if (settlement === "HUB_SWAP" && delivery !== "COMPLETED") {
    return { phase: "delivering" };
  }

  return {
    phase: "completed",
    txHash: tx.txHash ?? tx.delivery?.txHash ?? undefined,
  };
}
