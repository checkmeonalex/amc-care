import type { LabValue } from "./medical-parser";

type Range = { lo: number; hi: number; critLo?: number; critHi?: number };

// Reference ranges (adult, sex-neutral where possible, SI/conventional mixed).
// Units intentionally omitted — we match by test name only since OCR units are unreliable.
const REFERENCE_RANGES: Record<string, Range> = {
  // Glucose
  "glucose":              { lo: 3.9,  hi: 5.6,  critLo: 2.2,  critHi: 27.8  },
  "fasting glucose":      { lo: 3.9,  hi: 5.6,  critLo: 2.2,  critHi: 27.8  },
  "random glucose":       { lo: 3.9,  hi: 11.1, critLo: 2.2,  critHi: 27.8  },
  "hba1c":                { lo: 4.0,  hi: 5.7                                 },

  // CBC
  "hemoglobin":           { lo: 12.0, hi: 17.5, critLo: 7.0,  critHi: 20.0  },
  "haematocrit":          { lo: 36.0, hi: 52.0, critLo: 18.0, critHi: 60.0  },
  "hematocrit":           { lo: 36.0, hi: 52.0, critLo: 18.0, critHi: 60.0  },
  "wbc":                  { lo: 4.0,  hi: 11.0, critLo: 2.0,  critHi: 30.0  },
  "rbc":                  { lo: 4.0,  hi: 6.2,  critLo: 2.0,  critHi: 8.0   },
  "platelets":            { lo: 150,  hi: 400,  critLo: 50,   critHi: 1000  },
  "mcv":                  { lo: 80,   hi: 100                                 },
  "mch":                  { lo: 27,   hi: 33                                  },
  "mchc":                 { lo: 32,   hi: 36                                  },
  "neutrophils":          { lo: 1.8,  hi: 7.5                                 },
  "lymphocytes":          { lo: 1.0,  hi: 4.8                                 },

  // Metabolic / electrolytes
  "sodium":               { lo: 136,  hi: 145,  critLo: 120,  critHi: 160   },
  "potassium":            { lo: 3.5,  hi: 5.0,  critLo: 2.5,  critHi: 6.5   },
  "chloride":             { lo: 98,   hi: 106,  critLo: 80,   critHi: 115   },
  "bicarbonate":          { lo: 22,   hi: 29,   critLo: 10,   critHi: 40    },
  "calcium":              { lo: 2.1,  hi: 2.6,  critLo: 1.6,  critHi: 3.5   },
  "magnesium":            { lo: 0.7,  hi: 1.1                                 },
  "phosphorus":           { lo: 0.8,  hi: 1.5                                 },
  "uric acid":            { lo: 150,  hi: 420                                 },
  "bun":                  { lo: 2.5,  hi: 7.1                                 },
  "creatinine":           { lo: 53,   hi: 115,  critLo: 0,    critHi: 884   },
  "egfr":                 { lo: 60,   hi: 999                                 },

  // Proteins
  "albumin":              { lo: 35,   hi: 52                                  },
  "total protein":        { lo: 64,   hi: 83                                  },

  // Liver
  "alt":                  { lo: 7,    hi: 40,   critHi: 1000                 },
  "ast":                  { lo: 10,   hi: 40,   critHi: 1000                 },
  "alp":                  { lo: 44,   hi: 147                                 },
  "ggt":                  { lo: 9,    hi: 48                                  },
  "bilirubin":            { lo: 0,    hi: 20,   critHi: 300                  },
  "direct bilirubin":     { lo: 0,    hi: 5                                   },

  // Lipids
  "cholesterol":          { lo: 0,    hi: 5.2                                 },
  "ldl":                  { lo: 0,    hi: 2.6                                 },
  "hdl":                  { lo: 1.0,  hi: 99                                  },
  "triglycerides":        { lo: 0,    hi: 1.7                                 },

  // Thyroid
  "tsh":                  { lo: 0.4,  hi: 4.0,  critLo: 0.01, critHi: 100   },
  "t4":                   { lo: 58,   hi: 154                                 },
  "t3":                   { lo: 1.2,  hi: 2.7                                 },
  "free t4":              { lo: 9.0,  hi: 24.0                                },
  "free t3":              { lo: 3.1,  hi: 6.8                                 },

  // Iron
  "ferritin":             { lo: 20,   hi: 250                                 },
  "iron":                 { lo: 10.6, hi: 28.3                                },

  // Coagulation
  "pt":                   { lo: 11,   hi: 13.5, critHi: 30                   },
  "inr":                  { lo: 0.8,  hi: 1.2,  critHi: 5                    },
  "aptt":                 { lo: 25,   hi: 35,   critHi: 100                  },
  "fibrinogen":           { lo: 2.0,  hi: 4.0                                 },
  "d-dimer":              { lo: 0,    hi: 0.5                                 },

  // Inflammation
  "crp":                  { lo: 0,    hi: 5                                   },
  "esr":                  { lo: 0,    hi: 20                                  },

  // Cardiac
  "troponin i":           { lo: 0,    hi: 0.04, critHi: 2.0                  },
  "troponin t":           { lo: 0,    hi: 0.014, critHi: 2.0                 },
};

function lookupRange(testName: string): Range | null {
  return REFERENCE_RANGES[testName.toLowerCase()] ?? null;
}

function classify(value: number, range: Range): LabValue["status"] {
  if (range.critLo !== undefined && value <= range.critLo) return "critical";
  if (range.critHi !== undefined && value >= range.critHi) return "critical";
  if (value < range.lo) return "low";
  if (value > range.hi) return "high";
  return "normal";
}

export type ValidationResult = {
  labValues: LabValue[];
  flagged: LabValue[];        // anything not "normal"
  criticals: LabValue[];      // life-threatening range
  confidence: number;         // 0–100, fraction of parseable values
};

export function validate(labValues: LabValue[]): ValidationResult {
  let parseable = 0;

  for (const entry of labValues) {
    if (entry.numericValue === null) continue;
    parseable++;

    const range = lookupRange(entry.test);
    if (!range) {
      // Try from ref range on the line itself
      if (entry.referenceRange) {
        const m = entry.referenceRange.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
        if (m) {
          const lo = parseFloat(m[1]);
          const hi = parseFloat(m[2]);
          if (isFinite(lo) && isFinite(hi)) {
            entry.status = classify(entry.numericValue, { lo, hi });
            continue;
          }
        }
      }
      entry.status = "unknown";
      continue;
    }

    entry.status = classify(entry.numericValue, range);
  }

  const flagged   = labValues.filter((v) => v.status !== "normal" && v.status !== "unknown");
  const criticals = labValues.filter((v) => v.status === "critical");
  const confidence = labValues.length > 0
    ? Math.round((parseable / labValues.length) * 100)
    : 0;

  return { labValues, flagged, criticals, confidence };
}
