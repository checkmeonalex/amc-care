export type LabValue = {
  test: string;
  value: string;
  numericValue: number | null;
  unit: string;
  referenceRange: string;
  status: "normal" | "high" | "low" | "critical" | "unknown";
};

// Units we recognise — order matters (longer first to avoid partial matches)
const UNITS_PATTERN =
  "(?:x10[³3]|×10[³3])?\\s*(?:" +
  [
    "mmol/L", "mmol/l",
    "µmol/L", "µmol/l", "umol/L", "umol/l",
    "mg/dL",  "mg/dl",
    "mg/L",   "mg/l",
    "g/dL",   "g/dl",
    "g/L",    "g/l",
    "IU/L",   "IU/l",
    "U/L",    "U/l",
    "mIU/mL", "mIU/ml",
    "mIU/L",  "mIU/l",
    "ng/mL",  "ng/ml",
    "ng/dL",  "ng/dl",
    "pg/mL",  "pg/ml",
    "nmol/L", "nmol/l",
    "pmol/L", "pmol/l",
    "fL",     "fl",
    "pg",
    "%",
    "K/µL",   "K/uL",
    "10\\^3/µL", "10\\^3/uL",
    "10\\^6/µL", "10\\^6/uL",
    "cells/µL", "cells/uL",
    "mm/hr",
    "seconds", "sec",
    "ratio",
  ].join("|") +
  ")";

// Reference range: e.g. (70–100), [70-100], 70-100, 3.5 - 5.0
const REF_RANGE_PATTERN =
  "(?:[\\(\\[\\{]\\s*)?" +
  "(?:\\d+(?:\\.\\d+)?\\s*[-–—]\\s*\\d+(?:\\.\\d+)?)" +
  "(?:\\s*" + UNITS_PATTERN + ")?" +
  "(?:\\s*[\\)\\]\\}])?";

// Main extraction pattern:  test name  :  value  unit  (ref range)
const LINE_PATTERN = new RegExp(
  "^([A-Za-z][A-Za-z0-9 /\\-_().,&]+?)\\s*" +  // test name
  "[:=]?\\s*" +
  "([<>]?\\s*\\d+(?:[.,]\\d+)?)\\s*" +          // value (optional < >)
  "(" + UNITS_PATTERN + ")?\\s*" +              // unit (optional)
  "(" + REF_RANGE_PATTERN + ")?$",              // ref range (optional)
  "i"
);

// Tab-separated layout line:  test \t value  unit  \t  ref range
const TAB_PATTERN = new RegExp(
  "^([A-Za-z][A-Za-z0-9 /\\-_().,&]+?)\\t" +
  "([<>]?\\s*\\d+(?:[.,]\\d+)?)\\s*(" + UNITS_PATTERN + ")?\\t?" +
  "(" + REF_RANGE_PATTERN + ")?$",
  "i"
);

function parseNumeric(raw: string): number | null {
  const cleaned = raw.replace(/[<>]/g, "").replace(",", ".").trim();
  const n = parseFloat(cleaned);
  return isFinite(n) ? n : null;
}

function extractFromLine(line: string): LabValue | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 4) return null;

  for (const pattern of [TAB_PATTERN, LINE_PATTERN]) {
    const m = trimmed.match(pattern);
    if (!m) continue;

    const test  = m[1].trim().replace(/\s+/g, " ");
    const value = m[2].trim();
    const unit  = (m[3] ?? "").trim();
    const ref   = (m[4] ?? "").replace(/[()[\]{}]/g, "").trim();

    if (test.split(/\s+/).length > 6) continue; // too many words → not a test name

    return {
      test,
      value,
      numericValue: parseNumeric(value),
      unit,
      referenceRange: ref,
      status: "unknown", // filled in by validator
    };
  }

  return null;
}

export function parseLabValues(text: string): LabValue[] {
  const results: LabValue[] = [];
  const seen = new Set<string>();

  for (const line of text.split("\n")) {
    const entry = extractFromLine(line);
    if (!entry) continue;

    const key = entry.test.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(entry);
  }

  return results;
}
