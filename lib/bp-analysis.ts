import bpResultsCopy from "@/data/bp-results-copy.json";

export interface Reading {
  sys: number;
  dia: number;
  pulse?: number;
}

export type CategoryKey = "low" | "normal" | "elevated" | "stage1" | "stage2" | "crisis";

export interface Category {
  key: CategoryKey;
  label: string;
  color: string;
  bg: string;
  textColor: string;
  description: string;
  descriptionVariants: string[];
  meaningVariants: string[];
  recommendationVariants: string[];
  meaning: string;
  recommendation: string;
}

export interface BPAnalysis {
  readings: Reading[];
  usedReadings: Reading[];
  usedIndices: number[];
  flaggedIndex: number | null;
  firstExcluded: boolean;
  avg: { sys: number; dia: number; pulse?: number };
  category: Category;
  reliability: number;
  qualityLabel: string;
  measurementNotes: string[];
  warnings: string[];
  ageNote: string;
}

type TemplateParams = Record<string, string | number>;
type CategoryCopy = Omit<Category, "key" | "description" | "meaning" | "recommendation">;

const COPY = bpResultsCopy;

function buildCategory(key: CategoryKey): Category {
  const category = COPY.categories[key] as CategoryCopy;

  return {
    key,
    ...category,
    description: category.descriptionVariants[0],
    meaning: category.meaningVariants[0],
    recommendation: category.recommendationVariants[0],
  };
}

const CATEGORIES: Record<CategoryKey, Category> = {
  low: buildCategory("low"),
  normal: buildCategory("normal"),
  elevated: buildCategory("elevated"),
  stage1: buildCategory("stage1"),
  stage2: buildCategory("stage2"),
  crisis: buildCategory("crisis"),
};

function hashText(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickVariant(variants: string[], seed: string) {
  return variants[hashText(seed) % variants.length] ?? variants[0] ?? "";
}

function fillTemplate(template: string, params: TemplateParams) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(params[key] ?? ""));
}

function messageFrom(variants: string[], seed: string, params: TemplateParams = {}) {
  return fillTemplate(pickVariant(variants, `${seed}:${JSON.stringify(params)}`), params);
}

// Classification uses worst-value-wins: either the top or bottom number alone can raise the category.
// "A Little High" is the only category that requires BOTH (top 120–129 AND bottom < 80).
function classify(sys: number, dia: number): Category {
  if (sys >= 180 || dia >= 120) return CATEGORIES.crisis;
  if (sys >= 140 || dia >= 90)  return CATEGORIES.stage2;
  if (sys >= 130 || dia >= 80)  return CATEGORIES.stage1;
  if (sys >= 120 && dia < 80)   return CATEGORIES.elevated;
  if (sys < 90  || dia < 60)    return CATEGORIES.low;
  return CATEGORIES.normal;
}

function mean(vals: number[]): number {
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function maxDiff(vals: number[]): number {
  return Math.max(...vals) - Math.min(...vals);
}

export function analyzeReadings(readings: Reading[]): BPAnalysis {
  const warnings: string[] = [];
  const measurementNotes: string[] = [];
  let reliability = 100;
  let flaggedIndex: number | null = null;
  let firstExcluded = false;

  // ── Per-reading sanity checks ──
  readings.forEach((r, i) => {
    if (r.sys <= r.dia) {
      warnings.push(messageFrom(COPY.analysis.warnings.invalidOrder, "invalidOrder", {
        readingNumber: i + 1,
        sys: r.sys,
        dia: r.dia,
      }));
      reliability -= 20;
    }
    if (r.sys < 70 || r.sys > 250 || r.dia < 40 || r.dia > 150) {
      warnings.push(messageFrom(COPY.analysis.warnings.unusualRange, "unusualRange", {
        readingNumber: i + 1,
        sys: r.sys,
        dia: r.dia,
      }));
      reliability -= 15;
    }
    if (r.pulse !== undefined && (r.pulse < 30 || r.pulse > 220)) {
      warnings.push(messageFrom(COPY.analysis.warnings.unusualPulse, "unusualPulse", {
        readingNumber: i + 1,
        pulse: r.pulse,
      }));
      reliability -= 10;
    }
  });

  let usedIndices: number[] = readings.map((_, i) => i);

  if (readings.length === 3) {
    // ── Step 1: Find any reading that is very different from the other two ──
    const pairs = [
      { pair: [0, 1] as [number, number], outlier: 2 },
      { pair: [0, 2] as [number, number], outlier: 1 },
      { pair: [1, 2] as [number, number], outlier: 0 },
    ];

    let minPairDiff = Infinity;
    let closestPair = pairs[0];
    for (const p of pairs) {
      const diff = Math.abs(readings[p.pair[0]].sys - readings[p.pair[1]].sys);
      if (diff < minPairDiff) { minPairDiff = diff; closestPair = p; }
    }

    const outlierR = readings[closestPair.outlier];
    const pairAvgSys = mean([readings[closestPair.pair[0]].sys, readings[closestPair.pair[1]].sys]);

    if (Math.abs(outlierR.sys - pairAvgSys) > 20) {
      flaggedIndex = closestPair.outlier;
      usedIndices = [...closestPair.pair];
      measurementNotes.push(messageFrom(COPY.analysis.notes.outlier, "outlier", {
        readingNumber: closestPair.outlier + 1,
        sys: outlierR.sys,
        dia: outlierR.dia,
      }));
      reliability -= 10;
    } else {
      // ── Step 2: Check if first reading was higher due to first-test nerves ──
      // It is very common for the first reading to be a little higher because your body
      // is not fully relaxed yet. If readings 2 and 3 are noticeably lower, we drop reading 1.
      const laterSys = mean([readings[1].sys, readings[2].sys]);
      const laterDia = mean([readings[1].dia, readings[2].dia]);

      if (readings[0].sys - laterSys >= 10 || readings[0].dia - laterDia >= 5) {
        firstExcluded = true;
        usedIndices = [1, 2];
        measurementNotes.push(messageFrom(COPY.analysis.notes.firstExcludedThree, "firstExcludedThree", {
          sys: readings[0].sys,
          dia: readings[0].dia,
        }));
      } else {
        // ── Step 3: All readings are similar — use all three ──
        usedIndices = [0, 1, 2];
        const spread = maxDiff(readings.map((r) => r.sys));
        if (spread > 20) {
          warnings.push(messageFrom(COPY.analysis.warnings.spreadTooHigh, "spreadTooHigh", {
            spread,
          }));
          reliability -= 15;
        }
      }
    }
  } else if (readings.length === 2) {
    if (readings[0].sys - readings[1].sys >= 10 || readings[0].dia - readings[1].dia >= 5) {
      firstExcluded = true;
      usedIndices = [1];
      measurementNotes.push(messageFrom(COPY.analysis.notes.firstExcludedTwo, "firstExcludedTwo", {
        sys: readings[0].sys,
        dia: readings[0].dia,
      }));
    }
  }

  // ── Large spread across all readings ──
  if (readings.length >= 2) {
    const totalSpread = maxDiff(readings.map((r) => r.sys));
    if (totalSpread > 30 && flaggedIndex === null) {
      warnings.push(messageFrom(COPY.analysis.warnings.totalSpreadTooHigh, "totalSpreadTooHigh", {
        totalSpread,
      }));
    }
  }

  const usedReadings = usedIndices.map((i) => readings[i]);

  // ── Averaging ──
  const avgSysVal  = Math.round(mean(usedReadings.map((r) => r.sys)));
  const avgDiaVal  = Math.round(mean(usedReadings.map((r) => r.dia)));
  const pulseReadings = usedReadings.filter((r) => r.pulse !== undefined);
  const avgPulse = pulseReadings.length > 0
    ? Math.round(mean(pulseReadings.map((r) => r.pulse!)))
    : undefined;

  // ── Reading quality label ──
  const usedSpread = usedReadings.length > 1 ? maxDiff(usedReadings.map((r) => r.sys)) : 0;
  let qualityLabel: string;
  if (flaggedIndex !== null) {
    qualityLabel = messageFrom(COPY.analysis.qualityLabels.outlier, "qualityOutlier");
  } else if (usedSpread <= 5) {
    qualityLabel = messageFrom(COPY.analysis.qualityLabels.verySimilar, "qualityVerySimilar");
  } else if (usedSpread <= 10) {
    qualityLabel = messageFrom(COPY.analysis.qualityLabels.fairlySimilar, "qualityFairlySimilar");
  } else {
    qualityLabel = messageFrom(COPY.analysis.qualityLabels.changedTooMuch, "qualityChangedTooMuch");
    reliability -= 10;
  }

  reliability = Math.max(0, Math.min(100, reliability));

  const ageNote = messageFrom(COPY.analysis.ageNoteVariants, "ageNote");

  return {
    readings,
    usedReadings,
    usedIndices,
    flaggedIndex,
    firstExcluded,
    avg: { sys: avgSysVal, dia: avgDiaVal, pulse: avgPulse },
    category: classify(avgSysVal, avgDiaVal),
    reliability,
    qualityLabel,
    measurementNotes,
    warnings,
    ageNote,
  };
}
