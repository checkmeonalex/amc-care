import Head from "next/head";
import {
  Camera, RefreshCcw, Upload,
  CheckCircle2, AlertCircle, X, FlaskConical, Activity, Sparkles,
} from "lucide-react";
import { useRef, useState } from "react";
import type { ExtractResult, LabValue } from "@/pages/api/lab/extract";
import styles from "@/styles/LabResults.module.css";

type Stage = "idle" | "ready" | "extracting" | "done" | "error";

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

export default function LabResultsPage() {
  const [stage, setStage]         = useState<Stage>("idle");
  const [file, setFile]           = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult]       = useState<ExtractResult | null>(null);
  const [errorMsg, setErrorMsg]   = useState<string>("");
  const [imgAspect, setImgAspect] = useState<number>(0.707); // default A4 portrait
  const inputRef  = useRef<HTMLInputElement>(null);
  const abortRef  = useRef<AbortController | null>(null);

  const isImage = (f: File) => f.type.startsWith("image/");
  const isPdf   = (f: File) => f.type === "application/pdf";

  function handleFile(f: File) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(f);
    setFile(f);
    setPreviewUrl(url);
    setResult(null);
    setErrorMsg("");
    setStage("ready");

    // Read natural dimensions to size the scan frame
    if (f.type.startsWith("image/")) {
      const img = new window.Image();
      img.onload = () => {
        setImgAspect(img.naturalWidth / img.naturalHeight);
      };
      img.src = url;
    } else {
      setImgAspect(0.707); // A4 portrait for PDF/DOCX
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
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setErrorMsg("");
    setImgAspect(0.707);
    setStage("idle");
  }

  async function extract() {
    if (!file) return;
    setStage("extracting");
    setErrorMsg("");

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
        console.log("[Lab] extracted text:", r.text);
        console.log("[Lab] table text:",    r.tableText);
        setResult(r);
        setStage("done");
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
        <div className={styles.left}>

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
        </div>

        {/* ══════════════ RIGHT — Medical Results ══════════════ */}
        <div className={styles.right}>

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

          {/* Scanning — skeleton note card */}
          {stage === "extracting" && (
            <div className={styles.noteCard}>
              <div className={styles.noteHeader}>
                <div>
                  <p className={styles.noteTitle}>Lab report notes</p>
                  <p className={styles.noteFileMeta}>
                    {file ? `${fileIcon(file.name.split(".").pop() ?? "")} ${file.name}` : "Document"} · Analysing…
                  </p>
                </div>
                <div className={`${styles.noteStatus} ${styles.noteStatusBlink}`}>
                  <Sparkles size={12} strokeWidth={2} /> Analysing…
                </div>
              </div>

              <div className={styles.skeletonBody}>
                {[
                  [0.55, 0.88, 0.72],
                  [0.45, 0.91, 0.68, 0.80],
                  [0.38, 0.76, 0.60],
                  [0.42, 0.83, 0.70, 0.55],
                ].map((widths, gi) => (
                  <div key={gi} className={styles.skeletonGroup}>
                    <div className={styles.skeletonLabel} />
                    {widths.map((w, wi) => (
                      <div
                        key={wi}
                        className={styles.skeletonBar}
                        style={{ width: `${w * 100}%`, animationDelay: `${(gi * 4 + wi) * 80}ms` }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Done */}
          {stage === "done" && result && (
            <>
              {/* ── Clean document-style note card ── */}
              {(result.text || result.visionUsed) && (() => {
                const usingVision = result.visionUsed && !!result.vision;
                const sections    = usingVision
                  ? parseNoteText(result.vision!.text)
                  : parseNoteText(result.text);
                const today = new Date().toLocaleDateString("en-GB", {
                  day: "numeric", month: "short", year: "numeric",
                });
                const qualScore = result.quality?.score;
                const qualColor = qualScore == null ? "" : qualScore >= 70 ? "#059669" : qualScore >= 45 ? "#d97706" : "#ef4444";
                const qualBg    = qualScore == null ? "" : qualScore >= 70 ? "#d1fae5" : qualScore >= 45 ? "#fef3c7" : "#fee2e2";

                return (
                  <div className={styles.noteCard}>
                    {/* Header */}
                    <div className={styles.noteHeader}>
                      <div>
                        <p className={styles.noteTitle}>Lab report notes</p>
                        <p className={styles.noteFileMeta}>
                          {file ? `${fileIcon(file.name.split(".").pop() ?? "")} ${file.name}` : "Document"} · {today}
                        </p>
                      </div>
                      <div
                        className={styles.noteStatus}
                        style={usingVision ? { background: "#ede9fe", color: "#7c3aed" } : {}}
                      >
                        <Sparkles size={12} strokeWidth={2} />
                        {usingVision ? `Vision AI · ${result.vision!.model.split("/").pop()}` : validation ? `${validation.confidence}% match` : "Extracted"}
                      </div>
                    </div>

                    {/* Sections — each row pours in 28ms after the previous */}
                    <div className={styles.noteBody}>
                      {(() => {
                        let idx = 0;
                        return sections.map((sec, si) => {
                          const labelDelay = `${idx++ * 28}ms`;
                          return (
                            <div key={si} className={styles.noteSection}>
                              <p
                                className={styles.noteSectionLabel}
                                style={{ "--delay": labelDelay } as React.CSSProperties}
                              >
                                <span className={styles.noteSectionDot} style={{ background: sec.color }} />
                                {sec.label}:
                              </p>
                              {sec.lines.length > 0 ? sec.lines.map((line, li) => {
                                const lineDelay = `${idx++ * 28}ms`;
                                return (
                                  <span
                                    key={li}
                                    className={styles.noteLine}
                                    style={{ "--delay": lineDelay } as React.CSSProperties}
                                  >
                                    {line}
                                  </span>
                                );
                              }) : (
                                <span
                                  className={styles.noteLineEmpty}
                                  style={{ "--delay": `${idx++ * 28}ms` } as React.CSSProperties}
                                >
                                  No data detected in this section
                                </span>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Footer */}
                    <div className={styles.noteFooter}>
                      <span className={styles.noteFooterLabel}>
                        {result.wordCount} words · {result.charCount} chars · {usingVision ? `Vision AI (${result.vision!.model.split("/").pop()})` : "OCR extraction"}
                      </span>
                      {qualScore != null && (
                        <span
                          className={styles.noteQualityChip}
                          style={{ background: qualBg, color: qualColor }}
                        >
                          Quality {qualScore}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ── Structured lab values table ── */}
              {validation && (
                <div className={styles.resultsHeader}>
                  <div className={styles.resultsHeaderLeft}>
                    <CheckCircle2 size={16} strokeWidth={2.5} color="#059669" />
                    <span className={styles.resultsHeaderTitle}>Parsed Values</span>
                    <span className={styles.confidenceBadge}>{validation.confidence}% confidence</span>
                  </div>
                  <div className={styles.flagSummary}>
                    {validation.criticals.length > 0 && (
                      <span className={`${styles.flagChip} ${styles.flagChipCrit}`}>
                        ⚠ {validation.criticals.length} critical
                      </span>
                    )}
                    {validation.flagged.length > 0 && (
                      <span className={`${styles.flagChip} ${styles.flagChipWarn}`}>
                        {validation.flagged.length} flagged
                      </span>
                    )}
                    {validation.flagged.length === 0 && (
                      <span className={`${styles.flagChip} ${styles.flagChipOk}`}>
                        All clear
                      </span>
                    )}
                  </div>
                </div>
              )}

              {labValues.length > 0 && (
                <div className={styles.labTable}>
                  <div className={styles.labTableHead}>
                    <span className={styles.labTableHeadCell}>Test</span>
                    <span className={styles.labTableHeadCell}>Value</span>
                    <span className={styles.labTableHeadCell}>Unit</span>
                    <span className={styles.labTableHeadCell}>Ref. Range</span>
                    <span className={styles.labTableHeadCell}>Status</span>
                  </div>
                  {labValues.map((lv, i) => (
                    <div key={i} className={rowClass(lv.status)}>
                      <span className={styles.labTestName} title={lv.test}>{lv.test}</span>
                      <span className={styles.labValue}>{lv.value}</span>
                      <span className={styles.labUnit}>{lv.unit || "—"}</span>
                      <span className={styles.labRange}>{lv.referenceRange || "—"}</span>
                      <span className={`${styles.statusBadge} ${statusClass(lv.status)}`}>
                        {statusLabel(lv.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </>
  );
}
