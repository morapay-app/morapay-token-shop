export type PhoneParse =
  | { ok: true; local: string; e164: string; networkHint?: "MTN" | "Vodafone" | "AirtelTigo" }
  | { ok: false; reason: string };

const MTN = ["024", "025", "053", "054", "055", "059"];
const TELECEL = ["020", "050"];
const AIRTELTIGO = ["026", "027", "056", "057"];

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

function networkFromPrefix(
  local: string,
): "MTN" | "Vodafone" | "AirtelTigo" | undefined {
  const p = local.slice(0, 3);
  if (MTN.includes(p)) return "MTN";
  if (TELECEL.includes(p)) return "Vodafone";
  if (AIRTELTIGO.includes(p)) return "AirtelTigo";
  return undefined;
}

/**
 * Ghana phone: accept 024…, +23324…, 23324… → local 0XXXXXXXXX (10 digits).
 */
export function parseGhanaPhone(input: string): PhoneParse {
  let d = digitsOnly(input);
  if (d.startsWith("233")) d = d.slice(3);
  if (d.length === 9 && !d.startsWith("0")) d = `0${d}`;
  if (d.length !== 10 || !d.startsWith("0")) {
    return {
      ok: false,
      reason: "Enter a valid Ghana number (10 digits, e.g. 0241234567).",
    };
  }
  return {
    ok: true,
    local: d,
    e164: `+233${d.slice(1)}`,
    networkHint: networkFromPrefix(d),
  };
}

export function parsePhoneForCountry(
  input: string,
  countryCode: string,
): PhoneParse {
  if (countryCode === "GH") return parseGhanaPhone(input);
  const d = digitsOnly(input);
  if (d.length < 9) {
    return { ok: false, reason: "Enter a valid phone number." };
  }
  return { ok: true, local: d, e164: d.startsWith("+") ? input : `+${d}` };
}

export function maskPhone(phone: string): string {
  const d = digitsOnly(phone);
  if (d.length < 7) return "****";
  return `${d.slice(0, 3)}****${d.slice(-3)}`;
}
