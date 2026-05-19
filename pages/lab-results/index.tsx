import Head from "next/head";
import {
  Camera, RefreshCcw, Upload,
  CheckCircle2, AlertCircle, X, FlaskConical, Activity, Sparkles,
  ThumbsUp, ThumbsDown, Copy, BookOpen, ChevronDown, ChevronUp,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ExtractResult, LabValue } from "@/pages/api/lab/extract";
import type { ExplainResult } from "@/lib/ai/groq";
import styles from "@/styles/LabResults.module.css";
import ChatModal from "@/components/ChatModal";

type Stage = "idle" | "ready" | "extracting" | "done" | "error";
type ExplainStage = "idle" | "loading" | "done" | "error";

// ── Note card section definitions ────────────────────────────────────────────

type NoteSection = { label: string; color: string; emoji: string; lines: string[] };

const SECTION_MAP: { keywords: string[]; color: string; emoji: string; label: string }[] = [
  { keywords: ["HAEMATOLOGY","HAEMATOLOGICAL","FULL BLOOD COUNT","CBC","COMPLETE BLOOD"],        color: "#ef4444", emoji: "🩸", label: "Haematology"    },
  { keywords: ["BIOCHEMISTRY","BIOCHEMICAL","CHEMICAL PATHOLOGY"],                                color: "#d97706", emoji: "⚗️",  label: "Biochemistry"  },
  { keywords: ["ENDOCRINOLOGY","ENDOCRINE","THYROID","HORMONE","PROLACTIN","TSH","T3","T4"],      color: "#7c3aed", emoji: "🔬", label: "Endocrinology" },
  { keywords: ["SEROLOGY","SEROLOGICAL","HEPATITIS","WIDAL","VDRL","HIV","RPR","BRUCELLA"],       color: "#0d9488", emoji: "🧬", label: "Serology"       },
  { keywords: ["URINE","URINALYSIS","URIN"],                                                      color: "#2563eb", emoji: "💧", label: "Urinalysis"     },
  { keywords: ["PREGNANCY","OBSTETRIC","HCG","ANTENATAL"],                                        color: "#db2777", emoji: "🌸", label: "Pregnancy"      },
  { keywords: ["IMMUNOLOGY","IMMUNE","ALLERGY"],                                                  color: "#059669", emoji: "🛡",  label: "Immunology"    },
  { keywords: ["MICROBIOLOGY","CULTURE","SENSITIVITY","M/C/S","MCS"],                             color: "#ea580c", emoji: "🦠", label: "Microbiology"  },
  { keywords: ["LIPID","CHOLESTEROL","TRIGLYCERIDE","HDL","LDL","VLDL"],                          color: "#4f46e5", emoji: "💊", label: "Lipid Profile"  },
  { keywords: ["LIVER","HEPATIC","LFT","ALT","AST","ALP","BILIRUBIN","ALBUMIN"],                  color: "#65a30d", emoji: "🫀", label: "Liver Function" },
  { keywords: ["KIDNEY","RENAL","RFT","CREATININE","UREA","ELECTROLYTE","SODIUM","POTASSIUM"],    color: "#0284c7", emoji: "🫘", label: "Renal Function" },
];

function parseNoteText(text: string): NoteSection[] {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const sections: NoteSection[] = [];
  let current: NoteSection | null = null;
  const preamble: string[] = [];

  for (const line of lines) {
    const up = line.toUpperCase();
    const def = SECTION_MAP.find(s => s.keywords.some(k => up.includes(k)));
    // Treat as a header when: a known section keyword is found AND line is short (likely a header not data)
    if (def && line.length < 55) {
      current = { label: def.label, color: def.color, emoji: def.emoji, lines: [] };
      sections.push(current);
    } else if (current) {
      current.lines.push(line);
    } else {
      preamble.push(line);
    }
  }

  if (preamble.length > 0) {
    sections.unshift({ label: "Report Details", color: "#6b7280", emoji: "📋", lines: preamble });
  }
  if (sections.length === 0 && lines.length > 0) {
    return [{ label: "Extracted Text", color: "#6b7280", emoji: "📄", lines }];
  }

  return sections;
}


const ACCEPT = ".png,.jpg,.jpeg,.pdf,.docx";

function fileIcon(type: string) {
  if (["png", "jpg", "jpeg"].includes(type.toLowerCase())) return "🖼";
  if (type.toLowerCase() === "pdf") return "📄";
  return "📝";
}

function statusClass(status: LabValue["status"]): string {
  return {
    normal:   styles.statusNormal,
    high:     styles.statusHigh,
    low:      styles.statusLow,
    critical: styles.statusCritical,
    unknown:  styles.statusUnknown,
  }[status] ?? styles.statusUnknown;
}

function statusLabel(status: LabValue["status"]): string {
  return { normal: "OK", high: "H", low: "L", critical: "CRIT", unknown: "—" }[status] ?? "—";
}

function rowClass(status: LabValue["status"]): string {
  if (status === "critical") return `${styles.labRow} ${styles.labRowCritical}`;
  if (status === "high")     return `${styles.labRow} ${styles.labRowHigh}`;
  if (status === "low")      return `${styles.labRow} ${styles.labRowLow}`;
  return styles.labRow;
}

// ── Tag renderer ─────────────────────────────────────────────────────────────

type RenderTab = "summary" | "details";

const SUMMARY_TAGS = new Set(["overview", "insight"]);
const DETAILS_TAGS = new Set(["section", "abnormal", "critical"]);

function boldify(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i}>{p.slice(2, -2)}</strong>
      : p
  );
}

function paragraphs(text: string, baseClass: string, firstClass?: string): React.ReactNode[] {
  return text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean)
    .map((p, i) => (
      <p key={i} className={i === 0 && firstClass ? firstClass : baseClass}>
        {boldify(p)}
      </p>
    ));
}

function renderExplanation(raw: string, tab: RenderTab = "summary"): React.ReactNode[] {
  const TAG_RE = /<(overview|section|abnormal|critical|normal|insight)([^>]*)>([\s\S]*?)<\/\1>/g;

  // ── Summary tab: structured paragraphs — card wrapper lives in JSX ──────────
  if (tab === "summary") {
    const nodes: React.ReactNode[] = [];
    let m: RegExpExecArray | null;

    while ((m = TAG_RE.exec(raw)) !== null) {
      const [, tag, , inner] = m;
      if (tag === "overview") {
        nodes.push(...paragraphs(inner.trim(), styles.summaryOverview, styles.summaryOverviewFirst));
      } else if (tag === "insight") {
        nodes.push(
          <p key={m.index} className={styles.summaryInsight}>{boldify(inner.trim())}</p>
        );
      }
    }

    // Fallback: model returned plain text without tags
    if (nodes.length === 0 && raw.trim()) {
      const plain = raw.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim();
      if (plain) nodes.push(...paragraphs(plain, styles.summaryOverview, styles.summaryOverviewFirst));
    }

    return nodes;
  }

  // ── Details tab: sections with abnormal / critical rows ──────────────────────
  const nodes: React.ReactNode[] = [];
  let match: RegExpExecArray | null;
  let cardIndex = 0;

  while ((match = TAG_RE.exec(raw)) !== null) {
    const [, tag, attrs, inner] = match;
    const content = inner.trim();
    const key     = match.index;
    const delay   = `${cardIndex++ * 55}ms`;

    if (tag === "section") {
      const label  = attrs.match(/label="([^"]+)"/)?.[1] ?? "Results";
      const inner2 = renderExplanation(content, "details");
      if (inner2.length === 0) continue;
      nodes.push(
        <div key={key} className={styles.expSection} style={{ animationDelay: delay }}>
          <p className={styles.expSectionLabel}>{label}</p>
          {inner2}
        </div>
      );
    } else if (tag === "abnormal") {
      nodes.push(
        <div key={key} className={styles.expAbnormal} style={{ animationDelay: delay }}>
          {boldify(content)}
        </div>
      );
    } else if (tag === "critical") {
      nodes.push(
        <div key={key} className={styles.expCritical} style={{ animationDelay: delay }}>
          {boldify(content)}
        </div>
      );
    }
  }

  return nodes;
}

// ── Cache helpers ─────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const CACHE_VERSION = "v4"; // bump when prompt changes

function cacheKey(f: File) {
  return `amc_explain_${CACHE_VERSION}_${f.name}_${f.size}_${f.lastModified}`;
}

function readCache(f: File): ExplainResult | null {
  try {
    const raw = localStorage.getItem(cacheKey(f));
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: ExplainResult; ts: number };
    if (Date.now() - ts > CACHE_TTL_MS) { localStorage.removeItem(cacheKey(f)); return null; }
    return data;
  } catch { return null; }
}

function writeCache(f: File, data: ExplainResult) {
  try { localStorage.setItem(cacheKey(f), JSON.stringify({ data, ts: Date.now() })); } catch { /* quota */ }
}

// ── Session persistence (survives reload) ────────────────────────────────────

const SESSION_KEY = "amc_lab_session";

type SessionState = {
  dataUrl: string;
  name: string;
  size: number;
  lastModified: number;
  type: string;
  aspect: number;
};

function saveSession(state: SessionState) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(state)); } catch { /* quota */ }
}

function loadSession(): SessionState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionState) : null;
  } catch { return null; }
}

function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* */ }
}

function sessionToFile(s: SessionState): File | null {
  try {
    const parts = s.dataUrl.split(",");
    if (parts.length < 2 || !parts[1]) return null;
    const mime  = parts[0].match(/:(.*?);/)?.[1] ?? s.type;
    const bytes = atob(parts[1]);
    const arr   = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new File([arr], s.name, { type: mime, lastModified: s.lastModified });
  } catch {
    return null;
  }
}

// ── Typewriter constants ──────────────────────────────────────────────────────
const CHARS_PER_TICK = 10;
const TICK_MS        = 16;

export default function LabResultsPage() {
  const [stage, setStage]             = useState<Stage>("idle");
  const [file, setFile]               = useState<File | null>(null);
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null);
  const [result, setResult]           = useState<ExtractResult | null>(null);
  const [errorMsg, setErrorMsg]       = useState<string>("");
  const [imgAspect, setImgAspect]     = useState<number>(0.707);
  const [explainStage, setExplainStage] = useState<ExplainStage>("idle");
  const [explanation, setExplanation] = useState<ExplainResult | null>(null);
  const [typedCount, setTypedCount]   = useState<number>(0);
  const [activeTab, setActiveTab]     = useState<RenderTab>("details");
  const [scanCollapsed, setScanCollapsed] = useState(false);
  const [chatOpen, setChatOpen]           = useState(false);
  const inputRef   = useRef<HTMLInputElement>(null);
  const abortRef   = useRef<AbortController | null>(null);
  const dataUrlRef = useRef<string>("");
  const aspectRef  = useRef<number>(0.707);
  const rightRef   = useRef<HTMLDivElement>(null);

  // Auto-collapse scanner on mobile when scan completes
  useEffect(() => {
    if (stage === "done" && typeof window !== "undefined" && window.innerWidth < 960) {
      const t = setTimeout(() => setScanCollapsed(true), 220);
      return () => clearTimeout(t);
    }
    if (stage === "idle" || stage === "ready") {
      setScanCollapsed(false);
    }
  }, [stage]);

  // Typewriter: whenever explanation changes, count up from 0 to full length
  useEffect(() => {
    if (!explanation) return;
    setTypedCount(0);
    const full = explanation.explanation;
    let count = 0;
    const timer = setInterval(() => {
      count = Math.min(count + CHARS_PER_TICK, full.length);
      setTypedCount(count);
      if (count >= full.length) clearInterval(timer);
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [explanation]);

  // Safe display text: slice to last complete closing tag so parser never sees broken XML
  const displayText = useMemo(() => {
    if (!explanation) return "";
    const full  = explanation.explanation;
    const slice = full.slice(0, typedCount);
    if (typedCount >= full.length) return full; // fully typed — return exact string
    const lastClose = slice.lastIndexOf("</");
    if (lastClose === -1) return "";
    const closeEnd = slice.indexOf(">", lastClose);
    return closeEnd === -1 ? slice.slice(0, lastClose) : slice.slice(0, closeEnd + 1);
  }, [explanation, typedCount]);

  const isImage = (f: File) => f.type.startsWith("image/");
  const isPdf   = (f: File) => f.type === "application/pdf";

  // Restore session on mount
  useEffect(() => {
    const session = loadSession();
    if (!session) return;
    const restoredFile = sessionToFile(session);
    if (!restoredFile) { clearSession(); return; }
    const cached = readCache(restoredFile);
    if (!cached) { clearSession(); return; }
    setFile(restoredFile);
    setPreviewUrl(session.dataUrl);
    setImgAspect(session.aspect);
    setStage("done");
    setExplanation(cached);
    setExplainStage("done");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFile(f: File) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(f);
    setFile(f);
    setPreviewUrl(url);
    setResult(null);
    setErrorMsg("");
    setStage("ready");

    if (f.type.startsWith("image/")) {
      // Read as base64 for session persistence + get natural dimensions
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        dataUrlRef.current = dataUrl;
        const img = new window.Image();
        img.onload = () => {
          const aspect = img.naturalWidth / img.naturalHeight;
          aspectRef.current = aspect;
          setImgAspect(aspect);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(f);
    } else {
      dataUrlRef.current = "";
      aspectRef.current  = 0.707;
      setImgAspect(0.707);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    clearSession();
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setErrorMsg("");
    setImgAspect(0.707);
    setStage("idle");
    setExplanation(null);
    setExplainStage("idle");
    setActiveTab("details");
  }

  async function explain(visionText: string, currentFile: File, dataUrl: string, aspect: number) {
    // Check cache first — play from cache with typewriter, skip Groq call
    const cached = readCache(currentFile);
    if (cached) {
      saveSession({ dataUrl, name: currentFile.name, size: currentFile.size, lastModified: currentFile.lastModified, type: currentFile.type, aspect });
      setExplanation(cached);
      setExplainStage("done");
      return;
    }

    setExplainStage("loading");
    try {
      const res  = await fetch("/api/lab/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: visionText }),
      });
      const data = await res.json();
      if ("error" in data) {
        setExplainStage("error");
      } else {
        const result = data as ExplainResult;
        writeCache(currentFile, result);
        saveSession({ dataUrl, name: currentFile.name, size: currentFile.size, lastModified: currentFile.lastModified, type: currentFile.type, aspect });
        setExplanation(result);
        setExplainStage("done");
      }
    } catch {
      setExplainStage("error");
    }
  }

  async function extract() {
    if (!file) return;
    setStage("extracting");
    setErrorMsg("");
    setExplanation(null);
    setExplainStage("idle");
    setActiveTab("details");

    // Auto-scroll to results panel on mobile
    if (typeof window !== "undefined" && window.innerWidth < 960) {
      setTimeout(() => rightRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const form = new FormData();
    form.append("file", file);

    try {
      const res  = await fetch("/api/lab/extract", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      const data = await res.json();

      if ("error" in data) {
        setErrorMsg(data.error);
        setStage("error");
      } else {
        const r = data as ExtractResult;
        setResult(r);
        setStage("done");
        // Kick off Groq explanation using vision text if available, else OCR text
        const textForGroq = r.visionUsed && r.vision?.text ? r.vision.text : r.text;
        if (textForGroq) explain(textForGroq, file, dataUrlRef.current, aspectRef.current);
      }
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (isAbort) {
        setStage("ready");
      } else {
        setErrorMsg("Network error — please try again.");
        setStage("error");
      }
    } finally {
      abortRef.current = null;
    }
  }

  function stopScan() {
    abortRef.current?.abort("user-cancelled");
  }

  function rescan() {
    extract();
  }

  const busy = stage === "extracting";
  const validation = result?.validation;
  const labValues  = validation?.labValues ?? [];

  return (
    <>
      <Head>
        <title>Lab Result Analysis — AMC Care</title>
        <meta name="description" content="Upload your lab result for medical analysis." />
      </Head>

      <main className={styles.page}>

        {/* ══════════════ LEFT — Scanner ══════════════ */}
        <div className={`${styles.left} ${scanCollapsed ? styles.leftCollapsed : ""}`}>

          {/* Mobile collapsed bar */}
          <div className={styles.scanBar}>
            <button className={styles.scanBarToggle} onClick={() => setScanCollapsed(v => !v)}>
              <FlaskConical size={13} strokeWidth={2.2} />
              <span>{file?.name ?? "Lab Scan"}</span>
              {scanCollapsed ? <ChevronDown size={14} strokeWidth={2.5} /> : <ChevronUp size={14} strokeWidth={2.5} />}
            </button>
            <div className={styles.scanBarActions}>
              <button className={styles.scanBarBtn} onClick={reset} title="New scan">
                <RefreshCcw size={13} strokeWidth={2.5} />
                <span>New</span>
              </button>
              <button className={styles.scanBarBtn} onClick={rescan} title="Rescan">
                <Activity size={13} strokeWidth={2.5} />
                <span>Rescan</span>
              </button>
            </div>
          </div>

          {/* Main scanner content — hidden on mobile when collapsed */}
          <div className={styles.scanContent}>

          <div className={styles.panelHeader}>
            <span className={styles.chip}>
              <FlaskConical size={11} strokeWidth={2.5} /> Lab Results
            </span>
            <h1 className={styles.panelTitle}>Scan document</h1>
            <p className={styles.panelSub}>Image, PDF or DOCX — we detect and analyse every value.</p>
          </div>

          {/* Scan frame — aspect ratio matches uploaded document */}
          <div
            className={styles.scanFrameWrapper}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            <div
              className={styles.scanArea}
              style={{ aspectRatio: String(imgAspect) }}
              data-state={stage}
            >
              {/* Corner brackets */}
              <span className={`${styles.corner} ${styles.cornerTL}`} />
              <span className={`${styles.corner} ${styles.cornerTR}`} />
              <span className={`${styles.corner} ${styles.cornerBL}`} />
              <span className={`${styles.corner} ${styles.cornerBR}`} />

              {/* Idle */}
              {stage === "idle" && (
                <div className={styles.scanIdle}>
                  <div className={styles.idleIcon}>
                    <Camera size={28} strokeWidth={1.4} />
                  </div>
                  <p className={styles.idleText}>Align document inside frame</p>
                  <p className={styles.idleHint}>or drag & drop a file here</p>
                </div>
              )}

              {/* Image preview */}
              {previewUrl && file && isImage(file) && stage !== "idle" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Document preview" className={styles.previewImg} />
              )}

              {/* PDF preview */}
              {previewUrl && file && isPdf(file) && stage !== "idle" && (
                <iframe src={previewUrl} className={styles.previewPdf} title="PDF preview" />
              )}

              {/* DOCX / other */}
              {file && !isImage(file) && !isPdf(file) && stage !== "idle" && (
                <div className={styles.previewFile}>
                  <span className={styles.previewFileIcon}>{fileIcon(file.name.split(".").pop() ?? "")}</span>
                  <span className={styles.previewFileName}>{file.name}</span>
                  <span className={styles.previewFileSize}>{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              )}

              {/* Scanning beam */}
              {stage === "extracting" && <div className={styles.scanBeam} />}

              {stage === "extracting" && (
                <div className={styles.scanLabel}>
                  <span className={styles.scanDot} />
                  Analysing…
                </div>
              )}

              {/* Stop — bottom-left corner, away from the beam label */}
              {stage === "extracting" && (
                <button className={styles.stopBtn} onClick={stopScan} aria-label="Stop scan">
                  <span className={styles.stopIcon} />
                  Stop
                </button>
              )}

              {/* Done badge */}
              {stage === "done" && (
                <div className={styles.doneBadge}>
                  <CheckCircle2 size={13} strokeWidth={2.5} /> Done
                </div>
              )}

              {/* Error overlay */}
              {stage === "error" && (
                <div className={styles.errorOverlay}>
                  <AlertCircle size={24} strokeWidth={1.8} />
                  <p>{errorMsg}</p>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className={styles.controls}>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className={styles.hiddenInput}
              onChange={onInputChange}
            />

            {stage === "idle" && (
              <div className={styles.uploadRow}>
                <button className={styles.uploadBtn} onClick={() => inputRef.current?.click()}>
                  <Camera size={16} strokeWidth={2} /> Scan / Photo
                </button>
                <button className={styles.uploadBtnSecondary} onClick={() => inputRef.current?.click()}>
                  <Upload size={14} strokeWidth={2} /> Upload file
                </button>
              </div>
            )}

            {stage === "ready" && (
              <div className={styles.actionRow}>
                <button className={styles.ctaBtn} onClick={extract}>
                  <Activity size={15} strokeWidth={2.5} /> Analyse
                </button>
                <button className={styles.ghostBtn} onClick={() => inputRef.current?.click()}>
                  Choose different file
                </button>
              </div>
            )}

            {stage === "extracting" && (
              <div className={styles.extractingStatus}>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} />
                </div>
                <p className={styles.extractingHint}>
                  {file && isPdf(file) ? "Parsing PDF…" : file && isImage(file) ? "Running OCR + medical analysis…" : "Reading document…"}
                </p>
              </div>
            )}

            {(stage === "done" || stage === "error") && (
              <div className={styles.actionRow}>
                <button className={styles.ghostBtn} onClick={reset}>
                  <RefreshCcw size={13} strokeWidth={2.5} /> New scan
                </button>
                <button className={styles.rescanBtn} onClick={rescan}>
                  <Activity size={13} strokeWidth={2.5} /> Rescan
                </button>
              </div>
            )}

            {/* File pill */}
            {file && stage !== "idle" && (
              <div className={styles.filePill}>
                <span>{fileIcon(file.name.split(".").pop() ?? "")}</span>
                <span className={styles.filePillName}>{file.name}</span>
                <span className={styles.filePillSize}>{(file.size / 1024).toFixed(0)} KB</span>
                {!busy && (
                  <button className={styles.filePillRemove} onClick={reset} aria-label="Remove file">
                    <X size={11} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Left-side error panel */}
          {stage === "error" && (
            <div className={styles.errorPanel}>
              <AlertCircle size={16} strokeWidth={2} />
              <div>
                <p className={styles.errorTitle}>Analysis failed</p>
                <p className={styles.errorMsg}>{errorMsg}</p>
              </div>
              <button className={styles.retryBtn} onClick={extract}>Retry</button>
            </div>
          )}

          </div>{/* end scanContent */}
        </div>

        {/* ══════════════ RIGHT — Medical Results ══════════════ */}
        <div className={styles.right} ref={rightRef}>

          {/* Idle / ready */}
          {(stage === "idle" || stage === "ready") && (
            <div className={styles.resultsEmpty}>
              <div className={styles.resultsEmptyIcon}>
                <FlaskConical size={22} strokeWidth={1.6} />
              </div>
              <p className={styles.resultsEmptyText}>
                {stage === "idle" ? "Upload a lab result to begin" : "Click Analyse to extract values"}
              </p>
              <p className={styles.resultsEmptyHint}>Results appear here after analysis</p>
            </div>
          )}

          {/* Doc animation — holds through scan + Groq wait */}
          {(stage === "extracting" || (stage === "done" && explainStage !== "done" && explainStage !== "error")) && (
            <div className={styles.extractingRight}>
              <div className={styles.extractDoc}>
                <div className={styles.extractDocLines}>
                  {[
                    { w: "68%" },
                    { w: "82%" },
                    { pair: ["42%", "32%"] },
                    { w: "75%" },
                    { w: "55%" },
                    { pair: ["38%", "28%"] },
                    { w: "70%" },
                  ].map((row, i) =>
                    "pair" in row ? (
                      <div key={i} className={styles.extractDocLinePair}>
                        <div className={styles.extractDocLine} style={{ width: row.pair![0], animationDelay: `${i * 150}ms` }} />
                        <div className={styles.extractDocLine} style={{ width: row.pair![1], animationDelay: `${i * 150 + 75}ms` }} />
                      </div>
                    ) : (
                      <div key={i} className={styles.extractDocLine} style={{ width: row.w, animationDelay: `${i * 150}ms` }} />
                    )
                  )}
                </div>
                <div className={styles.extractDocAccent} />
              </div>
              <h2 className={styles.extractingTitle}>AI extracting your information</h2>
              <p className={styles.extractingSubtitle}>Please wait while we analyse your document</p>
            </div>
          )}

          {/* Groq error */}
          {stage === "done" && explainStage === "error" && (
            <div className={styles.explainError}>
              <AlertCircle size={14} strokeWidth={2} />
              Could not generate explanation
            </div>
          )}

          {/* Tab UI — only once Groq has responded */}
          {stage === "done" && explainStage === "done" && (
            <div className={styles.explainPanel}>

              {/* Tab bar — always shown once stage is done */}
              <div className={styles.tabBar}>
                <div className={styles.tabSegment}>
                  <button
                    className={`${styles.tab} ${activeTab === "details" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("details")}
                  >
                    <span className={styles.attentionDot} />
                    Attention
                  </button>
                  <button
                    className={`${styles.tab} ${activeTab === "summary" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("summary")}
                  >
                    Summary
                  </button>
                </div>
                {explainStage === "done" && explanation && (
                  <div className={styles.explainMeta}>
                    <span className={styles.explainModel}>{explanation.model}</span>
                  </div>
                )}
              </div>

              {/* ── SUMMARY TAB ── */}
              {activeTab === "summary" && (
                <>
                  {/* Scrollable content */}
                  <div className={styles.explainBody}>
                    <div className={styles.summaryCard}>
                      <div className={styles.summaryHeader}>
                        <div className={styles.summaryHeaderIcon}>
                          <Sparkles size={13} strokeWidth={2.2} />
                        </div>
                        <div>
                          <p className={styles.summaryTitle}>Lab Summary</p>
                          <p className={styles.summaryDate}>
                            Generated {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      {explanation && (
                        <div className={styles.summaryContent}>
                          {renderExplanation(explanation.explanation, "summary")}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions pinned at bottom — always visible */}
                  {explanation && (
                    <div className={styles.summaryActions}>
                      <button className={styles.summaryActionBtn} title="Helpful"><ThumbsUp size={14} strokeWidth={2} /></button>
                      <button className={styles.summaryActionBtn} title="Not helpful"><ThumbsDown size={14} strokeWidth={2} /></button>
                      <button
                        className={styles.summaryActionBtn}
                        title="Copy summary"
                        onClick={() => navigator.clipboard.writeText(explanation.explanation)}
                      >
                        <Copy size={14} strokeWidth={2} />
                      </button>
                      <button className={styles.summaryAskBtn} onClick={() => setChatOpen(true)}>
                        <Sparkles size={13} strokeWidth={2} />
                        Ask a question
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ── ATTENTION TAB ── */}
              {activeTab === "details" && explanation && (
                <div className={styles.explainBody}>
                  <div className={styles.attentionHeader}>
                    <BookOpen size={14} strokeWidth={2} />
                    Flagged Values
                  </div>

                  {(() => {
                    const blocks = renderExplanation(displayText, "details");
                    const hasBlocks = blocks.length > 0;
                    const stillTyping = typedCount < explanation.explanation.length;
                    return (
                      <>
                        {blocks}
                        {/* Bubble only after first block has appeared, while more are coming */}
                        {hasBlocks && stillTyping && (
                          <div className={styles.typingBubble}>
                            <span className={styles.typingDot} />
                            <span className={styles.typingDot} />
                            <span className={styles.typingDot} />
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

            </div>
          )}

          <ChatModal
            open={chatOpen}
            onClose={() => setChatOpen(false)}
            context={explanation?.explanation ?? ""}
            storageKey={file ? `${file.name}_${file.size}_${file.lastModified}` : "default"}
          />
        </div>
      </main>
    </>
  );
}
