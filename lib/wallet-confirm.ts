/**
 * The buyer confirms the exact wallet (and XRPL destination tag) before an order is created.
 * A confirmation belongs to one address + tag: editing either clears it.
 */
export function walletConfirmKey(address: string, destinationTag: string | null | undefined): string {
  return `${address.trim()}|${(destinationTag ?? "").trim()}`;
}

/** Address in groups of four so a buyer can compare it with their wallet app, start and end first. */
export function walletAddressGroups(address: string): string[] {
  const clean = address.trim();
  const groups: string[] = [];
  for (let i = 0; i < clean.length; i += 4) groups.push(clean.slice(i, i + 4));
  return groups;
}
