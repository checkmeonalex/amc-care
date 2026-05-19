import Head from "next/head";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  CheckCircle,
  ChevronUp,
  Info,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import bpResultsCopy from "@/data/bp-results-copy.json";
import { analyzeReadings, type BPAnalysis, type CategoryKey, type Reading } from "@/lib/bp-analysis";
import type { BPSummaryResponse } from "@/pages/api/ai/bp-summary";
import styles from "@/styles/BPResults.module.css";


/* ── Sidebar article data by category ── */
type Article = { tag: string; title: string; time: string };
type SidebarData = { heading: string; articles: Article[] };
type CachedBPSummary = { readingsKey: string; summary: string };
type CachedResultCopy = { readingsKey: string; values: Record<string, string> };
type ResultCopy = {
  description: string;
  meaning: string;
  recommendation: string;
  aiError: string;
  reliabilityLabel: string;
};

const BP_READINGS_KEY = "bp_readings";
const BP_AI_SUMMARY_KEY = "bp_ai_summary";
const BP_RESULT_MESSAGE_KEY = "bp_result_message";
const COPY = bpResultsCopy;

const SIDEBAR: Record<CategoryKey, SidebarData> = {
  normal: {
    heading: "Staying heart-healthy",
    articles: [
      { tag: "Prevention", title: "How to maintain a healthy blood pressure long-term", time: "4 min" },
      { tag: "Lifestyle",  title: "The diet changes that actually lower blood pressure", time: "6 min" },
      { tag: "Monitoring", title: "How often should you check your BP at home?", time: "3 min" },
      { tag: "Exercise",   title: "Why 30 minutes of walking a day matters more than you think", time: "5 min" },
    ],
  },
  elevated: {
    heading: "Understanding elevated readings",
    articles: [
      { tag: "Explainer",    title: "What does 'elevated' blood pressure actually mean?", time: "4 min" },
      { tag: "Lifestyle",    title: "5 small changes that can lower your numbers this week", time: "5 min" },
      { tag: "Nutrition",    title: "How sodium raises blood pressure — and what to eat instead", time: "6 min" },
      { tag: "When to act",  title: "Should you see a doctor for elevated blood pressure?", time: "3 min" },
    ],
  },
  stage1: {
    heading: "Managing high blood pressure",
    articles: [
      { tag: "Guide",       title: "Stage 1 hypertension: what it means and what to do", time: "5 min" },
      { tag: "Lifestyle",   title: "Lifestyle changes that can be as effective as medication", time: "7 min" },
      { tag: "Medication",  title: "When do doctors recommend blood pressure medication?", time: "4 min" },
      { tag: "Monitoring",  title: "How to get an accurate home reading every time", time: "3 min" },
    ],
  },
  stage2: {
    heading: "Taking high blood pressure seriously",
    articles: [
      { tag: "Urgent",     title: "Stage 2 hypertension: why you need to see a doctor soon", time: "4 min" },
      { tag: "Treatment",  title: "How blood pressure medication works — and what to expect", time: "6 min" },
      { tag: "Risks",      title: "The long-term effects of untreated high blood pressure", time: "5 min" },
      { tag: "Diet",       title: "The DASH diet: designed specifically to lower blood pressure", time: "7 min" },
    ],
  },
  crisis: {
    heading: "Emergency information",
    articles: [
      { tag: "Emergency",    title: "Hypertensive crisis: signs, symptoms, and when to call for help", time: "4 min" },
      { tag: "Warning signs", title: "Symptoms that mean you need emergency care right now", time: "3 min" },
      { tag: "Recovery",     title: "What happens after a hypertensive crisis", time: "5 min" },
      { tag: "Prevention",   title: "How to prevent a future hypertensive emergency", time: "6 min" },
    ],
  },
  low: {
    heading: "Understanding low blood pressure",
    articles: [
      { tag: "Explainer",   title: "Why is my blood pressure low — and is it a problem?", time: "4 min" },
      { tag: "Symptoms",    title: "Dizziness, fainting, and fatigue: recognising low BP symptoms", time: "5 min" },
      { tag: "Lifestyle",   title: "Simple ways to manage low blood pressure at home", time: "4 min" },
      { tag: "When to act", title: "When low blood pressure needs medical attention", time: "3 min" },
    ],
  },
};

/* ── Helpers ── */
function reliabilityColor(score: number) {
  if (score >= 80) return "#4CAF50";
  if (score >= 60) return "#FF9800";
  return "#F44336";
}
function reliabilityBand(score: number): keyof typeof COPY.reliabilityLabels {
  if (score >= 90) return "high";
  if (score >= 75) return "moderate";
  return "low";
}

function getReadingsKey(readings: Reading[]) {
  return JSON.stringify(
    readings.map((reading) => ({
      sys: reading.sys,
      dia: reading.dia,
      pulse: reading.pulse ?? null,
    }))
  );
}

function readCachedBPSummary(readingsKey: string): string | null {
  const raw = sessionStorage.getItem(BP_AI_SUMMARY_KEY);
  if (!raw) return null;

  try {
    const cached = JSON.parse(raw) as Partial<CachedBPSummary>;
    return cached.readingsKey === readingsKey && typeof cached.summary === "string"
      ? cached.summary
      : null;
  } catch {
    sessionStorage.removeItem(BP_AI_SUMMARY_KEY);
    return null;
  }
}

function pickResultCopy(readingsKey: string, slot: string, variants: string[]) {
  const raw = sessionStorage.getItem(BP_RESULT_MESSAGE_KEY);
  let cached: CachedResultCopy = { readingsKey, values: {} };

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<CachedResultCopy>;
      if (parsed.readingsKey === readingsKey && parsed.values) {
        cached = { readingsKey, values: parsed.values };
        if (typeof parsed.values[slot] === "string") {
          return parsed.values[slot];
        }
      }
    } catch {
      sessionStorage.removeItem(BP_RESULT_MESSAGE_KEY);
    }
  }

  const message = variants[Math.floor(Math.random() * variants.length)] ?? variants[0] ?? "";
  cached.values[slot] = message;
  sessionStorage.setItem(
    BP_RESULT_MESSAGE_KEY,
    JSON.stringify(cached satisfies CachedResultCopy)
  );
  return message;
}

function buildResultCopy(readingsKey: string, analysis: BPAnalysis): ResultCopy {
  const band = reliabilityBand(analysis.reliability);

  return {
    description: pickResultCopy(
      readingsKey,
      `category:${analysis.category.key}:description`,
      analysis.category.descriptionVariants
    ),
    meaning: pickResultCopy(
      readingsKey,
      `category:${analysis.category.key}:meaning`,
      analysis.category.meaningVariants
    ),
    recommendation: pickResultCopy(
      readingsKey,
      `category:${analysis.category.key}:recommendation`,
      analysis.category.recommendationVariants
    ),
    aiError: pickResultCopy(readingsKey, "ai:error", COPY.page.aiErrorVariants),
    reliabilityLabel: pickResultCopy(
      readingsKey,
      `reliability:${band}`,
      COPY.reliabilityLabels[band]
    ),
  };
}

/* ── Sidebar article list (shared between desktop aside and mobile sheet) ── */
function ArticleList({ data, hideHeading }: { data: SidebarData; hideHeading?: boolean }) {
  return (
    <>
      {!hideHeading && <p className={styles.sidebarHead}>{data.heading}</p>}
      <div className={styles.articleList}>
        {data.articles.map((a, i) => (
          <a key={i} href="#" className={styles.articleItem}>
            <span className={styles.articleTag}>{a.tag}</span>
            <span className={styles.articleTitle}>{a.title}</span>
            <span className={styles.articleMeta}>
              {a.time} read <ArrowUpRight size={11} strokeWidth={2.5} />
            </span>
          </a>
        ))}
      </div>
      <div className={styles.sidebarPromo}>
        <p className={styles.sidebarPromoTitle}>Talk to a doctor about your result</p>
        <p className={styles.sidebarPromoSub}>
          Book a consultation with a GP or cardiologist near you — no waiting room required.
        </p>
        <a href="#" className={styles.sidebarPromoBtn}>
          <BookOpen size={13} strokeWidth={2.5} /> Find a doctor
        </a>
      </div>
    </>
  );
}

/* ── Draggable bottom sheet ── */
function DraggableSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const [dragY, setDragY] = useState(0);
  const startY = useRef<number | null>(null);
  const isDragging = useRef(false);

  function onPointerDown(e: React.PointerEvent) {
    startY.current = e.clientY;
    isDragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!isDragging.current || startY.current === null) return;
    const delta = Math.max(0, e.clientY - startY.current);
    setDragY(delta);
  }

  function onPointerUp() {
    isDragging.current = false;
    if (dragY > 80) {
      onClose();
    }
    setDragY(0);
    startY.current = null;
  }

  const sheetStyle: React.CSSProperties = open
    ? { transform: `translateY(${dragY}px)`, transition: dragY > 0 ? "none" : undefined }
    : {};

  return (
    <>
      <div
        className={`${styles.sheetOverlay} ${open ? styles.sheetOverlayVisible : ""}`}
        onClick={onClose}
      />
      <div className={`${styles.sheet} ${open ? styles.sheetOpen : ""}`} style={sheetStyle}>
        {/* Sticky nub + header — outside scroll area */}
        <div
          className={styles.sheetHeader}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <div className={styles.sheetHandle} />
          <div className={styles.sheetHeaderRow}>
            <span className={styles.sheetSectionTitle}>{title}</span>
            <button
              className={styles.sheetCloseBtn}
              onClick={onClose}
              aria-label={COPY.page.close}
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
        {/* Scrollable content */}
        <div className={styles.sheetContent}>
          {children}
        </div>
      </div>
    </>
  );
}

/* ── Page ── */
export default function BPResultsPage() {
  const [mounted, setMounted] = useState(false);
  const [analysis, setAnalysis] = useState<BPAnalysis | null>(null);
  const [readingsKey, setReadingsKey] = useState<string | null>(null);
  const [resultCopy, setResultCopy] = useState<ResultCopy | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiError, setAiError] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(BP_READINGS_KEY);
    setTimeout(() => {
      try {
        if (raw) {
          const readings: Reading[] = JSON.parse(raw);
          const nextReadingsKey = getReadingsKey(readings);
          const result = analyzeReadings(readings);
          const nextResultCopy = buildResultCopy(nextReadingsKey, result);
          setReadingsKey(nextReadingsKey);
          setAnalysis(result);
          setResultCopy(nextResultCopy);
        }
      } catch {}
      setMounted(true);
    }, 0);
  }, []);

  // Fetch AI summary once analysis is ready
  useEffect(() => {
    if (!analysis || !readingsKey) return;
    const cachedSummary = readCachedBPSummary(readingsKey);
    if (cachedSummary) {
      setTimeout(() => {
        setAiSummary(cachedSummary);
        setAiError(false);
      }, 0);
      return;
    }

    const { avg, category, reliability, qualityLabel, readings, usedIndices } = analysis;
    setTimeout(() => {
      setAiSummary(null);
      setAiError(false);
    }, 0);

    fetch("/api/ai/bp-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sys: avg.sys,
        dia: avg.dia,
        pulse: avg.pulse,
        qualityLabel,
        categoryKey: category.key,
        categoryLabel: category.label,
        reliability,
        readingsTotal: readings.length,
        readingsUsed: usedIndices.length,
      }),
    })
      .then((r) => r.json() as Promise<BPSummaryResponse>)
      .then((data) => {
        if ("summary" in data) {
          sessionStorage.setItem(
            BP_AI_SUMMARY_KEY,
            JSON.stringify({ readingsKey, summary: data.summary } satisfies CachedBPSummary)
          );
          setAiSummary(data.summary);
        } else {
          setAiError(true);
        }
      })
      .catch(() => setAiError(true));
  }, [analysis, readingsKey]);

  // Close sheet on Escape
  useEffect(() => {
    if (!sheetOpen && !detailsOpen) return;
    const handler = (e: KeyboardEvent) => { 
      if (e.key === "Escape") {
        setSheetOpen(false);
        setDetailsOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [sheetOpen, detailsOpen]);

  if (!mounted) {
    return (
      <>
        <Head>
          <title>{COPY.page.metaTitle}</title>
          <meta name="description" content={COPY.page.metaDescription} />
        </Head>
        <div className={styles.skeletonPage}>
          <div className={styles.skeletonContainer}>
            <div className={styles.skeletonHeader}>
              <div className={`${styles.skeletonBlock} ${styles.skeletonTitle}`} />
              <div className={`${styles.skeletonBlock} ${styles.skeletonSubtitle}`} />
            </div>
            <div className={styles.skeletonHero} />
            <div className={styles.skeletonCard}>
              <div className={`${styles.skeletonBlock} ${styles.skeletonLine} ${styles.w40}`} />
              <div className={`${styles.skeletonBlock} ${styles.skeletonLine} ${styles.w100}`} />
              <div className={`${styles.skeletonBlock} ${styles.skeletonLine} ${styles.w80}`} />
              <div className={`${styles.skeletonBlock} ${styles.skeletonLine} ${styles.w60}`} />
            </div>
            <div className={styles.skeletonCard}>
              <div className={`${styles.skeletonBlock} ${styles.skeletonLine} ${styles.w40}`} />
              <div className={`${styles.skeletonBlock} ${styles.skeletonBarWrap}`}>
                <div className={styles.skeletonBar} />
              </div>
              <div className={`${styles.skeletonBlock} ${styles.skeletonLine} ${styles.w60}`} />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!analysis) {
    return (
      <div className={styles.empty}>
        <p>{COPY.page.emptyReadings} <Link href="/blood-pressure">{COPY.page.takeMeasurement}</Link></p>
      </div>
    );
  }

  const {
    readings,
    usedIndices,
    flaggedIndex,
    firstExcluded,
    avg,
    category,
    reliability,
    qualityLabel,
    measurementNotes,
    warnings,
    ageNote,
  } = analysis;

  const sidebarData = SIDEBAR[category.key];

  return (
    <>
      <Head>
        <title>{COPY.page.metaTitle}</title>
        <meta name="description" content={COPY.page.metaDescription} />
      </Head>

      <main className={styles.page}>
        <div className={styles.container}>

          {/* Title */}
          <div className={styles.pageHeader}>
            <div className={styles.titleGroup}>
              <h1 className={styles.pageTitle}>{COPY.page.title}</h1>
              <Link href="/blood-pressure" className={styles.retakeLink}>
                <RotateCcw size={15} strokeWidth={2.5} /> {COPY.page.retake}
              </Link>
            </div>
            <p className={styles.pageSubtitle}>
              {readings.length} {readings.length === 1 ? COPY.page.readingSingular : COPY.page.readingPlural} · {COPY.page.averagedFrom} {usedIndices.length}
            </p>
          </div>

          {/* Hero result */}
          <div className={styles.resultCard} style={{ background: category.bg }}>
            <div className={styles.resultCardInner}>
              <div className={styles.resultHero}>
                <div className={styles.resultTop}>
                  <span className={styles.catBadge}>{category.label}</span>
                  {category.key === "crisis" && (
                    <div className={styles.emergencyBanner}>
                      <AlertTriangle size={15} strokeWidth={2.5} />
                      {COPY.page.emergencyBanner}
                    </div>
                  )}
                </div>

                <div className={styles.resultNumbers}>
                  <div className={styles.bigNum}>
                    <span className={styles.bigVal}>{avg.sys}</span>
                    <span className={styles.bigLabel}>{COPY.page.sys}</span>
                    <span className={styles.bigUnit}>{COPY.page.mmHg}</span>
                  </div>
                  <span className={styles.slash}>/</span>
                  <div className={styles.bigNum}>
                    <span className={styles.bigVal}>{avg.dia}</span>
                    <span className={styles.bigLabel}>{COPY.page.dia}</span>
                    <span className={styles.bigUnit}>{COPY.page.mmHg}</span>
                  </div>
                  {avg.pulse !== undefined && (
                    <div className={styles.pulseChip}>
                      <span>{avg.pulse}</span> {COPY.page.bpm}
                    </div>
                  )}
                </div>

                <p className={styles.resultDesc}>{resultCopy?.description ?? category.description}</p>

                <div className={styles.avgRow}>
                  {COPY.page.average} <strong>{avg.sys} / {avg.dia} {COPY.page.mmHg}</strong>
                  {avg.pulse !== undefined && <> &nbsp;·&nbsp; <strong>{avg.pulse} {COPY.page.bpm}</strong></>}
                </div>

                <button 
                  className={styles.mobileReadingsBtn}
                  onClick={() => setDetailsOpen(true)}
                >
                  {COPY.page.viewReadingDetails} <ArrowUpRight size={13} strokeWidth={2.5} />
                </button>
              </div>

              <div className={styles.desktopReadings}>
                <div className={styles.sectionInner}>
                  <p className={styles.sectionTitle}>{COPY.page.yourReadings}</p>
                  <div className={styles.readingsList}>
                    {readings.map((r, i) => {
                      const isUsed = usedIndices.includes(i);
                      const isFlagged = i === flaggedIndex;
                      const isAnxiety = !isUsed && !isFlagged && firstExcluded && i === 0;
                      let statusText = COPY.readingStatus.used;
                      if (isFlagged)      statusText = COPY.readingStatus.flagged;
                      else if (isAnxiety) statusText = COPY.readingStatus.firstExcluded;
                      else if (!isUsed)   statusText = COPY.readingStatus.excluded;
                      return (
                        <div
                          key={i}
                          className={`${styles.readingRow} ${isUsed ? styles.used : styles.excluded}`}
                        >
                          <span className={styles.readingIdx}>{i + 1}</span>
                          <div className={styles.readingVals}>
                            <span>{r.sys} <em>{COPY.page.sys}</em></span>
                            <span>{r.dia} <em>{COPY.page.dia}</em></span>
                            {r.pulse !== undefined && <span>{r.pulse} <em>{COPY.page.bpm}</em></span>}
                          </div>
                          <span className={styles.readingStatus}>{statusText}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content + sidebar */}
          <div className={styles.layout}>

            {/* ── Main content ── */}
            <div className={styles.main}>

              {/* AI section */}
              <div className={styles.aiSection}>
                <div className={styles.aiHeader}>
                  <p className={styles.sectionTitle} style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Sparkles size={16} strokeWidth={2.5} style={{ color: "#9c27b0" }} />
                    {COPY.page.aiOverview}
                  </p>
                  {!aiSummary && !aiError && (
                    <span className={styles.aiGenerating}>{COPY.page.aiGenerating}</span>
                  )}
                </div>
                {aiSummary ? (
                  <p className={styles.aiText}>{aiSummary}</p>
                ) : aiError ? (
                  <p className={styles.aiErrorText}>
                    {resultCopy?.aiError ?? COPY.page.aiErrorVariants[0]}
                  </p>
                ) : (
                  <div className={styles.aiPlaceholder}>
                    <div className={styles.aiLine} />
                    <div className={styles.aiLine} />
                    <div className={styles.aiLine} />
                    <div className={styles.aiLine} />
                  </div>
                )}
              </div>

              {/* Reliability (Full width breakout) */}
              <div className={styles.reliabilitySection}>
                <div className={styles.reliabilityInner}>
                  <p className={styles.sectionTitle}>{COPY.page.reliabilityTitle}</p>
                  <div className={styles.reliabilityMeta}>
                    <span className={styles.reliabilityScore}>
                      {reliability}
                      <small style={{ fontSize: "0.52em", color: "#bbb", fontWeight: 500 }}>{COPY.page.scoreSuffix}</small>
                    </span>
                    <span className={styles.reliabilityLabel}>
                      {resultCopy?.reliabilityLabel ?? COPY.reliabilityLabels[reliabilityBand(reliability)][0]}
                    </span>
                  </div>
                  <div className={styles.reliabilityTrack}>
                    <div
                      className={styles.reliabilityFill}
                      style={{ width: `${reliability}%`, background: reliabilityColor(reliability) }}
                    />
                  </div>
                  <div className={styles.qualityRow}>
                    <CheckCircle
                      size={13}
                      strokeWidth={2.5}
                      style={{ color: reliabilityColor(reliability), flexShrink: 0, marginTop: 1 }}
                    />
                    {qualityLabel}
                  </div>

                  {measurementNotes.length > 0 && (
                    <div className={styles.notes}>
                      {measurementNotes.map((n, i) => (
                        <div key={i} className={styles.noteItem}>
                          <Info size={13} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 1, color: "#1565C0" }} />
                          {n}
                        </div>
                      ))}
                    </div>
                  )}

                  {warnings.length > 0 && (
                    <div className={styles.warnings}>
                      {warnings.map((w, i) => (
                        <div key={i} className={styles.warningItem}>
                          <Info size={13} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 1, color: "#E65100" }} />
                          {w}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* What does this mean? */}
              <div className={styles.meaningSection}>
                <div className={styles.meaningInner}>
                  <p className={styles.sectionTitle}>{COPY.page.meaningTitle}</p>
                  <p className={styles.meaning}>{resultCopy?.meaning ?? category.meaning}</p>
                </div>
              </div>

              {/* What to do next */}
              <div className={styles.recommendationSection}>
                <div className={styles.recommendationInner}>
                  <p className={styles.sectionTitle}>{COPY.page.recommendationTitle}</p>
                  <p className={styles.meaning}>{resultCopy?.recommendation ?? category.recommendation}</p>
                </div>
              </div>

            </div>

            {/* ── Desktop sidebar ── */}
            <aside className={styles.sidebar}>
              <ArticleList data={sidebarData} />
            </aside>

          </div>

          {/* Age note */}
          <div className={styles.ageNote}>
            <Info size={12} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2, color: "#bbb" }} />
            {ageNote}
          </div>

          {/* CTAs */}
          <div className={styles.ctas}>
            <Link href="/blood-pressure" className={styles.retakeBtn}>
              <RotateCcw size={14} strokeWidth={2.5} /> {COPY.page.measureAgain}
            </Link>
          </div>

        </div>
      </main>

      {/* ── Mobile bottom bar + sheet ── */}
      <div className={styles.sheetBar}>
        <div className={styles.sheetBarLeft}>
          <span className={styles.sheetBarLabel}>{COPY.page.relatedReading}</span>
          <span className={styles.sheetBarTitle}>{sidebarData.heading}</span>
        </div>
        <button className={styles.sheetBarBtn} onClick={() => setSheetOpen(true)}>
          <ChevronUp size={14} strokeWidth={2.5} /> {sidebarData.articles.length} {COPY.page.articles}
        </button>
      </div>

      {/* Articles sheet */}
      <DraggableSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={sidebarData.heading}>
        <ArticleList data={sidebarData} hideHeading />
      </DraggableSheet>

      {/* Readings sheet */}
      <DraggableSheet open={detailsOpen} onClose={() => setDetailsOpen(false)} title={COPY.page.yourReadings}>
          <div className={styles.readingsList}>
            {readings.map((r, i) => {
              const isUsed = usedIndices.includes(i);
              const isFlagged = i === flaggedIndex;
              const isAnxiety = !isUsed && !isFlagged && firstExcluded && i === 0;
              let statusText = COPY.readingStatus.used;
              if (isFlagged)      statusText = COPY.readingStatus.flagged;
              else if (isAnxiety) statusText = COPY.readingStatus.firstExcluded;
              else if (!isUsed)   statusText = COPY.readingStatus.excluded;
              return (
                <div
                  key={i}
                  className={`${styles.readingRow} ${isUsed ? styles.used : styles.excluded}`}
                >
                  <span className={styles.readingIdx}>{i + 1}</span>
                  <div className={styles.readingVals}>
                    <span>{r.sys} <em>{COPY.page.sys}</em></span>
                    <span>{r.dia} <em>{COPY.page.dia}</em></span>
                    {r.pulse !== undefined && <span>{r.pulse} <em>{COPY.page.bpm}</em></span>}
                  </div>
                  <span className={styles.readingStatus}>{statusText}</span>
                </div>
              );
            })}
          </div>
          <div className={styles.avgRow} style={{ marginTop: "1rem" }}>
            {COPY.page.average} <strong>{avg.sys} / {avg.dia} {COPY.page.mmHg}</strong>
            {avg.pulse !== undefined && <> &nbsp;·&nbsp; <strong>{avg.pulse} {COPY.page.bpm}</strong></>}
          </div>

          <div style={{ marginTop: "2rem" }}>
            <Link href="/blood-pressure" className={styles.retakeBtn} style={{ width: "100%", justifyContent: "center" }}>
              <RotateCcw size={14} strokeWidth={2.5} /> {COPY.page.measureAgain}
            </Link>
          </div>
      </DraggableSheet>
    </>
  );
}
