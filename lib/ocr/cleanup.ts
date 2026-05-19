import Fuse from "fuse.js";

// Canonical medical terms — what we want OCR output normalised to
const MEDICAL_TERMS = [
  // CBC
  "Hemoglobin", "Haematocrit", "Hematocrit", "WBC", "RBC", "Platelets",
  "MCV", "MCH", "MCHC", "Neutrophils", "Lymphocytes", "Monocytes",
  "Eosinophils", "Basophils",
  // Metabolic
  "Glucose", "BUN", "Creatinine", "eGFR", "Sodium", "Potassium",
  "Chloride", "Bicarbonate", "Calcium", "Phosphorus", "Magnesium",
  "Uric Acid", "Total Protein", "Albumin", "Globulin",
  // Liver
  "ALT", "AST", "ALP", "GGT", "Bilirubin", "Direct Bilirubin",
  "Indirect Bilirubin", "LDH",
  // Lipids
  "Cholesterol", "LDL", "HDL", "Triglycerides", "VLDL",
  "Non-HDL Cholesterol",
  // Thyroid
  "TSH", "T3", "T4", "Free T3", "Free T4", "Anti-TPO",
  // Cardiac
  "Troponin", "Troponin I", "Troponin T", "BNP", "NT-proBNP",
  "CK", "CK-MB", "Myoglobin",
  // Iron
  "Iron", "TIBC", "Ferritin", "Transferrin Saturation",
  // Diabetes
  "HbA1c", "Fasting Glucose", "Random Glucose", "Insulin", "C-Peptide",
  // Hormones
  "Cortisol", "ACTH", "FSH", "LH", "Oestradiol", "Estradiol",
  "Testosterone", "Progesterone", "Prolactin", "DHEA-S",
  // Vitamins
  "Vitamin D", "Vitamin B12", "Folate", "Vitamin A",
  // Urinalysis
  "Urine Protein", "Urine Creatinine", "Urine Glucose", "Urine pH",
  "Specific Gravity",
  // Infection
  "CRP", "ESR", "Procalcitonin",
  // Coagulation
  "PT", "INR", "PTT", "APTT", "Fibrinogen", "D-Dimer",
];

// Fuse index for fuzzy medical term correction
const fuse = new Fuse(MEDICAL_TERMS, {
  includeScore: true,
  threshold: 0.38,   // tighter = fewer false corrections
  minMatchCharLength: 3,
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const SymSpell = require("symspell");
const symspell = new SymSpell(2, SymSpell.Modes.TOP);

// Build SymSpell corpus from medical terms + common English words to avoid
// over-correcting real words into wrong ones
const corpusWords = [
  ...MEDICAL_TERMS.flatMap((t) => t.toLowerCase().split(/\s+/)),
  // common OCR-correct words that SymSpell must not alter
  "result", "results", "test", "value", "values", "range", "normal",
  "high", "low", "positive", "negative", "units", "date", "name",
  "patient", "report", "reference", "lab", "laboratory",
];
symspell.addWords(corpusWords.join(" "), "en");

function correctWord(word: string): string {
  if (word.length < 3) return word;
  const suggestions = symspell.lookup(word.toLowerCase());
  if (suggestions && suggestions.length > 0) {
    const top = suggestions[0].suggestion as string;
    // Only apply if it differs by at most 1 character (conservative)
    const diff = Math.abs(top.length - word.length);
    if (diff <= 1 && top !== word.toLowerCase()) {
      // Preserve original capitalisation style
      if (word[0] === word[0].toUpperCase()) {
        return top[0].toUpperCase() + top.slice(1);
      }
      return top;
    }
  }
  return word;
}

function normaliseMedicalTerm(phrase: string): string {
  const results = fuse.search(phrase);
  if (results.length > 0 && results[0].score !== undefined && results[0].score < 0.25) {
    return results[0].item;
  }
  return phrase;
}

export function cleanupText(raw: string): string {
  const lines = raw.split("\n");
  const cleaned: string[] = [];

  for (const line of lines) {
    // Split on tabs (column separators) and spaces
    const segments = line.split("\t");
    const cleanedSegments = segments.map((seg) => {
      // Try medical term normalisation on each segment first
      const trimmed = seg.trim();
      if (trimmed.length === 0) return "";

      const normalised = normaliseMedicalTerm(trimmed);
      if (normalised !== trimmed) return normalised;

      // Otherwise word-level spell correction
      return trimmed
        .split(/(\s+)/)
        .map((token) => (/\s/.test(token) ? token : correctWord(token)))
        .join("");
    });

    cleaned.push(cleanedSegments.join("\t"));
  }

  return cleaned.join("\n");
}
