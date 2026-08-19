/**
 * The dataset API's declared getValue() return type is a union (string | Date | number |
 * boolean | ...), but Choice and Two Options columns don't reliably come back as plain
 * number/boolean in every hosting context - sometimes as a numeric string, or an object
 * with a Value property. Coerce defensively instead of trusting a TS cast, since a wrong
 * assumption here silently produces a truthy-but-meaningless value (e.g. the string "false"
 * is truthy) rather than an error.
 */

function unwrapValue(raw: unknown): unknown {
  if (raw !== null && typeof raw === "object" && "Value" in (raw as Record<string, unknown>)) {
    return (raw as Record<string, unknown>).Value;
  }
  return raw;
}

export function coerceChoiceValue(raw: unknown): number | null {
  const v = unwrapValue(raw);
  if (v === null || v === undefined || v === "") {
    return null;
  }
  if (typeof v === "number") {
    return v;
  }
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export function coerceBooleanValue(raw: unknown): boolean | null {
  const v = unwrapValue(raw);
  if (v === null || v === undefined || v === "") {
    return null;
  }
  if (typeof v === "boolean") {
    return v;
  }
  if (typeof v === "number") {
    return v !== 0;
  }
  if (typeof v === "string") {
    const lower = v.toLowerCase();
    if (lower === "true" || lower === "1" || lower === "yes") {
      return true;
    }
    if (lower === "false" || lower === "0" || lower === "no") {
      return false;
    }
  }
  return null;
}

export function coerceStringValue(raw: unknown): string {
  const v = unwrapValue(raw);
  if (typeof v === "string") {
    return v;
  }
  if (typeof v === "number" || typeof v === "boolean") {
    return String(v);
  }
  return "";
}
